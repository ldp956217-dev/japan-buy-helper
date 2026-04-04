// Next.js dev server launcher
// Sets PATH to include nvm node before spawning next dev (no-turbo)
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const nodeBin = "/Users/chenzifang/.nvm/versions/node/v20.20.2/bin";
const nextBin = path.join(root, "node_modules/next/dist/bin/next");

const env = {
  ...process.env,
  PATH: `${nodeBin}:${process.env.PATH || ""}`,
  TURBOPACK: "0",
};

const child = spawn(process.execPath, [nextBin, "dev"], {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
