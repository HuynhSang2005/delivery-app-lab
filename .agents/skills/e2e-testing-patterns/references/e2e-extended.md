# E2E Testing Extended Reference

Extended patterns and debugging guides for end-to-end testing.

## Parallel Testing with Sharding

Distribute test execution across multiple machines for faster CI runs.

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: "shard-1",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@slow/,
      shard: { current: 1, total: 4 },
    },
    {
      name: "shard-2",
      use: { ...devices["Desktop Chrome"] },
      shard: { current: 2, total: 4 },
    },
    // ... more shards
  ],
});

// Run in CI
// bunx playwright test --shard=1/4
// bunx playwright test --shard=2/4
```

## Debugging Failing Tests

### Playwright Debugging

```typescript
// 1. Run in headed mode
bunx playwright test --headed

// 2. Run in debug mode
bunx playwright test --debug

// 3. Use trace viewer
await page.screenshot({ path: 'screenshot.png' });
await page.video()?.saveAs('video.webm');

// 4. Add test.step for better reporting
test('checkout flow', async ({ page }) => {
    await test.step('Add item to cart', async () => {
        await page.goto('/products');
        await page.getByRole('button', { name: 'Add to Cart' }).click();
    });

    await test.step('Proceed to checkout', async () => {
        await page.goto('/cart');
        await page.getByRole('button', { name: 'Checkout' }).click();
    });
});

// 5. Inspect page state
await page.pause();  // Pauses execution, opens inspector
```
