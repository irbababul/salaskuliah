const express = require("express");
const cors = require("cors");
const path = require("path");

// Load handlers
const authHandler   = require(path.join(__dirname, "auth.js"));
const publicHandler = require(path.join(__dirname, "public.js"));
const adminHandler  = require(path.join(__dirname, "admin.js"));

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

function adapt(handler) {
  return async (req, res) => {
    try { await handler(req, res); }
    catch(e) { 
      console.error("[error]", e.message);
      if (!res.headersSent) res.status(500).json({ error: e.message }); 
    }
  };
}

// Express 5 needs named wildcard parameters
app.use("/api/auth", adapt(authHandler));
app.use("/api/public", adapt(publicHandler));
app.use("/api/admin", adapt(adminHandler));

module.exports = app;
