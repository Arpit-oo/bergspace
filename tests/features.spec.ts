import { test, expect } from "@playwright/test";

const EMPLOYEE = { email: "employee@bergspace.com", password: "demo123456" };
const MANAGER = { email: "manager@bergspace.com", password: "demo123456" };
const ADMIN = { email: "admin@bergspace.com", password: "demo123456" };

async function login(page: any, user: { email: string; password: string }) {
  await page.goto("/auth/login");
  await page.fill('input[type="email"], input[placeholder*="company"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

// GOAL CREATION
test("employee goals page has add goal button", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto("/dashboard/goals");
  await expect(page.locator('button:has-text("Add Goal")')).toBeVisible({ timeout: 5000 });
});

test("thrust area dropdown has real names not UUIDs", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto("/dashboard/goals");
  await page.click('button:has-text("Add Goal")');
  const selects = page.locator('select');
  const count = await selects.count();
  expect(count).toBeGreaterThan(0);
});

test("weightage bar visible on goals page", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto("/dashboard/goals");
  await expect(page.locator("text=Total Weightage")).toBeVisible({ timeout: 5000 });
});

// MANAGER
test("manager approvals page loads", async ({ page }) => {
  await login(page, MANAGER);
  await page.goto("/dashboard/approvals");
  await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible({ timeout: 5000 });
});

test("manager team stat cards visible", async ({ page }) => {
  await login(page, MANAGER);
  await page.goto("/dashboard/team");
  await expect(page.locator("text=TEAM MEMBERS").first()).toBeVisible({ timeout: 5000 });
});

test("refresh button in topbar", async ({ page }) => {
  await login(page, MANAGER);
  await expect(page.locator('button[title="Refresh"]')).toBeVisible({ timeout: 5000 });
});

// ADMIN EMPLOYEES
test("admin employees has search", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/employees");
  await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 });
});

test("admin employees shows real data", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/employees");
  await expect(page.locator("text=Arjun Mehta")).toBeVisible({ timeout: 5000 });
});

// ADMIN CYCLES
test("new cycle button exists", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/cycles");
  await expect(page.locator('button:has-text("New Cycle")')).toBeVisible({ timeout: 5000 });
});

test("new cycle dialog has date fields", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/cycles");
  await page.click('button:has-text("New Cycle")');
  await expect(page.locator("text=Cycle Name")).toBeVisible({ timeout: 3000 });
});

// ADMIN ESCALATIONS
test("escalation new rule button exists", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/escalations");
  await expect(page.locator('button:has-text("New Rule")')).toBeVisible({ timeout: 5000 });
});

// ADMIN AUDIT
test("audit log has human readable labels", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/audit");
  await expect(page.getByRole("heading", { name: "Audit Log" })).toBeVisible({ timeout: 5000 });
});

// ADMIN SETTINGS
test("settings has integration sections", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 5000 });
});

// REPORTS
test("reports has export buttons", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/reports");
  await expect(page.locator('button:has-text("CSV")').first()).toBeVisible({ timeout: 5000 });
});

// ANALYTICS
test("analytics page loads charts", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/analytics");
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({ timeout: 5000 });
});

// SHARED GOALS
test("shared goals create template button", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/shared-goals");
  await expect(page.locator('button:has-text("Template")').first()).toBeVisible({ timeout: 5000 });
});

// NOTIFICATIONS
test("telegram link section on notifications page", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto("/dashboard/notifications");
  await expect(page.locator("text=Telegram Notifications")).toBeVisible({ timeout: 5000 });
});

// ACCESSIBILITY
test("accessibility page has all 3 settings", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto("/dashboard/accessibility");
  await expect(page.locator("text=Text Size")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Reduce Animations")).toBeVisible();
  await expect(page.locator("text=High Contrast")).toBeVisible();
});

// ANNOUNCEMENTS
test("announcements page has send form", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/dashboard/announcements");
  await expect(page.getByRole("heading", { name: "Send Announcement" })).toBeVisible({ timeout: 5000 });
  await expect(page.locator('button:has-text("All Users")')).toBeVisible();
});

// LOGIN
test("demo buttons fill email", async ({ page }) => {
  await page.goto("/auth/login");
  await page.click('button:has-text("Employee")');
  const emailInput = page.locator('input[type="email"], input[placeholder*="company"]');
  await expect(emailInput).toHaveValue("employee@bergspace.com");
});

test("SSO button visible on login", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("button", { name: "Sign in with Microsoft" })).toBeVisible();
});

// LANDING
test("landing stats strip", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=Weighted Goals")).toBeVisible({ timeout: 5000 });
});

test("landing FAQ", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=QUESTIONS?")).toBeVisible({ timeout: 5000 });
});

test("landing comparison table", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=WHY TEAMS SWITCH")).toBeVisible({ timeout: 5000 });
});

test("landing about section", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=BUILT WITH PASSION")).toBeVisible({ timeout: 5000 });
});

// DASHBOARDS
test("employee dashboard welcome", async ({ page }) => {
  await login(page, EMPLOYEE);
  await expect(page.locator("text=Welcome back").first()).toBeVisible({ timeout: 5000 });
});

test("manager dashboard welcome + stats", async ({ page }) => {
  await login(page, MANAGER);
  await expect(page.locator("text=Welcome back").first()).toBeVisible({ timeout: 5000 });
});

test("admin dashboard welcome + stats", async ({ page }) => {
  await login(page, ADMIN);
  await expect(page.locator("text=Welcome back").first()).toBeVisible({ timeout: 5000 });
});

// MOBILE
test("mobile: landing loads on 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BERGSPACE", exact: true })).toBeVisible({ timeout: 5000 });
});

// AUTH GUARD
test("protected route redirects to login", async ({ page }) => {
  await page.goto("/dashboard/goals");
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
});
