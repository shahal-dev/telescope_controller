// Vercel serverless entry point.
//
// Vercel does not run a long-lived `server.listen()` process — it invokes an
// exported request handler per request. An Express `app` instance *is* such a
// handler (req, res) => void, so we build the app, attach the REST routes, and
// export it. The persistent server (server/index.ts) is only used for local
// dev / non-serverless hosts.
//
// NOTE: the WebSocket server (/ws) is intentionally NOT registered here.
// Vercel serverless functions cannot hold open WebSocket connections, so the
// live telescope-control / log-streaming features are unavailable on Vercel.
import express from "express";
import { registerApiRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

registerApiRoutes(app);

export default app;
