/**
 * RLS verification script: fetch students via Supabase client and assert that
 * when logged in with school_id in JWT, only that school's students are returned.
 * Run: npm run verify-rls (set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env to sign in).
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { jwtDecode } from "jwt-decode";

const TULSA_SCHOOL_ID = "a0000001-0000-4000-8000-000000000001";

async function main(): Promise<void> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (email && password) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      console.error("Sign-in failed:", authError.message);
      process.exit(1);
    }
    console.log("Signed in as:", authData.user?.email);
    console.log("app_metadata.school_id:", authData.session?.user?.app_metadata?.school_id);
    const token = authData.session?.access_token;
    if (token) {
      const payload = jwtDecode<{ school_id?: string }>(token);
      console.log("Decoded JWT payload:", payload);
      console.log("JWT school_id:", payload.school_id ?? "(missing)");
    }
  } else {
    console.log("No TEST_USER_EMAIL/TEST_USER_PASSWORD set; using anonymous session (expect 0 students).");
  }

  const { data: students, error } = await supabase
    .from("students")
    .select("id, school_id, first_name, last_name");

  if (error) {
    console.error("Fetch students error:", error.message);
    process.exit(1);
  }

  const count = students?.length ?? 0;
  const expectedSchoolId = TULSA_SCHOOL_ID;
  const allSameSchool =
    count > 0 && students!.every((s) => String(s.school_id) === expectedSchoolId);

  console.log("\nStudents count:", count);
  if (count > 0) {
    console.log("Sample rows:", students!.slice(0, 2));
    console.log("All rows have school_id =", expectedSchoolId, "?", allSameSchool);
  }

  if (email && password) {
    const passed = count === 5 && allSameSchool;
    if (passed) {
      console.log("\n[PASS] RLS: saw exactly 5 students for Tulsa school.");
    } else {
      console.log("\n[FAIL] RLS: expected 5 students for school", expectedSchoolId, "; got", count, "with correct school_id:", allSameSchool);
      console.log("Ensure app_metadata.school_id is set to", expectedSchoolId, "for the test user and session refreshed.");
      process.exit(1);
    }
  } else {
    if (count === 0) {
      console.log("\n[OK] No session/school_id: 0 students (RLS blocking as expected).");
    } else {
      console.log("\n[INFO] Got", count, "students without test credentials (unexpected; check JWT).");
    }
  }
}

main();
