import { listCollectionResponse, errorResponse } from "@/lib/mongo-helpers";
import { requireRole } from "@/lib/session";
import type { Employee } from "@/lib/types";

export async function GET() {
  const session = await requireRole(["hr-admin"]);
  if (!session) return errorResponse(new Error("Unauthorized"), 401);
  return listCollectionResponse<Employee>("employees");
}
