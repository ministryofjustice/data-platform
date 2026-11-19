import assert from "node:assert/strict";
import test from "node:test";
import { openPrintView } from "./print.mjs";

test("opens a fixed loopback print URL using platform commands without a shell", async () => {
  for (const [platform, command, prefix] of [
    ["darwin", "/usr/bin/open", []],
    ["win32", "rundll32.exe", ["url.dll,FileProtocolHandler"]],
    ["linux", "xdg-open", []],
  ]) {
    for (const view of ["current", "original"]) {
      const calls = [];
      await openPrintView("http://127.0.0.1:1234", view, {
        platform,
        run: async (...args) => calls.push(args),
      });
      assert.deepEqual(calls, [
        [command, [...prefix, `http://127.0.0.1:1234/?view=${view}&print=1`]],
      ]);
    }
  }
});

test("browser launch failures are surfaced", async () => {
  await assert.rejects(
    openPrintView("http://127.0.0.1:1234", "current", {
      platform: "linux",
      run: async () => {
        throw new Error("No desktop browser available");
      },
    }),
    /No desktop browser available/,
  );
  await assert.rejects(
    openPrintView("http://127.0.0.1:1234", "current", {
      platform: "unsupported",
    }),
    /not supported/,
  );
});
