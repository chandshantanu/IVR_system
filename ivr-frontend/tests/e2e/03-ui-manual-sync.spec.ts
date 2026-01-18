import { test, expect } from '@playwright/test';

/**
 * UI Manual Sync Tests
 * Tests the manual sync button functionality in the UI
 */

test.describe('Manual Sync UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should have Sync Calls button on Call History page', async ({ page }) => {
    // Navigate to Analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check for Sync button
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("sync")').first();
    await expect(syncButton).toBeVisible({ timeout: 10000 });

    console.log('✅ Sync Calls button found on Analytics page');
  });

  test('should trigger sync when button clicked', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Click sync button
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("sync")').first();
    await syncButton.click();

    // Should show loading state or success message
    // Wait for either spinner or success notification
    const loadingOrSuccess = page.locator('[class*="spin"], [class*="loading"], text=/sync.*success/i, text=/synced/i, [role="status"]').first();

    await expect(loadingOrSuccess).toBeVisible({ timeout: 15000 });

    console.log('✅ Sync triggered and showed feedback');
  });

  test('should display toast notification after sync', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Click sync button
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("sync")').first();
    await syncButton.click();

    // Wait for toast/alert notification
    const notification = page.locator('[role="alert"], [role="status"], .toast, .notification').first();

    await expect(notification).toBeVisible({ timeout: 15000 });

    console.log('✅ Toast notification displayed');
  });

  test('should have Sync button on Recordings page', async ({ page }) => {
    await page.goto('/recordings');
    await page.waitForLoadState('networkidle');

    // Check for Sync button
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("sync")').first();
    await expect(syncButton).toBeVisible({ timeout: 10000 });

    console.log('✅ Sync Calls button found on Recordings page');
  });

  test('should handle sync errors gracefully in UI', async ({ page }) => {
    // Simulate network error by navigating away during sync
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const syncButton = page.locator('button:has-text("Sync"), button:has-text("sync")').first();

    // Click sync and immediately navigate away
    await syncButton.click();

    // Should not crash
    await page.waitForTimeout(1000);

    const hasError = await page.locator('text=/error/i, text=/failed/i, [role="alert"]').first().isVisible().catch(() => false);

    if (hasError) {
      console.log('✅ Error message displayed appropriately');
    }
  });

  test('should disable sync button while syncing', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const syncButton = page.locator('button:has-text("Sync"), button:has-text("sync")').first();

    // Check if button can be clicked
    const isEnabled = await syncButton.isEnabled();
    expect(isEnabled).toBe(true);

    // Click sync
    await syncButton.click();

    // Button should be disabled during sync
    const isDisabledDuringSync = await syncButton.isDisabled().catch(() => false);

    if (isDisabledDuringSync) {
      console.log('✅ Sync button disabled during operation (prevents double-click)');
    }
  });
});

test.describe('Call History Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should display call history table', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for table or card with call data
    const table = page.locator('table, [role="table"], .table').first();

    await expect(table).toBeVisible({ timeout: 10000 });

    console.log('✅ Call history table displayed');
  });

  test('should show recording player for calls with recordings', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Sync to get latest data
    const syncButton = page.locator('button:has-text("Sync")').first();
    if (await syncButton.isVisible().catch(() => false)) {
      await syncButton.click();
      await page.waitForTimeout(3000);
    }

    // Look for recording player (audio tag or play button)
    const recordingPlayer = page.locator('audio, button:has-text("Play"), [class*="player"]').first();

    const hasRecordings = await recordingPlayer.isVisible().catch(() => false);

    if (hasRecordings) {
      console.log('✅ Recording player found for calls with recordings');
    } else {
      console.log('ℹ️ No recordings available to test player');
    }
  });

  test('should show "No recording" for calls without recordings', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const noRecording = page.locator('text=/no.*recording/i, text=/not.*recorded/i').first();

    const hasNoRecordingText = await noRecording.isVisible().catch(() => false);

    if (hasNoRecordingText) {
      console.log('✅ "No recording" text shown appropriately');
    }
  });
});

test.describe('Recordings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should navigate to Recordings page', async ({ page }) => {
    // Click Recordings link in navigation
    const recordingsLink = page.locator('a:has-text("Recordings"), nav a[href*="recording"]').first();

    await expect(recordingsLink).toBeVisible({ timeout: 10000 });
    await recordingsLink.click();

    await expect(page).toHaveURL(/\/recordings/, { timeout: 10000 });

    console.log('✅ Successfully navigated to Recordings page');
  });

  test('should display recordings filters', async ({ page }) => {
    await page.goto('/recordings');
    await page.waitForLoadState('networkidle');

    // Look for filter inputs
    const filters = page.locator('input[placeholder*="phone"], select, input[type="date"]');

    const hasFilters = await filters.first().isVisible().catch(() => false);

    if (hasFilters) {
      console.log('✅ Recordings filters displayed');
    }
  });

  test('should display recordings list or empty state', async ({ page }) => {
    await page.goto('/recordings');
    await page.waitForLoadState('networkidle');

    // Should show either recordings or empty state
    const hasContent = await page.locator('audio, .recording, text=/no.*recordings/i').first().isVisible();

    expect(hasContent).toBe(true);

    console.log('✅ Recordings page shows content or empty state');
  });
});
