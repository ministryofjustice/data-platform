const wrap = document.querySelector(".wrap");
const original = wrap.innerHTML;
const sourceStatus = document.querySelector("#source-status");
const errorBox = document.querySelector("#error");
let data;
let view = "current";
const classes = {
  Done: "t-ok",
  "In Review": "t-rev",
  "In Progress": "t-prog",
  TODO: "t-todo",
  "Not planned": "t-todo",
};
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const tag = (status) =>
  `<span class="tag ${classes[status] || "t-gap"}">${escapeHtml(status)}</span>`;
const shortTitle = (issue) =>
  issue.title.replace(/^(Story|Spike|Task|Epic):\s*/i, "");
const refs = (text) =>
  [...text.matchAll(/#(\d+)/g)].map((match) => Number(match[1]));
const issueFor = (number) =>
  data.issues.find((issue) => issue.number === number);
const issueLink = (number) =>
  `<a href="https://github.com/ministryofjustice/data-platform/issues/${number}" target="_blank" rel="noopener noreferrer">#${number}</a>`;
const tasks = () =>
  data.issues.filter((issue) => !issue.epic && issue.status !== "Not planned");
const countsText = (items) =>
  ["Done", "In Review", "In Progress", "TODO", "Unknown", "Not planned"]
    .map((status) => ({
      status,
      count: items.filter((item) => item.status === status).length,
    }))
    .filter(({ count }) => count)
    .map(({ status, count }) => `${count} ${status.toLowerCase()}`)
    .join(" / ");

function tableAfter(title) {
  const heading = [...wrap.querySelectorAll("h2")].find((element) =>
    element.textContent.startsWith(title),
  );
  let element = heading?.nextElementSibling;
  while (element && element.tagName !== "TABLE" && element.tagName !== "H2")
    element = element.nextElementSibling;
  return element?.tagName === "TABLE" ? element : null;
}

function addNote(html) {
  const note = document.createElement("div");
  note.className = "source-note";
  note.innerHTML = html;
  wrap.querySelector("h1").after(note);
}

function linkReferences() {
  const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (
      !walker.currentNode.parentElement.closest("a, script, style") &&
      /#\d+/.test(walker.currentNode.textContent)
    )
      nodes.push(walker.currentNode);
  }
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    const text = node.textContent;
    let offset = 0;
    for (const match of text.matchAll(/#(\d+)/g)) {
      fragment.append(text.slice(offset, match.index));
      const anchor = document.createElement("a");
      anchor.href = `https://github.com/ministryofjustice/data-platform/issues/${match[1]}`;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = match[0];
      fragment.append(anchor);
      offset = match.index + match[0].length;
    }
    fragment.append(text.slice(offset));
    node.replaceWith(fragment);
  }
}

function updateCurrent() {
  const items = tasks();
  wrap.querySelector(".kpis").innerHTML = [
    ["Done", "green"],
    ["In Review", "blue"],
    ["In Progress", "amber"],
    ["TODO", ""],
  ]
    .map(([status, colour]) => {
      const matching = items.filter((issue) => issue.status === status);
      return `<div class="kpi ${colour}"><div class="l">${status === "TODO" ? "To do" : status}</div><div class="v">${matching.length}</div><div class="d">${matching.map((issue) => issueLink(issue.number)).join(", ") || "No work items"}</div></div>`;
    })
    .join("");
  const extra = items.filter(
    (issue) =>
      !["Done", "In Review", "In Progress", "TODO"].includes(issue.status),
  );
  addNote(`<p><strong>GitHub snapshot:</strong> ${items.length} non-epic work items labelled <code>pro-serve</code>. ${data.issues.filter((issue) => issue.epic).length} epics are listed separately; issues closed as not planned are excluded from these totals.</p>
<p>Statuses come from the <a href="${escapeHtml(data.boardUrl)}" target="_blank" rel="noopener noreferrer">Justice Data Platform board</a>; completed issues count as done. ${extra.length ? `<strong>${extra.length} item(s) have an unrecognised or missing status and are not in the four headline totals.</strong>` : ""}</p>
<p><strong>Planning context:</strong> milestone dates, phase scope, sprint assignments, exit criteria and risk narrative below are from the supplied report, not GitHub milestones. Its milestone achievements and schedule confidence have not been independently verified. Current ticket status does not prove a gate was met.</p>`);
  const kpiNote = document.createElement("p");
  kpiNote.className = "current-caption";
  kpiNote.textContent =
    "Each work item is counted once. Epics are not added to their child tasks.";
  wrap.querySelector(".kpis").after(kpiNote);

  const accessNote =
    wrap.querySelector(".kpis").nextElementSibling.nextElementSibling;
  accessNote.prepend("Original report context: ");
  wrap.querySelector(".mstrip").previousElementSibling.textContent =
    "Delivery-team gates reproduced from the supplied report. The report records M0 and M1 as hit, M2 as hit at S2 close, and plans M3 to M5 through the 18 December MVP demo. These are not the repository's GitHub milestone due dates.";
  wrap.querySelectorAll(".mcard .mstat").forEach((element) => {
    element.textContent = `Report: ${element.textContent}`;
  });
  wrap.querySelector(".nowline")?.remove();
  wrap.querySelectorAll(".tl .lab").forEach((element) => {
    element.textContent = element.textContent.replace(" (now)", "");
  });

  const phaseTables = [...wrap.querySelectorAll(".scope-tbl")];
  const phaseItems = phaseTables.map((table) => {
    const numbers = new Set();
    table.querySelectorAll("tbody tr").forEach((row) => {
      if (row.cells.length !== 4) return;
      const cell = row.cells[2];
      const found = [...new Set(refs(cell.textContent))]
        .map(issueFor)
        .filter(Boolean);
      const pilotPattern =
        /pilot application|proves the pattern|proves the mechanism/.test(
          cell.textContent,
        );
      if (pilotPattern) {
        row.cells[3].innerHTML = `${tag("Not tracked")}<span class="note-s">Linked spike is ${escapeHtml(found[0]?.status || "unknown")}; pilot application has no separate ticket in this report.</span>`;
      } else if (!found.length) {
        row.cells[3].innerHTML = `${tag("Not tracked")}<span class="note-s">No linked issue; status not inferred.</span>`;
      } else {
        found.forEach((issue) => numbers.add(issue.number));
        row.cells[3].innerHTML = found
          .map((issue) => `${issueLink(issue.number)} ${tag(issue.status)}`)
          .join("<br>");
      }
    });
    return [...numbers].map(issueFor);
  });
  const phaseOverview = tableAfter("Which phase");
  phaseOverview.querySelectorAll("tbody tr").forEach((row, index) => {
    row.cells[4].innerHTML = `${tag("Not assessed")}<span class="note-s">${escapeHtml(countsText(phaseItems[index]))}. Schedule confidence requires delivery-team confirmation.</span>`;
  });
  const scorecard = tableAfter("Phase scorecard");
  scorecard.querySelectorAll("tbody tr").forEach((row, index) => {
    const linked = phaseItems[index];
    const completed = linked.filter((issue) => issue.status === "Done").length;
    const percent = linked.length
      ? Math.round((completed / linked.length) * 100)
      : 0;
    row.cells[2].innerHTML = `<div class="bar" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Linked issues complete"><span style="width:${percent}%"></span></div><span class="bar-label">${completed} / ${linked.length} linked items done (${percent}%)</span>`;
    row.cells[3].innerHTML = tag("Not assessed");
    row.cells[4].textContent = `${countsText(linked)}. This is a count of unique linked issues (including linked epics), not an estimate of effort, phase completion or schedule health. Unticketed scope is excluded.`;
  });
  const risks = [...wrap.querySelectorAll("h2")].find(
    (heading) => heading.textContent === "Risks and dependencies",
  );
  risks.textContent += " (original report narrative)";
  wrap.querySelector(".foot").textContent =
    "Task status: current GitHub snapshot. Planning narrative: supplied JDP Delivery Progress Overview. Phase percentages are calculated from linked issues, not copied from the report.";
  const plan = wrap.querySelector(".plan");
  plan.querySelector("thead tr").lastElementChild.textContent =
    "Current linked-item status";
  plan.querySelectorAll("tbody tr").forEach((row) => {
    const linked = [...new Set(refs(row.cells[3].textContent))]
      .map(issueFor)
      .filter(Boolean);
    row.cells[5].textContent = linked.length
      ? countsText(linked)
      : "No linked issues yet";
    row.querySelectorAll("ul.items li").forEach((li) => {
      const issue = issueFor(refs(li.textContent)[0]);
      if (issue && li.querySelector(".tag"))
        li.querySelector(".tag").outerHTML = tag(issue.status);
    });
  });
  const planCaption = document.createElement("p");
  planCaption.className = "current-caption";
  planCaption.textContent =
    "Sprint dates and membership are from the original report. Status pills show the latest snapshot, not the status at sprint close; carry-over claims are not recalculated.";
  plan.before(planCaption);
  const textWalker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
  while (textWalker.nextNode())
    textWalker.currentNode.textContent =
      textWalker.currentNode.textContent.replace(/\bMoJ\b/g, "MOJ");
  appendIssueRegister();
}

function appendIssueRegister() {
  const section = document.createElement("section");
  section.innerHTML = `<h2>Source register: all pro-serve issues</h2>
<p class="current-caption">Includes epics and excluded issues for traceability. GitHub milestone due dates below are separate from the report's sprint gates.</p>
<div class="issue-filters"><label>Find an issue<input id="issue-search" type="search" placeholder="Issue number or title"></label>
<label>Status<select id="issue-status"><option value="">All statuses</option>${[
    ...new Set(data.issues.map((issue) => issue.status)),
  ]
    .sort()
    .map((status) => `<option>${escapeHtml(status)}</option>`)
    .join("")}</select></label>
<output id="result-count" aria-live="polite"></output></div>
<table><thead><tr><th>Issue</th><th>Type</th><th>Status</th><th>GitHub milestone</th><th>Included in headline?</th></tr></thead><tbody id="issue-rows"></tbody></table>`;
  wrap.append(section);
  function filter() {
    const query = document
      .querySelector("#issue-search")
      .value.toLowerCase()
      .replace(/^#/, "");
    const status = document.querySelector("#issue-status").value;
    const matching = data.issues.filter(
      (issue) =>
        `${issue.number} ${issue.title}`.toLowerCase().includes(query) &&
        (!status || issue.status === status),
    );
    document.querySelector("#issue-rows").innerHTML = matching.length
      ? matching
          .map(
            (issue) => `<tr>
<td class="issue-title">${issueLink(issue.number)} ${escapeHtml(shortTitle(issue))}</td>
<td>${issue.epic ? "Epic" : "Work item"}</td><td>${tag(issue.status)}</td>
<td>${issue.milestone ? `${escapeHtml(issue.milestone.title)}${issue.milestone.dueOn ? `<br><span class="current-caption">Due ${escapeHtml(issue.milestone.dueOn.slice(0, 10))}</span>` : ""}` : "None"}</td>
<td>${issue.epic ? "No: epic" : issue.status === "Not planned" ? "No: closed as not planned" : "Yes"}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="5">No issues match these filters.</td></tr>';
    document.querySelector("#result-count").textContent =
      `${matching.length} of ${data.issues.length} issues`;
  }
  document.querySelector("#issue-search").addEventListener("input", filter);
  document.querySelector("#issue-status").addEventListener("change", filter);
  filter();
}

function render() {
  wrap.innerHTML = original;
  document
    .querySelector("#current-view")
    .setAttribute("aria-pressed", String(view === "current"));
  document
    .querySelector("#original-view")
    .setAttribute("aria-pressed", String(view === "original"));
  if (view === "current") {
    updateCurrent();
  } else {
    addNote(
      "<p><strong>Original report:</strong> the supplied document is reproduced below with its original figures, dates, assessments and inconsistencies. This is a fixed reference, not refreshed GitHub data.</p>",
    );
  }
  linkReferences();
  wrap.querySelectorAll('a[target="_blank"]').forEach((anchor) => {
    anchor.rel = "noopener noreferrer";
  });
  wrap.querySelectorAll("table").forEach((table) => {
    const scroll = document.createElement("div");
    scroll.className = "table-scroll";
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", "Scrollable report table");
    table.before(scroll);
    scroll.append(table);
  });
  sourceStatus.textContent = `${view === "current" ? "Current view" : "Original view"} · GitHub last fetched ${new Date(data.fetchedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · ministryofjustice/data-platform · pro-serve`;
}

async function load() {
  const response = await fetch("/data");
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Could not load the GitHub snapshot.",
    );
  data = await response.json();
  render();
}

document.querySelector("#original-view").addEventListener("click", () => {
  if (data) {
    view = "original";
    render();
  }
});
document.querySelector("#current-view").addEventListener("click", () => {
  if (data) {
    view = "current";
    render();
  }
});
document
  .querySelector("#print")
  .addEventListener("click", () => window.print());
document.querySelector("#refresh").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Refreshing...";
  errorBox.hidden = true;
  try {
    const response = await fetch("/refresh", {
      method: "POST",
      headers: { "X-Canvas-Action": "refresh" },
    });
    if (!response.ok)
      throw new Error(
        (await response.json()).error || "GitHub refresh failed.",
      );
    await load();
  } catch (error) {
    errorBox.textContent = `Refresh failed. The previous snapshot is retained. ${error.message}`;
    errorBox.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Refresh from GitHub";
  }
});
load().catch((error) => {
  errorBox.textContent = `Could not load current data. The document below is the original report only. ${error.message}`;
  errorBox.hidden = false;
  sourceStatus.textContent = "GitHub snapshot unavailable";
  document.querySelector("#current-view").setAttribute("aria-pressed", "false");
  document.querySelector("#original-view").setAttribute("aria-pressed", "true");
});
