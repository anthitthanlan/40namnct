import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ActionLog = {
  id: string;
  action: "delete_ticket";
  entityId: string;
  adminName: string;
  adminRole: string;
  details: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const LOGS_FILE = path.join(DATA_DIR, "action_logs.json");

let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await withLock(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
      } catch {
        // no-op
      }
    });
    return fallback;
  }
}

async function writeJson<T>(file: string, value: T): Promise<void> {
  await withLock(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
  });
}

export async function listActionLogs(): Promise<ActionLog[]> {
  return readJson<ActionLog[]>(LOGS_FILE, []);
}

export async function logAction(
  action: ActionLog["action"],
  entityId: string,
  adminName: string,
  adminRole: string,
  details: string
): Promise<ActionLog> {
  const logs = await listActionLogs();
  const log: ActionLog = {
    id: randomUUID(),
    action,
    entityId,
    adminName,
    adminRole,
    details,
    createdAt: new Date().toISOString(),
  };
  logs.push(log);
  await writeJson(LOGS_FILE, logs);
  return log;
}
