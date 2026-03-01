// Force vitest to exit after tests complete.
// Workaround for open handles (e.g. Firebase auth listeners in jsdom)
// that prevent the main vitest process from exiting cleanly.
export function teardown() {
  setTimeout(() => process.exit(process.exitCode ?? 0), 3000)
}
