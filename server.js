import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createRequire } from "module";
import { createServer } from "http";

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, ".env.local") });

const require = createRequire(import.meta.url);
const cors = require("cors");
const authHandler   = require(resolve(__dir, "api/auth.js"));
const publicHandler = require(resolve(__dir, "api/public.js"));
const adminHandler  = require(resolve(__dir, "api/admin.js"));

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ],
  credentials: true,
}));
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

process.on("uncaughtException",  e => console.error("UNCAUGHT:", e.message));
process.on("unhandledRejection", e => console.error("UNHANDLED:", e));

createServer(app).listen(PORT, () => {
  console.log("Backend (and Vite) running at http://localhost:" + PORT);
});

export default app;
