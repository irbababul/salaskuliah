import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { createServer } from "http";

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, ".env.local") });

const require = createRequire(import.meta.url);
const app = require(resolve(__dir, "api/server.cjs"));

const PORT = process.env.API_PORT || 3001;
createServer(app).listen(PORT, () => {
  console.log("Backend (and Vite) running at http://localhost:" + PORT);
});

process.on("uncaughtException",  e => console.error("UNCAUGHT:", e.message));
process.on("unhandledRejection", e => console.error("UNHANDLED:", e));
