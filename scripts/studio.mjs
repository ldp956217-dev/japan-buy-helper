// Prisma Studio launcher
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const nodeBin = "/Users/chenzifang/.nvm/versions/node/v20.20.2/bin";
const prismaBin = path.join(root, "node_modules/prisma/build/index.js");

const env = {
  ...process.env,
  PATH: `${nodeBin}:${process.env.PATH || ""}`,
};

const child = spawn(process.execPath, [prismaBin, "studio", "--port", "5555"], {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
