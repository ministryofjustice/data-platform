import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createDataStore,
  parseResponse,
  statusFor,
  summarise,
} from "./data.mjs";

function issue(number, overrides = {}) {
  return {
    number,
    title: `Story: Work item ${number}`,
    state: "OPEN",
    stateReason: null,
    url: `https://github.com/ministryofjustice/data-platform/issues/${number}`,
    updatedAt: "2026-10-16T09:00:00Z",
    milestone: null,
    projectItems: {
      nodes: [
        {
          project: {
            url: "https://github.com/orgs/ministryofjustice/projects/167",
          },
          fieldValues: {
            nodes: [{ name: "In Review", field: { name: "Status" } }],
            pageInfo: { hasNextPage: false },
          },
        },
      ],
      pageInfo: { hasNextPage: false },
    },
    ...overrides,
  };
}

function response(nodes = [issue(1)]) {
  return {
    data: {
      repository: { issues: { nodes, pageInfo: { hasNextPage: false } } },
    },
  };
}

test("closed issue state overrides board status; missing status stays unknown", () => {
  assert.equal(
    statusFor({
      state: "CLOSED",
      stateReason: "COMPLETED",
      boardStatus: "In Review",
    }),
    "Done",
  );
  assert.equal(
    statusFor({
      state: "CLOSED",
      stateReason: "NOT_PLANNED",
      boardStatus: "Done",
    }),
    "Not planned",
  );
  assert.equal(
    statusFor({ state: "OPEN", boardStatus: "In Progress" }),
    "In Progress",
  );
  assert.equal(statusFor({ state: "OPEN" }), "Unknown");
});

test("reads the correct project's status without mistaking another field for Status", () => {
  const item = issue(1);
  item.projectItems.nodes.unshift({
    project: { url: "https://github.com/orgs/ministryofjustice/projects/999" },
    fieldValues: {
      nodes: [{ name: "Done", field: { name: "Status" } }],
      pageInfo: { hasNextPage: false },
    },
  });
  item.projectItems.nodes[1].fieldValues.nodes.unshift({
    name: "High",
    field: { name: "Priority" },
  });
  assert.equal(parseResponse(response([item])).issues[0].status, "In Review");
});

test("keeps untracked issues and reconciles work items, epics and cancelled issues", () => {
  const data = parseResponse(
    response([
      issue(1, { state: "CLOSED", stateReason: "COMPLETED" }),
      issue(2),
      issue(3, { title: "Epic: Parent" }),
      issue(4, { state: "CLOSED", stateReason: "NOT_PLANNED" }),
      issue(5, {
        title: "Epic: Cancelled",
        state: "CLOSED",
        stateReason: "NOT_PLANNED",
      }),
      issue(6, {
        projectItems: { nodes: [], pageInfo: { hasNextPage: false } },
      }),
    ]),
  );
  const summary = summarise(data);
  assert.equal(summary.taskCount, 3);
  assert.deepEqual(summary.counts, { Done: 1, "In Review": 1, Unknown: 1 });
  assert.equal(summary.epicCount, 1);
  assert.deepEqual(summary.excludedIssues, [4, 5]);
  assert.equal(
    summary.taskCount + summary.epicCount + summary.excludedIssues.length,
    summary.labelledIssues,
  );
});

test("rejects GitHub errors and missing or truncated responses", () => {
  assert.throws(
    () => parseResponse({ errors: [{ message: "Project access denied" }] }),
    /Project access denied/,
  );
  assert.throws(() => parseResponse({}), /missing/);
  const payload = response();
  payload.data.repository.issues.pageInfo.hasNextPage = true;
  assert.throws(() => parseResponse(payload), /incomplete totals/);
  for (const level of ["project", "field"]) {
    const item = issue(1);
    const connection =
      level === "project"
        ? item.projectItems
        : item.projectItems.nodes[0].fieldValues;
    connection.pageInfo.hasNextPage = true;
    assert.throws(() => parseResponse(response([item])), /incomplete/);
  }
});

test("fetches an absent snapshot once, coalesces refreshes, and persists outside the extension", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "proserve-data-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let calls = 0;
  const store = createDataStore({
    directory,
    run: async (command, args, options) => {
      calls++;
      assert.equal(command, "gh");
      assert.deepEqual(args.slice(0, 3), ["api", "graphql", "-f"]);
      assert.match(args[3], /labels: \["pro-serve"\]/);
      assert.equal(options.timeout, 45000);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { stdout: JSON.stringify(response()) };
    },
  });
  const [first, second] = await Promise.all([
    store.refreshData(),
    store.refreshData(),
  ]);
  assert.deepEqual(first, second);
  assert.equal(calls, 1);
  assert.deepEqual(await store.loadData(), first);
  assert.equal(calls, 1);
  assert.deepEqual(await readdir(directory), ["report-data.json"]);
  if (process.platform !== "win32")
    assert.equal(
      (await stat(join(directory, "report-data.json"))).mode & 0o777,
      0o600,
    );
  await rm(join(directory, "report-data.json"));
  assert.equal((await store.loadData()).issues.length, 1);
  assert.equal(calls, 2);
});

test("a failed refresh retains the saved snapshot and allows retry", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "proserve-retry-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let fail = false;
  const store = createDataStore({
    directory,
    run: async () => {
      if (fail) throw new Error("GitHub unavailable");
      return { stdout: JSON.stringify(response()) };
    },
  });
  await store.refreshData();
  const before = await readFile(join(directory, "report-data.json"), "utf8");
  fail = true;
  await assert.rejects(store.refreshData(), /GitHub unavailable/);
  assert.equal(
    await readFile(join(directory, "report-data.json"), "utf8"),
    before,
  );
  fail = false;
  assert.equal((await store.refreshData()).issues.length, 1);
});

test("does not silently replace a corrupt cache or publish an invalid response", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "proserve-invalid-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "report-data.json"), "invalid json");
  const store = createDataStore({
    directory,
    run: async () => ({ stdout: '{"errors":[{"message":"denied"}]}' }),
  });
  await assert.rejects(store.loadData(), SyntaxError);
  await assert.rejects(store.refreshData(), /denied/);
  assert.equal(
    await readFile(join(directory, "report-data.json"), "utf8"),
    "invalid json",
  );
});
