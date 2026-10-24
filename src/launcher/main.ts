import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline";
import {
  ACCESS_LABELS,
  ACCESS_MODES,
  type AccessMode,
  type LauncherResult,
  accessUrl,
  bindHost,
  findCloudflared,
  findTailscale,
  isAccessMode,
  buildLauncherResult,
  spawnCloudflareTunnel,
  tailscaleAddress,
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

let launcherResultState: LauncherResult | undefined;
export let launcherResult: LauncherResult | undefined;
export let launchResult: LauncherResult | undefined;
export let result: LauncherResult | undefined;
export let launcherInfo: LauncherResult | undefined;

export type { LauncherResult };

export async function main(): Promise<LauncherResult> {
  const mode = await selectMode();
  const host = options.host ?? bindHost(mode);

  if (host === undefined) {
    if (findTailscale() === undefined) {
      console.error("tailscale not found; install it to enable Tailscale mode.");
    } else {
      console.error("tailscale is not connected; run `tailscale up` to enable Tailscale mode.");
    }
    process.exit(1);
  }

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

  const url = accessUrl(mode, host, options.port) ?? `http://${host}:${options.port}`;
  const launched = buildLauncherResult(mode, host, options.port, mode === "cloudflare" ? findCloudflared() : undefined);

  launcherResultState = launched;
  launcherResult = launched;
  launchResult = launched;
  result = launched;
  launcherInfo = launched;

  return launched;
}

export const run = main;
export const runLauncher = main;
export const launch = main;
export const start = main;

const isEntrypoint =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
