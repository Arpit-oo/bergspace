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

test("1. landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BERGSPACE", exact: true })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("link", { name: "Get Started" }).first()).toBeVisible();
});

test("2. employee login → dashboard", async ({ page }) => {
  await login(page, EMPLOYEE);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("3. manager login → dashboard", async ({ page }) => {
  await login(page, MANAGER);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("4. admin login → dashboard", async ({ page }) => {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("5. employee → goals page", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.click('a[href="/dashboard/goals"]');
  await expect(page.getByRole("heading", { name: "My Goals" })).toBeVisible({ timeout: 5000 });
});

test("6. manager → team members", async ({ page }) => {
  await login(page, MANAGER);
  await page.click('a[href="/dashboard/team"]');
  await expect(page.getByRole("heading", { name: "My Team" })).toBeVisible({ timeout: 5000 });
});

test("7. manager → approvals", async ({ page }) => {
  await login(page, MANAGER);
  await page.click('a[href="/dashboard/approvals"]');
  await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible({ timeout: 5000 });
});

test("8. admin → all employees", async ({ page }) => {
  await login(page, ADMIN);
  await page.click('a[href="/dashboard/employees"]');
  await expect(page.getByRole("heading", { name: "All Employees" })).toBeVisible({ timeout: 5000 });
});

test("9. admin → goal cycles shows Q2", async ({ page }) => {
  await login(page, ADMIN);
  await page.click('a[href="/dashboard/cycles"]');
  await expect(page.getByRole("heading", { name: "Goal Cycles" })).toBeVisible({ timeout: 5000 });
});

test("10. admin → escalations", async ({ page }) => {
  await login(page, ADMIN);
  await page.click('a[href="/dashboard/escalations"]');
  await expect(page.getByRole("heading", { name: "Escalations" })).toBeVisible({ timeout: 5000 });
});

test("11. admin → reports", async ({ page }) => {
  await login(page, ADMIN);
  await page.click('a[href="/dashboard/reports"]');
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible({ timeout: 5000 });
});

test("12. admin → analytics", async ({ page }) => {
  await login(page, ADMIN);
  await page.click('a[href="/dashboard/analytics"]');
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({ timeout: 5000 });
});

test("13. admin → audit log", async ({ page }) => {
  await login(page, ADMIN);
  await page.click('a[href="/dashboard/audit"]');
  await expect(page.getByRole("heading", { name: "Audit Log" })).toBeVisible({ timeout: 5000 });
});

test("14. employee → notifications page", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto("/dashboard/notifications");
  await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible({ timeout: 10000 });
});

test("15. accessibility page loads", async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto("/dashboard/accessibility");
  await expect(page.getByRole("heading", { name: "Accessibility" })).toBeVisible({ timeout: 5000 });
});

test("16. manager → shared goals", async ({ page }) => {
  await login(page, MANAGER);
  await page.click('a[href="/dashboard/shared-goals"]');
  await expect(page.getByRole("heading", { name: "Shared Goals" })).toBeVisible({ timeout: 5000 });
});

test("17. admin → settings", async ({ page }) => {
  await login(page, ADMIN);
  await page.click('a[href="/dashboard/settings"]');
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 5000 });
});

test("18. login page has SSO + demo accounts", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("button", { name: "Sign in with Microsoft" })).toBeVisible();
  await expect(page.getByText("Demo Accounts")).toBeVisible();
});

test("19. signup page loads", async ({ page }) => {
  await page.goto("/auth/signup");
  await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();
});

test("20. manager → announcements", async ({ page }) => {
  await login(page, MANAGER);
  await page.click('a[href="/dashboard/announcements"]');
  await expect(page.getByRole("heading", { name: "Send Announcement" })).toBeVisible({ timeout: 5000 });
});

test("21. unauthenticated → redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
});

test("22. manager → check-ins", async ({ page }) => {
  await login(page, MANAGER);
  await page.click('a[href="/dashboard/checkins"]');
  await expect(page.getByRole("heading", { name: /check/i })).toBeVisible({ timeout: 5000 });
});
