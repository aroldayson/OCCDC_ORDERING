import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, role, schoolName, categories, schoolAddress, coopId } = await request.json();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase credentials" },
        { status: 500 }
      );
    }

    // Initialize admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user via Admin API (bypasses rate limit and confirm email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        schoolName,
        schoolAddress,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    }

    // Upsert into user_profiles table using service role client
    const { error: profileError } = await supabase.from("user_profiles").upsert(
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
      const { data: schools } = await supabase
        .from("schools")
        .select("id, address")
        .ilike("name", schoolName.trim())
        .limit(1);

      if (schools && schools.length > 0) {
        const school = schools[0];
        if (school.address !== schoolAddress.trim()) {
          await supabase
            .from("schools")
            .update({ address: schoolAddress.trim() })
            .eq("id", school.id);
        }
      }
    }

    // If admin role with coop name and address, update the coop_profile table server-side
    if (role === "admin" && schoolName && schoolAddress) {
      const { data: coops } = await supabase
        .from("coop_profile")
        .select("id, address")
        .ilike("name", schoolName.trim())
        .limit(1);

      if (coops && coops.length > 0) {
        const coop = coops[0];
        if (coop.address !== schoolAddress.trim()) {
          await supabase
            .from("coop_profile")
            .update({ address: schoolAddress.trim() })
            .eq("id", coop.id);
        }
      }
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    console.error("Signup API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
