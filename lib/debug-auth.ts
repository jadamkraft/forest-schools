/**
 * Internal diagnostic tool for Supabase Auth and multi-tenant setup.
 * - Used to debug "Invalid login credentials" and test password resets.
 * - Verifies behavior of the Supabase Auth layer for this project’s tenants.
 *
 * Run: npm run debug-auth (or npx tsx lib/debug-auth.ts)
 * Set SUPABASE_SERVICE_ROLE_KEY in .env for admin steps (list users, optional password reset).
 *
 * This script is not part of the shipped mobile client. Console output is
 * guarded with __DEV__ so that logs are limited to development usage.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function maskSupabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const parts = host.replace(".supabase.co", "").split("");
    if (parts.length <= 5) return `${u.protocol}//***.supabase.co`;
    const first = parts.slice(0, 3).join("");
    const last = parts.slice(-2).join("");
    return `${u.protocol}//${first}***${last}.supabase.co`;
  } catch {
    return "***invalid-url***";
  }
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***@***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local}***${domain}`;
  return `${local[0]}***${local[local.length - 1]}${domain}`;
}

function maskUserId(id: string): string {
  if (id.length <= 12) return "***";
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

async function main(): Promise<void> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const debugResetPassword = process.env.DEBUG_RESET_PASSWORD;

  if (!url || !anonKey) {
    if (__DEV__) {
      console.error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.");
    }
    process.exit(1);
  }

  if (__DEV__) {
    console.log("Supabase URL (masked):", maskSupabaseUrl(url));
    console.log("Email (masked):", email ? maskEmail(email) : "(not set)");
  }

  const supabase = createClient(url, anonKey);

  const { data: { user: userBefore } } = await supabase.auth.getUser();
  if (userBefore) {
    if (__DEV__) {
      console.log("getUser() before sign-in: user id", maskUserId(userBefore.id));
    }
  } else {
    if (__DEV__) {
      console.log("getUser() before sign-in: none");
    }
  }

  if (email && password) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      if (__DEV__) {
        console.log("Sign-in result: failed —", authError.message);
      }
    } else {
      if (__DEV__) {
        console.log("Sign-in result: ok, user id", authData.user ? maskUserId(authData.user.id) : "?");
      }
    }
  } else {
    if (__DEV__) {
      console.log("Sign-in: skipped (TEST_USER_EMAIL or TEST_USER_PASSWORD not set)");
    }
  }

  if (!serviceRoleKey) {
    if (__DEV__) {
      console.log("\nService Role Key: not set — skipping admin steps (list users / password reset).");
    }
    return;
  }

  const supabaseAdmin = createClient(url, serviceRoleKey);

  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    if (__DEV__) {
      console.log("\nadmin.listUsers(): failed —", listError.message);
    }
    return;
  }

  const users = listData?.users ?? [];
  const testUser = email ? users.find((u) => u.email === email) : null;

  if (testUser) {
    if (__DEV__) {
      console.log("\nTest user in auth: found, id", maskUserId(testUser.id));
    }
  } else {
    if (__DEV__) {
      console.log("\nTest user in auth: not found (email may differ or user not created in this project).");
    }
    return;
  }

  const passwordToSet = debugResetPassword ?? password;
  if (!passwordToSet) {
    if (__DEV__) {
      console.log("Password reset: skipped — neither DEBUG_RESET_PASSWORD nor TEST_USER_PASSWORD set.");
    }
    return;
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(testUser.id, {
    password: passwordToSet,
  });

  if (updateError) {
    if (__DEV__) {
      console.log("Password reset: failed —", updateError.message);
    }
  } else {
    if (__DEV__) {
      console.log("Password reset: ok (try verify-rls again with the same credentials).");
    }
  }
}

main();
