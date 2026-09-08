import { listCollectionResponse } from "@/lib/mongo-helpers";

export async function GET() {
  return listCollectionResponse("leaveBalances");
}
