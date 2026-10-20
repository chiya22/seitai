import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resyncBookingReminders } from "../lib/reminder";

class DummyWebSocket {
  url: string;
  readyState = 3;
  constructor(url: string) {
    this.url = url;
  }
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

(globalThis as unknown as { WebSocket: typeof DummyWebSocket }).WebSocket =
  DummyWebSocket;

function loadEnvLocal() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();
  const result = await resyncBookingReminders();
  console.log(
    `リマインド予約送信: ${result.scheduled}件 / スキップ: ${result.skipped}件 / 失敗: ${result.failed}件`,
  );
  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
