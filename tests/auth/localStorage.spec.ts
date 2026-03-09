import { test, expect } from "@playwright/test"

test.describe("Auth storage", () => {
  test("saves user into localStorage after login", async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[name="email"]', process.env.E2E_EMAIL || "demo@qtus.dev")
    await page.fill('input[name="password"]', process.env.E2E_PASSWORD || "secret123")
    await page.click('button[type="submit"]')

    await page.waitForURL(/dashboard/, { timeout: 10000 })

    const storedUser = await page.evaluate(() => window.localStorage.getItem("qtusdev_user"))
    expect(storedUser).not.toBeNull()
    const parsed = JSON.parse(storedUser!)
    expect(parsed.uid).toBeTruthy()
    expect(parsed.email).toContain("@")
  })
})

