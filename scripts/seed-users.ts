import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pomkolbdemxevmefhbkg.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbWtvbGJkZW14ZXZtZWZoYmtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MTU1NywiZXhwIjoyMDk0NDM3NTU3fQ.d1tJRQW13bwmYpXmwRLFAbTi8iPPZhEzmIE2hXrGdsk";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEPT_IDS = {
  engineering: "d1000000-0000-0000-0000-000000000001",
  product: "d1000000-0000-0000-0000-000000000002",
  sales: "d1000000-0000-0000-0000-000000000003",
  hr: "d1000000-0000-0000-0000-000000000004",
};

interface UserSeed {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "manager" | "employee";
  department_id: string;
  manager_email?: string;
}

const users: UserSeed[] = [
  // Admin
  {
    email: "admin@bergspace.com",
    password: "demo123456",
    full_name: "Priya Sharma",
    role: "admin",
    department_id: DEPT_IDS.hr,
  },
  // Managers
  {
    email: "manager@bergspace.com",
    password: "demo123456",
    full_name: "Rahul Verma",
    role: "manager",
    department_id: DEPT_IDS.engineering,
  },
  {
    email: "manager.product@bergspace.com",
    password: "demo123456",
    full_name: "Anita Desai",
    role: "manager",
    department_id: DEPT_IDS.product,
  },
  {
    email: "manager.sales@bergspace.com",
    password: "demo123456",
    full_name: "Vikram Patel",
    role: "manager",
    department_id: DEPT_IDS.sales,
  },
  {
    email: "manager.hr@bergspace.com",
    password: "demo123456",
    full_name: "Deepa Nair",
    role: "manager",
    department_id: DEPT_IDS.hr,
  },
  // Employees - Engineering
  {
    email: "employee@bergspace.com",
    password: "demo123456",
    full_name: "Arjun Mehta",
    role: "employee",
    department_id: DEPT_IDS.engineering,
    manager_email: "manager@bergspace.com",
  },
  {
    email: "dev2@bergspace.com",
    password: "demo123456",
    full_name: "Sneha Iyer",
    role: "employee",
    department_id: DEPT_IDS.engineering,
    manager_email: "manager@bergspace.com",
  },
  {
    email: "dev3@bergspace.com",
    password: "demo123456",
    full_name: "Karan Singh",
    role: "employee",
    department_id: DEPT_IDS.engineering,
    manager_email: "manager@bergspace.com",
  },
  // Employees - Product
  {
    email: "pm1@bergspace.com",
    password: "demo123456",
    full_name: "Meera Joshi",
    role: "employee",
    department_id: DEPT_IDS.product,
    manager_email: "manager.product@bergspace.com",
  },
  {
    email: "designer1@bergspace.com",
    password: "demo123456",
    full_name: "Rohan Gupta",
    role: "employee",
    department_id: DEPT_IDS.product,
    manager_email: "manager.product@bergspace.com",
  },
  // Employees - Sales
  {
    email: "sales1@bergspace.com",
    password: "demo123456",
    full_name: "Neha Kapoor",
    role: "employee",
    department_id: DEPT_IDS.sales,
    manager_email: "manager.sales@bergspace.com",
  },
  {
    email: "sales2@bergspace.com",
    password: "demo123456",
    full_name: "Amit Thakur",
    role: "employee",
    department_id: DEPT_IDS.sales,
    manager_email: "manager.sales@bergspace.com",
  },
  // Employees - HR
  {
    email: "hr1@bergspace.com",
    password: "demo123456",
    full_name: "Pooja Reddy",
    role: "employee",
    department_id: DEPT_IDS.hr,
    manager_email: "manager.hr@bergspace.com",
  },
];

async function seed() {
  console.log("Seeding demo users...\n");

  const userIdMap: Record<string, string> = {};

  for (const user of users) {
    console.log(`Creating ${user.role}: ${user.email}`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      app_metadata: { role: user.role },
      user_metadata: { full_name: user.full_name },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`  ↳ Already exists, fetching ID...`);
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email)
          .single();
        if (existing) userIdMap[user.email] = existing.id;
        continue;
      }
      console.error(`  ✗ Error: ${error.message}`);
      continue;
    }

    if (data.user) {
      userIdMap[user.email] = data.user.id;
      console.log(`  ✓ Created (${data.user.id})`);
    }
  }

  // Wait for triggers to create profiles
  console.log("\nWaiting for profile triggers...");
  await new Promise((r) => setTimeout(r, 2000));

  // Update profiles with department and manager info
  console.log("\nUpdating profiles...");
  for (const user of users) {
    const userId = userIdMap[user.email];
    if (!userId) continue;

    const managerId = user.manager_email
      ? userIdMap[user.manager_email]
      : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        role: user.role,
        department_id: user.department_id,
        manager_id: managerId,
        full_name: user.full_name,
      })
      .eq("id", userId);

    if (error) {
      console.error(`  ✗ ${user.email}: ${error.message}`);
    } else {
      console.log(`  ✓ ${user.email} → dept: ${user.department_id}, mgr: ${managerId || "none"}`);
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log("\nDemo accounts:");
  console.log("  Employee: employee@bergspace.com / demo123456");
  console.log("  Manager:  manager@bergspace.com / demo123456");
  console.log("  Admin:    admin@bergspace.com / demo123456");
}

seed().catch(console.error);
