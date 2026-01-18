const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture all console messages from the browser
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('📊') || text.includes('Flows') || text.includes('API')) {
      console.log('[Browser Console]', text);
    }
  });

  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input', { timeout: 10000 });
    await page.locator('input').first().fill('admin');
    await page.locator('input').nth(1).fill('admin123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('http://localhost:3000/**', { timeout: 10000 });
    console.log('✅ Logged in\n');

    // Navigate to flows
    console.log('🌐 Navigating to IVR Flows...');
    await page.click('text=IVR Flows');
    await page.waitForURL('**/flows', { timeout: 10000 });
    await page.waitForTimeout(4000); // Give more time

    // Check what flows state contains
    const flowsState = await page.evaluate(() => {
      // Try to access React state (this is a hack)
      const root = document.querySelector('#__next');
      return {
        hasData: !!root,
        innerHTML: document.body.innerHTML.substring(0, 500)
      };
    });

    console.log('\n📋 All browser console logs:');
    consoleLogs.forEach(log => console.log('  ', log));

    console.log('\n🔍 DOM Check:');
    const noFlowsCard = await page.locator('text=No flows yet').count();
    console.log(`  "No flows yet" elements: ${noFlowsCard}`);

    const createFlowButtons = await page.locator('button:has-text("Create")').count();
    console.log(`  Create Flow buttons: ${createFlowButtons}`);

    // Check if API calls completed
    const apiLogs = consoleLogs.filter(log => log.includes('API'));
    console.log('\n🔌 API Logs:', apiLogs);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
