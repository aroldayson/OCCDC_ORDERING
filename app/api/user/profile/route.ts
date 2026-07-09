import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase server credentials");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/user/profile?id=xxx&email=xxx
 * Fetches a user profile by User ID, falling back to email lookup.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || searchParams.get("userId") || searchParams.get("clerkId");
    const email = searchParams.get("email");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Try to find profile by User ID
    let { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile by ID:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. If not found by ID, try by email and link the profile
    if (!profile && email) {
      const { data: emailProfile, error: emailError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (emailError) {
        console.error("Error fetching user profile by email:", emailError);
        return NextResponse.json({ error: emailError.message }, { status: 500 });
      }

      if (emailProfile) {
        // Link existing profile to new ID
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ id: id, updated_at: new Date().toISOString() })
          .eq("email", email);

        if (updateError) {
          console.error("Error linking profile to ID:", updateError);
        } else {
          console.log(`Migrated profile for ${email} to ID ${id}`);
          profile = { ...emailProfile, id: id };
        }
      }
    }

    return NextResponse.json({ profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("GET /api/user/profile error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/user/profile
 * Creates a new user profile with default role "user".
 * Body: { id, email }
 */
export async function POST(request: Request) {
  try {
    const { id, clerkId, email } = await request.json();
    const targetId = id || clerkId;

    if (!targetId || !email) {
      return NextResponse.json(
        { error: "id and email are required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const now = new Date().toISOString();

    const newProfile = {
      id: targetId,
      email,
      role: "user",
      school_name: null,
      school_address: null,
      categories: null,
      created_at: now,
      updated_at: now,
    };

    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert(newProfile);

    if (insertError) {
      console.error("Error creating user profile:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ profile: newProfile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("POST /api/user/profile error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/user/profile
 * Updates an existing user profile.
 * Body: { id, role, school_name, school_address, categories }
 */
export async function PUT(request: Request) {
  try {
    const { id, clerkId, role, school_name, school_address, categories } = await request.json();
    const targetId = id || clerkId;

    if (!targetId) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        role,
        school_name,
        school_address,
        categories,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("PUT /api/user/profile error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
