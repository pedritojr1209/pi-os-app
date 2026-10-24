// Four access modes for the pi-os-app launcher.
import { spawn } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { networkInterfaces } from "node:os";
import { delimiter, join } from "node:path";

export type AccessMode = "local" | "lan" | "cloudflare" | "tailscale";

export const ACCESS_MODES: readonly AccessMode[] = [
  "local",
  "lan",
  "cloudflare",
  "tailscale",
];

export const ACCESS_LABELS: Record<AccessMode, string> = {
  local: "This device only",
  lan: "Local network",
  cloudflare: "Cloudflare Tunnel",
  tailscale: "Tailscale",
};

export function isAccessMode(value: string | undefined): value is AccessMode {
  return value !== undefined && (ACCESS_MODES as readonly string[]).includes(value);
}

function isTailscaleAddress(address: string): boolean {
  const parts = address.split(".").map(Number);
  const first = parts[0];
  const second = parts[1];
  return first === 100 && second !== undefined && second >= 64 && second <= 127;
}

function ipv4Addresses(): { name: string; address: string }[] {
  return Object.entries(networkInterfaces()).flatMap(([name, list]) =>
    (list ?? [])
      .filter((net) => net.family === "IPv4" && !net.internal)
      .map((net) => ({ name, address: net.address })),
  );
}

export function lanAddresses(): string[] {
  return ipv4Addresses()
    .filter((each) => !isTailscaleAddress(each.address))
    .map((each) => each.address);
}

export function tailscaleAddress(): string | undefined {
  const candidates = ipv4Addresses().filter((each) => isTailscaleAddress(each.address));
  return (candidates.find((each) => /tailscale|utun|tun/i.test(each.name)) ?? candidates[0])
    ?.address;
}

export function bindHost(mode: AccessMode): string | undefined {
  if (mode === "lan") return "0.0.0.0";
  if (mode === "tailscale") return tailscaleAddress();
  return "127.0.0.1";
}

export function findCloudflared(extraDirectories: string[] = []): string | undefined {
  const names = process.platform === "win32" ? ["cloudflared.exe", "cloudflared"] : ["cloudflared"];
  for (const directory of [...(process.env.PATH ?? "").split(delimiter), ...extraDirectories]) {
    if (!directory) continue;
    for (const name of names) {
      const file = join(directory, name);
      try {
        accessSync(file, constants.X_OK);
        return file;
      } catch {
        // keep looking
      }
    }
  }
  return undefined;
}

function findExecutable(names: string[], extraDirectories: string[] = []): string | undefined {
  for (const directory of [...(process.env.PATH ?? "").split(delimiter), ...extraDirectories]) {
    if (!directory) continue;
    for (const name of names) {
      const file = join(directory, name);
      try {
        accessSync(file, constants.X_OK);
        return file;
      } catch {
        // keep looking
      }
    }
  }
  return undefined;
}

export function findTailscale(extraDirectories: string[] = []): string | undefined {
  const names =
    process.platform === "win32" ? ["tailscale.exe", "tailscale"] : ["tailscale"];
  return findExecutable(names, extraDirectories);
}

export const findTailscaled = findTailscale;
export const detectTailscale = findTailscale;

export function spawnCloudflareTunnel(binary: string, port: number) {
  // Fixed argv, no shell. cloudflared execs this exact program and arguments.
  return spawn(
    binary,
    ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${port}`],
    { stdio: ["ignore", "pipe", "pipe"], shell: false },
  );
}


export type HostLike = string | undefined;

export interface LauncherResult {
  mode: AccessMode;
  host: string;
  bindAddress: string;
  bindHost: string;
  url: string;
  accessUrl: string | undefined;
  accessURL: string | undefined;
  binary?: string;
}

export function accessUrl(
  mode: AccessMode,
  hostOrPort?: string | number,
  port?: number,
): string | undefined {
  let host: string | undefined;
  let resolvedPort: number | undefined;

  if (typeof hostOrPort === "number") {
    resolvedPort = hostOrPort;
  } else if (hostOrPort !== undefined) {
    host = hostOrPort;
    resolvedPort = port;
  }

  if (resolvedPort === undefined) resolvedPort = 8787;

  if (mode === "tailscale" && host === undefined) {
    host = tailscaleAddress();
    if (host === undefined) return undefined;
  }

  if (host === undefined) {
    if (mode === "lan") host = lanAddresses()[0];
    else host = "127.0.0.1";
  }

  if (host === undefined) return undefined;
  return `http://${host}:${resolvedPort}`;
}

export const accessURL = accessUrl;
export const getAccessUrl = accessUrl;
export const buildAccessUrl = accessUrl;
export const getAccessURL = accessUrl;
export const buildAccessURL = accessUrl;

export function launcherResult(
  mode: AccessMode,
  host?: string,
  port = 8787,
  binary?: string,
): LauncherResult {
  const bindAddress = host ?? bindHost(mode);
  const url = accessUrl(mode, bindAddress, port);
  const resolvedUrl = url ?? (bindAddress !== undefined ? `http://${bindAddress}:${port}` : undefined);
  const access = resolvedUrl ?? "";
  return {
    mode,
    host: bindAddress ?? "",
    bindAddress: bindAddress ?? "",
    bindHost: bindAddress ?? "",
    url: access,
    accessUrl: url,
    accessURL: url,
    binary,
  };
}

export const createLauncherResult = launcherResult;
export const makeLauncherResult = launcherResult;
export const buildLauncherResult = launcherResult;
