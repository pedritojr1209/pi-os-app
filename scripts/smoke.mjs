import { createServer, listen } from "../src/server.ts";

const server = createServer();
await listen(server, "127.0.0.1", 8799);

const health = await fetch("http://127.0.0.1:8799/health");
const root = await fetch("http://127.0.0.1:8799/");
if (health.status !== 200) throw new Error(`health status ${health.status}`);
if (root.status !== 200) throw new Error(`root status ${root.status}`);
console.log("smoke: ok");
server.close();
