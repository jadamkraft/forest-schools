import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const TULSA_SCHOOL_ID = "a0000001-0000-4000-8000-000000000001";

type TestAccount = {
  email: string;
  password: string;
  fullName: string;
  role: string;
};

const TEST_ACCOUNTS: TestAccount[] = [
  {
    email: "admin@test.com",
    password: "password123",
    fullName: "Admin User",
    role: "admin",
  },
  {
    email: "staff@test.com",
    password: "password123",
    fullName: "Staff User",
    role: "staff",
  },
  {
    email: "parent@test.com",
    password: "password123",
    fullName: "Forest Guardian",
    role: "guardian",
  },
];

async function main(): Promise<void> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error("Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL in .env");
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey);

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    console.error("admin.listUsers failed:", listError.message);
    process.exit(1);
  }

  const existingUsers = listData.users ?? [];

  for (const acct of TEST_ACCOUNTS) {
    const existing = existingUsers.find((u) => u.email === acct.email);

    if (!existing) {
      const { data, error } = await admin.auth.admin.createUser({
        email: acct.email,
        password: acct.password,
        email_confirm: true,
        app_metadata: {
          school_id: TULSA_SCHOOL_ID,
        },
        user_metadata: {
          full_name: acct.fullName,
          role: acct.role,
        },
      });

      if (error) {
        console.error(`createUser(${acct.email}) failed:`, error.message);
      } else {
        console.log(`createUser(${acct.email}) ok, id=${data.user?.id}`);
      }
    } else {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password: acct.password,
        app_metadata: {
          ...(existing.app_metadata ?? {}),
          school_id: TULSA_SCHOOL_ID,
        },
        user_metadata: {
          ...(existing.user_metadata ?? {}),
          full_name: acct.fullName,
          role: acct.role,
        },
      });

      if (error) {
        console.error(`updateUserById(${acct.email}) failed:`, error.message);
      } else {
        console.log(`updateUserById(${acct.email}) ok, id=${existing.id}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("seed-auth script failed:", err);
  process.exit(1);
});

