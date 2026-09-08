import { listCollectionResponse } from "@/lib/mongo-helpers";
import type { Employee } from "@/lib/types";

export async function GET() {
  return listCollectionResponse<Employee>("employees");
}
