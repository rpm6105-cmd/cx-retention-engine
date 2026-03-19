import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      plan?: string;
      companyId?: string | null;
      inviterName?: string;
    };

    if (!body.email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cx-retention-engine.vercel.app";

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
      data: {
        plan: body.plan ?? "Starter",
        company_id: body.companyId ?? null,
      },
      redirectTo: `${appUrl}/login`,
    });

    if (inviteResult.error) {
      return NextResponse.json({ ok: false, error: inviteResult.error.message }, { status: 400 });
    }

    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? "CX Retention Engine <noreply@updates.example.com>",
          to: [body.email],
          subject: "You were invited to CX Retention Engine",
          html: `
            <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
              <h2 style="margin-bottom:8px;">You have been invited to CX Retention Engine</h2>
              <p>${body.inviterName ?? "Your admin"} invited you to join the shared customer success workspace.</p>
              <p>Your starting plan: <strong>${body.plan ?? "Starter"}</strong></p>
              <p><a href="${appUrl}/login" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;">Open workspace</a></p>
              <p style="font-size:12px;color:#475569;">If you already have an account, sign in with this email. Otherwise complete signup first and your admin can approve access.</p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown invite error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
