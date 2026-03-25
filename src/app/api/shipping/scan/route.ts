export const runtime = "nodejs";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { scanEmails } from "@/lib/email-scanner";

export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    console.log("Manual scan triggered by user:", authResult.userId);
    const results = await scanEmails(authResult.userId);

    return NextResponse.json({
      success: true,
      results,
      message: `Scanned ${results.scanned} emails: ${results.matched} matched, ${results.pending} pending review, ${results.skipped} skipped`,
    });
  } catch (error) {
    console.error("Scan failed:", error);
    return NextResponse.json(
      { error: "Scan failed", detail: String(error) },
      { status: 500 }
    );
  }
}
