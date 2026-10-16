# JDP delivery progress canvas

This repository-scoped Copilot extension recreates the ProServe Justice Data
Platform (JDP) delivery report. It includes the supplied report as a fixed
reference and a view backed by GitHub issues labelled `pro-serve`.

## Open the report

Download and install the [GitHub Copilot app](https://github.com/github/app/releases/latest)
for your operating system, then sign in with your GitHub account. Use a version
that supports extension canvases. The app supplies the Copilot SDK and Node.js
runtime; there are no extension packages to install and no APM setup is needed.

Install the [GitHub CLI](https://cli.github.com/) on the machine running the
Copilot session, then authenticate:

```bash
gh auth login
```

Your account needs read access to `ministryofjustice/data-platform` and the
[Justice Data Platform project board](https://github.com/orgs/ministryofjustice/projects/167).
For a classic OAuth token, project access may require the `read:project` scope:

```bash
gh auth refresh --scopes read:project
```

To try this pull request before it is merged, check out its branch:

```bash
gh repo clone ministryofjustice/data-platform
cd data-platform
gh pr checkout 902
```

If you already have a clone, run `gh pr checkout 902` from that checkout instead.
After the pull request is merged, use an up-to-date checkout of `main`.

Add the local `data-platform` folder as a project in the GitHub Copilot app and
start a session in that project. If you already have a session using this
checkout, ask Copilot to reload extensions. Then ask:

> Open the JDP delivery progress canvas.

The canvas type is `proserve-delivery`. When opening it through a tool, supply
`{"documentId":"jdp-delivery"}` as its input. The extension ID is
`project:proserve-delivery` if another installed canvas has the same type.

Use **Current GitHub data** or **Original report** to switch views,
**Refresh from GitHub** to fetch a new snapshot, and **Print / save PDF** to
export the selected view. The source register supports searching and filtering
all labelled issues, including epics and excluded issues.

## Understand the data

The current view reads issue state and the project board's `Status` field.
Completed issues count as done. Open issues without a board status are shown as
unknown rather than assumed to be to do. Epics and issues closed as not planned
are excluded from the headline work-item totals.

Milestone dates, phase scope, sprint assignments, risk narrative and exit criteria
come from `reference.html`, the supplied report. They are not inferred from
GitHub milestones. Gate achievements and schedule confidence are not
independently verified. The current view replaces historical phase percentages
with counts of unique linked issues; these are not estimates of effort or
overall phase completion. The original view preserves the supplied report,
including its historical inconsistencies.

The report loads the last saved snapshot, fetching from GitHub if none exists.
It shows the fetch time; use refresh when you need up-to-date data. A failed
refresh displays an error and leaves the previous snapshot intact. If the
initial fetch fails, the original report remains available with an error notice.

Snapshots are saved outside the checkout at:

```text
$COPILOT_HOME/extensions/proserve-delivery/artifacts/ministryofjustice-data-platform/report-data.json
```

`COPILOT_HOME` defaults to `~/.copilot`. The cache is shared between this user's
checkouts of this repository. No credentials are stored in it. The HTTP server
binds only to `127.0.0.1` on an automatically assigned port.

## Maintain the extension

Update `reference.html` when the delivery team provides a revised report.
`client.js` maps its scope tables and linked issue references into the current
view, so changes to the report's headings or table structure must be checked
against both views. Keep the distinction between planning context and live
status explicit.

`data.mjs` holds the repository, label and project-board query. It rejects
truncated responses instead of publishing partial totals. Its current limits
are 100 labelled issues, 20 project memberships per issue and 50 fields per
membership. Add pagination before those limits are reached.

After changing extension files, reload extensions and reopen the canvas.
Run the dependency-free tests from the repository root with Node.js 20 or later:

```bash
node --test .github/extensions/proserve-delivery/*.test.mjs
```
