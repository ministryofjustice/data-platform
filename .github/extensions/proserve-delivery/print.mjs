import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function openPrintView(
  origin,
  view,
  { platform = process.platform, run = exec } = {},
) {
  const url = new URL("/", origin);
  url.searchParams.set("view", view);
  url.searchParams.set("print", "1");
  if (platform === "darwin") {
    await run("/usr/bin/open", [url.href]);
  } else if (platform === "win32") {
    await run("rundll32.exe", ["url.dll,FileProtocolHandler", url.href]);
  } else if (platform === "linux") {
    await run("xdg-open", [url.href]);
  } else {
    throw new Error(`Opening a print view is not supported on ${platform}.`);
  }
}
