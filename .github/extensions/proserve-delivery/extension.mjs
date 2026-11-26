import {
  joinSession,
  createCanvas,
  CanvasError,
} from "@github/copilot-sdk/extension";
import { loadData, refreshData, summarise } from "./data.mjs";
import { startServer } from "./server.mjs";

const servers = new Map();

const session = await joinSession({
  canvases: [
    createCanvas({
      id: "proserve-delivery",
      displayName: "JDP delivery progress",
      description:
        "JDP milestone report with original HTML and refreshable pro-serve issue and project-board statuses.",
      inputSchema: {
        type: "object",
        properties: { documentId: { type: "string", const: "jdp-delivery" } },
        required: ["documentId"],
        additionalProperties: false,
      },
      actions: [
        {
          name: "refresh",
          description:
            "Fetch current pro-serve issues and Justice Data Platform board statuses from GitHub.",
          handler: async () => {
            try {
              return summarise(await refreshData());
            } catch (error) {
              throw new CanvasError("github_refresh_failed", error.message);
            }
          },
        },
        {
          name: "summary",
          description:
            "Return source timestamp, task counts, epic counts and excluded issue numbers.",
          handler: async () => summarise(await loadData()),
        },
      ],
      open: async (ctx) => {
        let entry = servers.get(ctx.instanceId);
        if (!entry) {
          entry = await startServer({
            loadData,
            refreshData,
            logError: (error) =>
              session.log(`Delivery report: ${error.message}`, {
                level: "error",
              }),
          });
          servers.set(ctx.instanceId, entry);
        }
        return { title: "JDP delivery progress", url: entry.url };
      },
      onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (entry) {
          servers.delete(ctx.instanceId);
          await new Promise((resolve) => entry.server.close(resolve));
        }
      },
    }),
  ],
});
