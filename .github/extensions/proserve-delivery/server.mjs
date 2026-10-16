import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { summarise } from "./data.mjs";
import { renderHtml } from "./render.mjs";

const assets = new Map([
  ["/client.js", ["client.js", "text/javascript; charset=utf-8"]],
  ["/canvas.css", ["canvas.css", "text/css; charset=utf-8"]],
]);

export async function startServer({ loadData, refreshData, logError }) {
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
      if (req.method === "POST" && url.pathname === "/refresh") {
        if (
          req.headers.origin !== origin ||
          req.headers["x-canvas-action"] !== "refresh"
        ) {
          res
            .writeHead(403)
            .end("Refresh requires a same-origin canvas request.");
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
