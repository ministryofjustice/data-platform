import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { summarise } from "./data.mjs";
import { renderHtml } from "./render.mjs";
import { openPrintView } from "./print.mjs";

const assets = new Map([
  ["/client.js", ["client.js", "text/javascript; charset=utf-8"]],
  ["/canvas.css", ["canvas.css", "text/css; charset=utf-8"]],
]);

export async function startServer({
  loadData,
  refreshData,
  logError,
  openPrint = openPrintView,
}) {
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'",
    );
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      if (req.headers.host !== new URL(origin).host) {
        res.writeHead(403).end("Only the loopback canvas host is allowed.");
        return;
      }
      const url = new URL(req.url, origin);
      if (
        req.method === "POST" &&
        ["/refresh", "/print"].includes(url.pathname)
      ) {
        if (
          req.headers.origin !== origin ||
          req.headers["x-canvas-action"] !== url.pathname.slice(1)
        ) {
          res
            .writeHead(403)
            .end("Actions require a same-origin canvas request.");
          return;
        }
        if (url.pathname === "/print") {
          const view = url.searchParams.get("view");
          if (!["current", "original"].includes(view)) {
            res
              .writeHead(400)
              .end("Choose the current or original report view.");
            return;
          }
          await openPrint(origin, view);
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              message:
                "Report opened in your system browser. Use its print dialogue to print or save as PDF. Keep this canvas open until you finish.",
            }),
          );
          return;
        }
        const data = await refreshData();
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(summarise(data)));
      } else if (req.method === "GET" && url.pathname === "/data") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(await loadData()));
      } else if (req.method === "GET" && assets.has(url.pathname)) {
        const [file, contentType] = assets.get(url.pathname);
        res.setHeader("Content-Type", contentType);
        res.end(await readFile(new URL(file, import.meta.url)));
      } else if (req.method === "GET" && url.pathname === "/") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(await renderHtml());
      } else {
        res.writeHead(404).end("Not found");
      }
    } catch (error) {
      logError(error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}
