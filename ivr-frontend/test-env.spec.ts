import { test, expect } from '@playwright/test';

test('check environment variables are loaded', async ({ page }) => {
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);

    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.log('❌ BROWSER ERROR:', text);
    } else if (text.includes('Environment Configuration')) {
      console.log('✅ FOUND:', text);
    } else if (text.includes('Missing required')) {
      console.log('❌ VALIDATION ERROR:', text);
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
    consoleErrors.push(error.message);
  });

  console.log('\n🔍 Loading http://localhost:3000...\n');

  // Navigate to the page
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit for all console messages to appear
  await page.waitForTimeout(2000);

  console.log('\n📊 Console Summary:');
  console.log('Total messages:', consoleMessages.length);
  console.log('Total errors:', consoleErrors.length);

  // Check for environment configuration log
  const hasEnvConfig = consoleMessages.some(msg =>
    msg.includes('Environment Configuration')
  );

  const hasMissingEnvError = consoleMessages.some(msg =>
    msg.includes('Missing required environment variables')
  );

  console.log('\n✅ Has Environment Config log:', hasEnvConfig);
  console.log('❌ Has Missing Env Error:', hasMissingEnvError);

  // Check if the env object is available on window
  const envCheck = await page.evaluate(() => {
    // Try to access the env module if it's exposed
    return {
      hasWindow: typeof window !== 'undefined',
      documentReady: document.readyState,
    };
  });

  console.log('\n🔧 Browser environment:');
  console.log('Has window:', envCheck.hasWindow);
  console.log('Document ready:', envCheck.documentReady);

  // Print all console errors for debugging
  if (consoleErrors.length > 0) {
    console.log('\n❌ All Console Errors:');
    consoleErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  }

  // Print relevant console messages
  console.log('\n📝 Relevant Console Messages:');
  consoleMessages
    .filter(msg =>
      msg.includes('Environment') ||
      msg.includes('Missing') ||
      msg.includes('NEXT_PUBLIC')
    )
    .forEach(msg => console.log('  -', msg));

  // Assertions
  expect(hasMissingEnvError, 'Should NOT have missing environment variable errors').toBe(false);
  expect(hasEnvConfig, 'Should have environment configuration log').toBe(true);
  expect(consoleErrors.length, 'Should have no console errors').toBe(0);

  console.log('\n✅ Test passed! Environment variables are properly loaded.\n');
});
