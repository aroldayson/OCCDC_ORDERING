import { spawn, execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(root, ".next", "dev", "lock");

function killPid(pid) {
  if (!pid || !/^\d+$/.test(pid)) return;
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    console.log(`Stopped stale dev server (PID ${pid})`);
  } catch {
    // Process may already be gone
  }
}

function killStaleDevServer() {
  if (existsSync(lockPath)) {
    try {
      const lock = readFileSync(lockPath, "utf8").trim();
      const pid = lock.match(/\d+/)?.[0];
      killPid(pid);
    } catch {
      // ignore lock read errors
    }
    try {
      unlinkSync(lockPath);
    } catch {
      // ignore
    }
  }

  try {
    const netstat = execSync("netstat -ano | findstr :3000 | findstr LISTENING", {
      encoding: "utf8",
    });
    const pids = new Set(
      netstat
        .split("\n")
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid)),
    );
    for (const pid of pids) killPid(pid);
  } catch {
    // Port 3000 not in use
  }
}

killStaleDevServer();

const child = spawn(process.execPath, [
  join(root, "node_modules", "next", "dist", "bin", "next"),
  "dev",
], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
