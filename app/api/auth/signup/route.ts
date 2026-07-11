import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, role, schoolName, categories, schoolAddress, coopId } = await request.json();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase credentials" },
        { status: 500 }
      );
    }

    // Initialize standard client to trigger confirmation email
    const standardSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user via standard signUp (sends confirmation email if enabled in Supabase)
    const redirectUrl = `${new URL(request.url).origin}/auth/callback`;
    const { data: authData, error: authError } = await standardSupabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role,
          schoolName,
          schoolAddress,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    }

    // Initialize admin client with service role key to upsert profile bypassing RLS
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Upsert into user_profiles table using service role client
    const { error: profileError } = await adminSupabase.from("user_profiles").upsert(
      {
        id: authData.user.id,
        email,
        role,
        school_name: schoolName || null,
        school_address: schoolAddress || null,
        categories: categories || null,
        coop_id: coopId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Profile upsert error in API:", profileError);
    }

    // If client role with school name and address, update the schools table server-side
    // (bypasses RLS since we're using the service role key)
    if (role === "client" && schoolName && schoolAddress) {
      const { data: schools } = await adminSupabase
        .from("schools")
        .select("id, address")
        .ilike("name", schoolName.trim())
        .limit(1);

      if (schools && schools.length > 0) {
        const school = schools[0];
        if (school.address !== schoolAddress.trim()) {
          await adminSupabase
            .from("schools")
            .update({ address: schoolAddress.trim() })
            .eq("id", school.id);
        }
      }
    }

    // If admin role with coop name and address, update the coop_profile table server-side
    if (role === "admin" && schoolName && schoolAddress) {
      const { data: coops } = await adminSupabase
        .from("coop_profile")
        .select("id, address")
        .ilike("name", schoolName.trim())
        .limit(1);

      if (coops && coops.length > 0) {
        const coop = coops[0];
        if (coop.address !== schoolAddress.trim()) {
          await adminSupabase
            .from("coop_profile")
            .update({ address: schoolAddress.trim() })
            .eq("id", coop.id);
        }
      }
    }

    const isConfirmed = !!authData.session;
    return NextResponse.json({ success: true, userId: authData.user.id, isConfirmed });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    console.error("Signup API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
