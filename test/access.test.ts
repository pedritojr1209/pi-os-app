import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCESS_MODES, bindHost, isAccessMode } from "../src/launcher/access.ts";

test("access modes include four options", () => {
  assert.deepEqual([...ACCESS_MODES], ["local", "lan", "cloudflare", "tailscale"]);
});

test("isAccessMode validates", () => {
  assert.equal(isAccessMode("lan"), true);
  assert.equal(isAccessMode("nope"), false);
  assert.equal(isAccessMode(undefined), false);
});

test("bindHost defaults", () => {
  assert.equal(bindHost("local"), "127.0.0.1");
  assert.equal(bindHost("lan"), "0.0.0.0");
});
