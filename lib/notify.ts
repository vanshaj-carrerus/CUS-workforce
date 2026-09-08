import { getDb } from "@/lib/mongodb";
import type { NotificationItem } from "@/lib/types";

export async function createNotification(
  item: Omit<NotificationItem, "id" | "date" | "read"> & { date?: string; read?: boolean }
): Promise<NotificationItem> {
  const doc: NotificationItem = {
    id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: item.date ?? new Date().toISOString().slice(0, 10),
    read: item.read ?? false,
    title: item.title,
    description: item.description,
    type: item.type,
  };
  if (item.employeeId) doc.employeeId = item.employeeId;
  if (item.href) doc.href = item.href;

  const db = await getDb();
  await db.collection<NotificationItem>("notifications").insertOne(doc);
  return doc;
}
