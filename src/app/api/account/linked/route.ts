import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { listLinkedMethods } from "@/lib/account-upsert";

/** List optional linked sign-in methods for the current session user. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const methods = await listLinkedMethods(userId);
  return NextResponse.json({ methods });
}
