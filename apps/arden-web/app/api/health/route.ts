import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    app: "arden",
    status: "ok",
    runtime: "offline",
    version: "0.1.0",
  });
}
