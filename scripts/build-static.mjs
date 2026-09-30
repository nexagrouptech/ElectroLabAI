import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, "public"), dist, { recursive: true });
await cp(path.join(root, "core"), path.join(dist, "core"), { recursive: true });

console.log("Static build ready in dist/");
