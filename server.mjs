import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 4173);

app.use(express.json({ limit: "1mb" }));
app.use("/core", express.static(path.join(__dirname, "core")));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "electrolab-ai",
    version: "0.1.0"
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ElectroLab AI v0.1 running on http://127.0.0.1:${port}`);
});
