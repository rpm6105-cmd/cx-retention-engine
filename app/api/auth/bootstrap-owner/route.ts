import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OWNER_EMAIL = "rpm6105@gmail.com";

function domainFromEmail(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "workspace.local";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const name = body.name?.trim() || "Rohith PM";

    if (email !== OWNER_EMAIL) {
      return NextResponse.json(
        { ok: false, error: "Owner bootstrap is limited to the seeded owner account." },
        { status: 403 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin credentials are missing on the server." },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("id,email")
      .eq("is_owner", true)
      .limit(1)
      .maybeSingle();

    if (ownerProfile && ownerProfile.email?.toLowerCase() !== OWNER_EMAIL) {
      return NextResponse.json(
        { ok: false, error: "An owner account is already configured for this workspace." },
        { status: 409 },
      );
    }

    const listResult = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (listResult.error) {
      return NextResponse.json({ ok: false, error: listResult.error.message }, { status: 500 });
    }

    const existingUser = listResult.data.users.find(
      (user) => user.email?.toLowerCase() === OWNER_EMAIL,
    );

    let userId = existingUser?.id;

    if (existingUser) {
      const updateResult = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(existingUser.user_metadata ?? {}), name },
      });

      if (updateResult.error) {
        return NextResponse.json(
          { ok: false, error: updateResult.error.message },
          { status: 500 },
        );
      }
    } else {
      const createResult = await supabaseAdmin.auth.admin.createUser({
        email: OWNER_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (createResult.error || !createResult.data.user) {
        return NextResponse.json(
          { ok: false, error: createResult.error?.message ?? "Unable to create owner user." },
          { status: 500 },
        );
      }

      userId = createResult.data.user.id;
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unable to resolve owner user id." },
        { status: 500 },
      );
    }

    const companyId = domainFromEmail(OWNER_EMAIL);

    await supabaseAdmin.from("companies").upsert(
      {
        id: companyId,
        name: companyId,
        domain: companyId,
      },
      { onConflict: "id" },
    );

    const profileResult = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email: OWNER_EMAIL,
        name,
        plan: "Business",
        is_owner: true,
        is_approved: true,
        role: "admin",
        company_id: companyId,
      },
      { onConflict: "id" },
    );

    if (profileResult.error) {
      return NextResponse.json(
        { ok: false, error: profileResult.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected bootstrap error.",
      },
      { status: 500 },
    );
  }
}
