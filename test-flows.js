const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input', { timeout: 10000 });

    // Fill username (first input field)
    await page.locator('input').first().fill('admin');
    // Fill password (second input field)
    await page.locator('input').nth(1).fill('admin123');

    await page.click('button:has-text("Login")');

    // Wait for redirect after login
    await page.waitForURL('http://localhost:3000/**', { timeout: 10000 });
    console.log('✅ Logged in successfully');

    // Take screenshot of dashboard
    await page.screenshot({ path: '/tmp/01-dashboard.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved');

    // Step 2: Click on IVR Flows in sidebar
    console.log('🌐 Clicking on IVR Flows...');
    await page.click('text=IVR Flows');
    await page.waitForURL('**/flows', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for API call and rendering

    // Take screenshot of flows page
    await page.screenshot({
      path: '/tmp/02-flows-page.png',
      fullPage: true
    });
    console.log('📸 Flows page screenshot saved to /tmp/02-flows-page.png');

    // Check for flows in the DOM
    const pageContent = await page.content();
    const hasCompleteFlow = pageContent.includes('Complete IVR Flow');
    console.log(`✅ "Complete IVR Flow" in HTML: ${hasCompleteFlow}`);

    const flowCards = await page.locator('[class*="Card"]').count();
    console.log(`📊 Number of cards found: ${flowCards}`);

    // Check if "No flows yet" message is visible
    const noFlowsVisible = await page.getByText('No flows yet').isVisible().catch(() => false);
    console.log(`❌ "No flows yet" visible: ${noFlowsVisible}`);

    // Check if flows are visible
    const completeFlowVisible = await page.getByText('Complete IVR Flow').isVisible().catch(() => false);
    console.log(`✅ "Complete IVR Flow" visible: ${completeFlowVisible}`);

    const salesFlowVisible = await page.getByText('Sales', { exact: true }).isVisible().catch(() => false);
    console.log(`✅ "Sales" flow visible: ${salesFlowVisible}`);

    // Get all H2 headings
    const h2Text = await page.locator('h2').allTextContents();
    console.log('📝 H2 headings:', h2Text);

    // Get all card titles
    const cardTitles = await page.locator('[class*="CardTitle"]').allTextContents();
    console.log('📝 Card titles:', cardTitles);

    // Check if we can click Edit on Complete IVR Flow
    if (completeFlowVisible) {
      console.log('\n🎯 Testing Edit button...');
      await page.click('button:has-text("Edit")').catch(() => {
        console.log('⚠️ Edit button not found');
      });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/03-flow-builder.png', fullPage: true });
      console.log('📸 Flow builder screenshot saved to /tmp/03-flow-builder.png');

      const currentURL = page.url();
      console.log('📍 Current URL:', currentURL);

      if (currentURL.includes('/builder/')) {
        console.log('✅ Successfully navigated to flow builder!');

        // Count nodes on canvas
        const nodeCount = await page.locator('[class*="react-flow__node"]').count();
        console.log(`📊 Nodes on canvas: ${nodeCount}`);
      }
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
    console.log('📸 Error screenshot saved to /tmp/error.png');
  } finally {
    await browser.close();
  }
})();
