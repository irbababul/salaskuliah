import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, ".env.local") });

const require = createRequire(import.meta.url);

console.log("Loading auth...");
try { const m = require("./api/auth.js"); console.log("auth OK:", typeof m); } 
catch(e) { console.error("auth FAIL:", e.message); }

console.log("Loading public...");
try { const m = require("./api/public.js"); console.log("public OK:", typeof m); }
catch(e) { console.error("public FAIL:", e.message); }

console.log("Loading admin...");
try { const m = require("./api/admin.js"); console.log("admin OK:", typeof m); }
catch(e) { console.error("admin FAIL:", e.message); }

console.log("All done");