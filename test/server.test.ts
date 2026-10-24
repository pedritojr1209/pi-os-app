import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, listen } from "../src/server.ts";

test("health and root endpoints respond", async () => {
  const server = createServer();
  await listen(server, "127.0.0.1", 0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const health = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(health.status, 200);
  const healthJson = (await health.json()) as { status: string };
  assert.equal(healthJson.status, "ok");

  const root = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(root.status, 200);
  assert.match(await root.text(), /pi-os-app/);

  server.close();
});
