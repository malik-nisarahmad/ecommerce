import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // List all users
  const { data: users, error } = await supabase.from("users").select("id, email, name, role, isVerified");
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("=== ALL USERS ===");
  for (const user of users ?? []) {
    console.log(`  ${user.email} | role: ${user.role} | verified: ${user.isVerified} | id: ${user.id}`);
  }

  if (!users || users.length === 0) {
    console.log("  No users found!");
    return;
  }

  // Set the first user to ADMIN
  const firstUser = users[0];
  console.log(`\nSetting ${firstUser.email} to ADMIN...`);

  const { error: updateError } = await supabase
    .from("users")
    .update({ role: "ADMIN" })
    .eq("id", firstUser.id);

  if (updateError) {
    console.error("Update failed:", updateError);
    return;
  }

  console.log("Done! User is now ADMIN. Refresh your browser and go to /admin.");
}

main().catch(console.error);
