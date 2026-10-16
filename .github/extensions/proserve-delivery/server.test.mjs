import assert from "node:assert/strict";
import { get } from "node:http";
import test from "node:test";
import { startServer } from "./server.mjs";

const data = {
  fetchedAt: "2026-10-16T09:00:00Z",
  repository: "ministryofjustice/data-platform",
  issues: [{ number: 1, epic: false, status: "Done" }],
};

test("serves the report and fixed asset allowlist on loopback", async (t) => {
  const { server, url } = await startServer({
    loadData: async () => data,
    refreshData: async () => data,
    logError: assert.fail,
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  assert.equal(server.address().address, "127.0.0.1");
  const report = await fetch(url);
  const html = await report.text();
  assert.equal(report.status, 200);
  assert.equal(report.headers.get("cache-control"), "no-store");
  assert.match(
    report.headers.get("content-security-policy"),
    /script-src 'self'/,
  );
  assert.match(html, /Milestones at a glance/);
  assert.match(html, /Original report/);
  assert(html.indexOf("/canvas.css") > html.indexOf("</style>"));
  for (const [path, type] of [
    ["client.js", "text/javascript"],
    ["canvas.css", "text/css"],
    ["data", "application/json"],
  ]) {
    const asset = await fetch(url + path);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get("content-type"), new RegExp(type));
    await asset.text();
  }
  assert.equal((await fetch(url + "data.mjs")).status, 404);
  assert.equal((await fetch(url + "reference.html")).status, 404);
  const rejectedHost = await new Promise((resolve, reject) => {
    get(url, { headers: { Host: "untrusted.example" } }, (response) => {
      response.resume();
      resolve(response.statusCode);
    }).on("error", reject);
  });
  assert.equal(rejectedHost, 403);
});

test("refresh requires both the local origin and action header", async (t) => {
  let calls = 0;
  const { server, url } = await startServer({
    loadData: async () => data,
    refreshData: async () => {
      calls++;
      return data;
    },
    logError: assert.fail,
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  for (const headers of [
    {},
    { Origin: url.slice(0, -1) },
    { Origin: "https://untrusted.example", "X-Canvas-Action": "refresh" },
  ]) {
    assert.equal(
      (await fetch(url + "refresh", { method: "POST", headers })).status,
      403,
    );
  }
  assert.equal(calls, 0);
  const response = await fetch(url + "refresh", {
    method: "POST",
    headers: { Origin: url.slice(0, -1), "X-Canvas-Action": "refresh" },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).counts.Done, 1);
  assert.equal(calls, 1);
});

test("initial GitHub failure leaves the original report accessible and errors explicit", async (t) => {
  const errors = [];
  const fail = async () => {
    throw new Error("Authenticate gh and grant project access");
  };
  const { server, url } = await startServer({
    loadData: fail,
    refreshData: fail,
    logError: (error) => errors.push(error.message),
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  assert.equal((await fetch(url)).status, 200);
  const response = await fetch(url + "data");
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Authenticate gh and grant project access",
  });
  assert.deepEqual(errors, ["Authenticate gh and grant project access"]);
});
