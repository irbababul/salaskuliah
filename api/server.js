import express from "express";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const cors = require("cors");
const authHandler   = require(resolve(__dir, "auth.js"));
const publicHandler = require(resolve(__dir, "public.js"));
const adminHandler  = require(resolve(__dir, "admin.js"));

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

function adapt(handler) {
  return async (req, res) => {
    try { await handler(req, res); }
    catch(e) { if (!res.headersSent) res.status(500).json({ error: e.message }); }
  };
}

app.all("/api/auth/*path",   adapt(authHandler));
app.all("/api/public/*path", adapt(publicHandler));
app.all("/api/admin/*path",  adapt(adminHandler));

export default app;
