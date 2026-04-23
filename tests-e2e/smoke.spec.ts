import { test, expect } from "@playwright/test";

test("home page loads and can start a game", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Sudoku Platform");

  await page.click('button:has-text("Start New Game")');
  await expect(page.locator("h1")).toContainText("Solo Sudoku");
  
  // Verify timer exists
  await expect(page.locator(".status-chip")).toBeVisible();
});

test("can toggle notes mode", async ({ page }) => {
  await page.goto("/");
  await page.click('button:has-text("Start New Game")');
  
  const notesButton = page.locator('button:has-text("Notes")');
  await expect(notesButton).toHaveClass(/secondary/);
  
  await notesButton.click();
  await expect(notesButton).toHaveClass(/primary/);
});
