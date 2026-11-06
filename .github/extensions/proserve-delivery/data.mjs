import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const exec = promisify(execFile);
const boardUrl = "https://github.com/orgs/ministryofjustice/projects/167";
const query = `query {
  repository(owner: "ministryofjustice", name: "data-platform") {
    issues(first: 100, labels: ["pro-serve"], orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        number title state stateReason url updatedAt
        milestone { title dueOn }
        projectItems(first: 20) {
          nodes {
            project { title url }
            fieldValues(first: 50) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name field { ... on ProjectV2SingleSelectField { name } }
                }
              }
              pageInfo { hasNextPage }
            }
          }
          pageInfo { hasNextPage }
        }
      }
      pageInfo { hasNextPage }
    }
  }
}`;

export function statusFor(issue) {
  if (issue.state === "CLOSED") {
    return issue.stateReason === "COMPLETED" ? "Done" : "Not planned";
  }
  return issue.boardStatus || "Unknown";
}

export function summarise(data) {
  const tasks = data.issues.filter(
    (issue) => !issue.epic && issue.status !== "Not planned",
  );
  const counts = {};
  for (const issue of tasks)
    counts[issue.status] = (counts[issue.status] || 0) + 1;
  return {
    fetchedAt: data.fetchedAt,
    repository: data.repository,
    boardUrl: data.boardUrl,
    labelledIssues: data.issues.length,
    taskCount: tasks.length,
    counts,
    epicCount: data.issues.filter(
      (issue) => issue.epic && issue.status !== "Not planned",
    ).length,
    excludedIssues: data.issues
      .filter((issue) => issue.status === "Not planned")
      .map((issue) => issue.number),
  };
}

export function parseResponse(payload) {
  if (payload.errors?.length)
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  const connection = payload.data?.repository?.issues;
  if (!connection || connection.pageInfo.hasNextPage) {
    throw new Error(
      "The issue response is missing or exceeds 100 items; refusing to publish incomplete totals.",
    );
  }
  const issues = connection.nodes.map((issue) => {
    if (
      issue.projectItems.pageInfo.hasNextPage ||
      issue.projectItems.nodes.some(
        (item) => item.fieldValues.pageInfo.hasNextPage,
      )
    ) {
      throw new Error(
        `Project fields for #${issue.number} are incomplete; refusing to guess its status.`,
      );
    }
    const board = issue.projectItems.nodes.find(
      (item) => item.project.url === boardUrl,
    );
    const boardStatus = board?.fieldValues.nodes.find(
      (field) => field.field?.name === "Status",
    )?.name;
    const clean = {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      stateReason: issue.stateReason,
      url: issue.url,
      updatedAt: issue.updatedAt,
      milestone: issue.milestone,
      boardStatus: boardStatus || null,
      epic: /^Epic:/i.test(issue.title),
    };
    return { ...clean, status: statusFor(clean) };
  });
  return {
    documentId: "jdp-delivery",
    repository: "ministryofjustice/data-platform",
    boardUrl,
    fetchedAt: new Date().toISOString(),
    issues,
  };
}

export function createDataStore({ directory, run = exec }) {
  const dataFile = join(directory, "report-data.json");
  let refreshing;

  async function refreshData() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      const { stdout } = await run(
        "gh",
        ["api", "graphql", "-f", `query=${query}`],
        {
          timeout: 45000,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      const data = parseResponse(JSON.parse(stdout));
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const temporary = join(directory, `report-data.${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, JSON.stringify(data, null, 2) + "\n", {
          mode: 0o600,
        });
        await rename(temporary, dataFile);
      } finally {
        await unlink(temporary).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
      return data;
    })();
    try {
      return await refreshing;
    } finally {
      refreshing = undefined;
    }
  }

  async function loadData() {
    try {
      return JSON.parse(await readFile(dataFile, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return refreshData();
      throw error;
    }
  }
  return { loadData, refreshData };
}

export const { loadData, refreshData } = createDataStore({
  directory: join(
    process.env.COPILOT_HOME || join(homedir(), ".copilot"),
    "extensions",
    "proserve-delivery",
    "artifacts",
    "ministryofjustice-data-platform",
  ),
});
