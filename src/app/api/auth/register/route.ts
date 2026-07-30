import { NextResponse } from "next/server";
import { registerWithPassword, EmailAuthError } from "@/lib/password-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; name?: string }
    | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    await registerWithPassword(body.email, body.password, body.name ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof EmailAuthError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
