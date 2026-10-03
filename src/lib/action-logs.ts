import { randomUUID } from "node:crypto";
import { db } from "./firebase";

export type ActionLogGroup = "posts" | "registrations" | "media";

export type ActionLog = {
  id: string;
  action: "delete_invitation" | "update_status" | "checkin" | "shirt_received" | "create_post" | "update_post" | "delete_post" | "account_created" | "update_media" | "delete_media";
  group: ActionLogGroup;
  entityId: string;
  adminName: string;
  adminUsername: string;
  adminRole: string;
  details: string;
  createdAt: string;
};

export async function listActionLogs(): Promise<ActionLog[]> {
  const snapshot = await db.collection("action_logs")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => doc.data() as ActionLog);
}

export async function logAction(
  action: ActionLog["action"],
  group: ActionLogGroup,
  entityId: string,
  adminName: string,
  adminUsername: string,
  adminRole: string,
  details: string
): Promise<ActionLog | null> {
  if (entityId === "sample" || entityId === "sample-group") {
    return null;
  }

  const log: ActionLog = {
    id: randomUUID(),
    action,
    group,
    entityId,
    adminName,
    adminUsername,
    adminRole,
    details,
    createdAt: new Date().toISOString(),
  };

  await db.collection("action_logs").doc(log.id).set(log);
  return log;
}
