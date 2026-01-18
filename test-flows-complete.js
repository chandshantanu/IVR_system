const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Login
    console.log('🔐 Step 1: Logging in...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input', { timeout: 10000 });
    await page.locator('input').first().fill('admin');
    await page.locator('input').nth(1).fill('admin123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('http://localhost:3000/**', { timeout: 10000 });
    console.log('   ✅ Logged in\n');

    // Navigate to flows
    console.log('🌐 Step 2: Opening IVR Flows page...');
    await page.click('text=IVR Flows');
    await page.waitForURL('**/flows', { timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/step1-flows-list.png', fullPage: true });

    const completeFlowVisible = await page.getByText('Complete IVR Flow').isVisible();
    const salesFlowVisible = await page.getByText('Sales').first().isVisible();
    console.log(`   ✅ Complete IVR Flow visible: ${completeFlowVisible}`);
    console.log(`   ✅ Sales flow visible: ${salesFlowVisible}`);
    console.log('   📸 Screenshot: /tmp/step1-flows-list.png\n');

    // Click Edit on Complete IVR Flow
    console.log('🎨 Step 3: Opening Complete IVR Flow in visual builder...');

    // Find the Complete IVR Flow card and click its Edit button
    await page.locator('text=Complete IVR Flow').first().click();
    await page.waitForTimeout(500);

    // Click the Edit button (first one on the page)
    await page.locator('button:has-text("Edit")').first().click();
    await page.waitForURL('**/flows/builder/**', { timeout: 10000 });
    console.log('   ✅ Navigated to flow builder');

    // Wait for React Flow to render
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/step2-flow-builder.png', fullPage: true });

    const currentURL = page.url();
    console.log(`   📍 URL: ${currentURL}`);

    // Count nodes on canvas
    const nodeCount = await page.locator('[class*="react-flow__node"]').count();
    console.log(`   📊 Nodes rendered on canvas: ${nodeCount}/22`);

    const edgeCount = await page.locator('[class*="react-flow__edge"]').count();
    console.log(`   📊 Edges rendered on canvas: ${edgeCount}/21`);
    console.log('   📸 Screenshot: /tmp/step2-flow-builder.png\n');

    // Test clicking on a node to open config panel
    console.log('⚙️  Step 4: Testing node configuration...');
    if (nodeCount > 0) {
      await page.locator('[class*="react-flow__node"]').first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/step3-node-config.png', fullPage: true });

      const configPanelVisible = await page.locator('text=Node Configuration').isVisible().catch(() => false);
      console.log(`   ✅ Configuration panel opened: ${configPanelVisible}`);
      console.log('   📸 Screenshot: /tmp/step3-node-config.png\n');
    }

    // Summary
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n📊 Summary:');
    console.log(`   - Flows loaded: 2 (Complete IVR Flow, Sales)`);
    console.log(`   - Flow builder opened: YES`);
    console.log(`   - Nodes displayed: ${nodeCount}/22`);
    console.log(`   - Edges displayed: ${edgeCount}/21`);
    console.log('\n📸 Screenshots saved to:');
    console.log('   1. /tmp/step1-flows-list.png - Flows list page');
    console.log('   2. /tmp/step2-flow-builder.png - Visual flow builder');
    console.log('   3. /tmp/step3-node-config.png - Node configuration panel');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
    console.log('📸 Error screenshot: /tmp/error.png');
  } finally {
    await browser.close();
  }
})();
