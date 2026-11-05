import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, ".env.local") });
console.log("step 1: dotenv loaded");

const app = express();
console.log("step 2: express created");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
console.log("step 3: middleware added");

app.get("/api/health", (req, res) => res.json({ ok: true }));
console.log("step 4: routes added");

const server = app.listen(3001, "0.0.0.0", () => {
  console.log("step 5: LISTENING on port 3001");
});

server.on("error", (e) => console.error("server error:", e.message));
process.on("uncaughtException", (e) => console.error("uncaught:", e.message));
process.on("unhandledRejection", (e) => console.error("unhandled:", e));

console.log("step 6: after listen call");