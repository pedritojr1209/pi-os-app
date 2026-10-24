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

export function bindHost(mode: AccessMode): string {
  if (mode === "lan") return "0.0.0.0";
  if (mode === "tailscale") return tailscaleAddress() ?? "127.0.0.1";
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

export function spawnCloudflareTunnel(binary: string, port: number) {
  // Fixed argv, no shell. cloudflared execs this exact program and arguments.
  return spawn(
    binary,
    ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${port}`],
    { stdio: ["ignore", "pipe", "pipe"], shell: false },
  );
}
