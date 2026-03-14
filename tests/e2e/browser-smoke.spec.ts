import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

// Known benign console messages to filter out
const BENIGN_PATTERNS = [
  /react/i,                         // React dev-mode warnings
  /vite/i,                          // Vite HMR messages
  /favicon\.ico/,                   // Missing favicon
  /\/v1\/whoami/,                   // Expected 401 with dev-auth mock token
  /dev-mock-token/,                 // Dev auth mock reference
  /Download the React DevTools/,    // React devtools suggestion
  /hot module replacement/i,        // HMR noise
  /\[HMR\]/,                       // HMR noise
]

function isBenign(msg: ConsoleMessage): boolean {
  return BENIGN_PATTERNS.some((p) => p.test(msg.text()))
}

/**
 * Navigates to a route, waits for idle, and asserts no unexpected console errors.
 * Returns collected errors for custom assertions.
 */
async function expectNoErrors(page: Page, route: string): Promise<void> {
  const errors: string[] = []
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !isBenign(msg)) {
      errors.push(msg.text())
    }
  }
  page.on('console', handler)

  await page.goto(route)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).not.toBeEmpty()

  page.removeListener('console', handler)
  expect(errors).toEqual([])
}

test('landing page renders without errors', async ({ page }) => {
  await expectNoErrors(page, '/')
})

test('compose page renders with dev auth', async ({ page }) => {
  await expectNoErrors(page, '/compose?dev-auth=1')
})

test('settings page renders with dev auth', async ({ page }) => {
  await expectNoErrors(page, '/settings?dev-auth=1')
})

test('404 page shows error UI, not blank screen', async ({ page }) => {
  await page.goto('/nonexistent-route-e2e-test')
  await page.waitForLoadState('networkidle')

  const bodyText = await page.locator('body').textContent()
  expect(bodyText?.trim().length).toBeGreaterThan(0)
})

test('no unhandled JS errors across routes', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isBenign(msg)) {
      errors.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    errors.push(`[pageerror] ${err.message}`)
  })

  const routes = [
    '/',
    '/onboarding?dev-auth=1',
    '/compose?dev-auth=1',
    '/settings?dev-auth=1',
    '/analytics?dev-auth=1',
  ]

  for (const route of routes) {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
  }

  expect(errors).toEqual([])
})
