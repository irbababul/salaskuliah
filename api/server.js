const express = require("express");
const cors = require("cors");
const path = require("path");

const authHandler   = require(path.join(__dirname, "auth.js"));
const publicHandler = require(path.join(__dirname, "public.js"));
const adminHandler  = require(path.join(__dirname, "admin.js"));

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "").split(",").map(s=>s.trim()).filter(Boolean)
allowedOrigins.push("http://localhost:5173","http://localhost:5174","http://localhost:5175")

app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true, env: process.env.NODE_ENV }));

function adapt(handler) {
  return async (req, res) => {
    try { await handler(req, res); }
    catch(e) { if (!res.headersSent) res.status(500).json({ error: e.message }); }
  };
}

app.all("/api/auth/*", adapt(authHandler));
app.all("/api/public/*", adapt(publicHandler));
app.all("/api/admin/*", adapt(adminHandler));

module.exports = app;
