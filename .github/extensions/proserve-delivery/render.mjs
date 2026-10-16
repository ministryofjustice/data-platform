import { readFile } from "node:fs/promises";

export async function renderHtml() {
  const reference = await readFile(
    new URL("reference.html", import.meta.url),
    "utf8",
  );
  const controls = `
<header class="canvas-tools" aria-label="Report controls">
  <div class="tools-inner">
    <div class="view-switch" role="group" aria-label="Report view">
      <button id="current-view" type="button" aria-pressed="true">Current GitHub data</button>
      <button id="original-view" type="button" aria-pressed="false">Original report</button>
    </div>
    <div class="tool-actions">
      <button id="refresh" type="button">Refresh from GitHub</button>
      <button id="print" type="button">Print / save PDF</button>
    </div>
  </div>
  <p id="source-status" class="tools-inner source-status" role="status">Loading saved GitHub snapshot...</p>
  <p id="error" class="tools-inner error" role="alert" hidden></p>
</header>`;
  return reference
    .replace(
      "<head>",
      `<head>
<!-- THESIS: Recreate the supplied delivery report, with honest source attribution.
OWN-WORLD: White report, grey rules, compact tables, blue milestones and semantic status pills.
STORY: Read summary, milestone gates, phase scope and tickets; switch to the untouched report.
FIRST VIEWPORT: Source controls, report title, four task metrics and six milestone cards.
FORM: User-pinned report composition; responsive tables preserve the original information. -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/client.js" defer></script>`,
    )
    .replace("</style>", '</style><link rel="stylesheet" href="/canvas.css">')
    .replace("<body>", `<body>${controls}`);
}
