import { createInterface } from "node:readline";
import {
  ACCESS_LABELS,
  ACCESS_MODES,
  type AccessMode,
  bindHost,
  findCloudflared,
  isAccessMode,
  spawnCloudflareTunnel,
} from "./access.ts";
import { parseArgs } from "./options.ts";
import { createServer, listen } from "../server.ts";

const options = parseArgs(process.argv.slice(2));

function isInteractive(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true && !options.yes;
}

async function selectMode(): Promise<AccessMode> {
  if (options.access !== undefined) return options.access;
  if (!isInteractive()) return "local";

  console.log("");
  console.log("Select access mode:");
  ACCESS_MODES.forEach((mode, index) => {
    console.log(`  ${index + 1}. ${ACCESS_LABELS[mode]}`);
  });

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question("Enter choice [1-4] (default 1): ", resolve);
  });
  rl.close();

  const index = Number(answer.trim() || "1") - 1;
  if (Number.isInteger(index) && index >= 0 && index < ACCESS_MODES.length) {
    return ACCESS_MODES[index]!;
  }
  return "local";
}

async function main(): Promise<void> {
  const mode = await selectMode();
  const host = options.host ?? bindHost(mode);

  const server = createServer();
  await listen(server, host, options.port);
  console.log(`pi-os-app running in ${mode} mode at http://${host}:${options.port}`);

  if (mode === "cloudflare") {
    const binary = findCloudflared();
    if (binary === undefined) {
      console.error("cloudflared not found; install it to enable Cloudflare Tunnel mode.");
    } else {
      const tunnel = spawnCloudflareTunnel(binary, options.port);
      tunnel.stdout?.on("data", (chunk) => process.stdout.write(chunk));
      tunnel.stderr?.on("data", (chunk) => process.stderr.write(chunk));
      tunnel.on("exit", (code) => {
        console.error(`cloudflared exited with code ${code}`);
      });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
