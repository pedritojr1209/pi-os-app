import { resolve } from "node:path";
import { isAccessMode, type AccessMode } from "./access.ts";

export interface LauncherOptions {
  access: AccessMode | undefined;
  yes: boolean;
  host: string | undefined;
  port: number;
}

export function parseArgs(argv: string[]): LauncherOptions {
  const envAccess = process.env.PI_OS_ACCESS ?? process.env.PI_POCKET_ACCESS;
  const options: LauncherOptions = {
    access: isAccessMode(envAccess) ? envAccess : undefined,
    yes: false,
    host: (process.env.PI_OS_HOST ?? process.env.PI_POCKET_HOST) || undefined,
    port: Number(process.env.PI_OS_PORT ?? process.env.PI_POCKET_PORT ?? 8787),
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;
    const value = () => {
      const next = argv[++index];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      return next;
    };

    if (arg === "--access" || arg === "-a") {
      const mode = value();
      if (!isAccessMode(mode)) throw new Error(`--access must be one of: local, lan, cloudflare, tailscale`);
      options.access = mode;
    } else if (arg === "--yes" || arg === "-y") {
      options.yes = true;
    } else if (arg === "--host") {
      options.host = value();
    } else if (arg === "--port" || arg === "-p") {
      options.port = Number(value());
    } else if (arg === "--help" || arg === "-h") {
      console.log("pi-os-app [--access local|lan|cloudflare|tailscale] [--port 8787]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port <= 0 || options.port > 65535) {
    throw new Error("--port must be a port number");
  }
  return options;
}
