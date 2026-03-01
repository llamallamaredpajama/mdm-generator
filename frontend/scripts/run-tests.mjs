/**
 * Wrapper for vitest that force-exits when output stalls.
 * Workaround for vitest v2.x hanging after tests complete (Node v25 + jsdom).
 */
import { spawn } from 'child_process'

const child = spawn('npx', ['vitest', 'run'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: new URL('..', import.meta.url).pathname,
})

let failed = false
let hasTests = false
let lastOutputTime = Date.now()
const STALL_TIMEOUT = 5000

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk)
  lastOutputTime = Date.now()
  const text = chunk.toString()
  if (text.includes('✓') || text.includes('×')) hasTests = true
  if (text.includes('failed') || text.includes('×')) failed = true
})

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk)
  lastOutputTime = Date.now()
})

child.on('exit', (code) => {
  clearInterval(stallCheck)
  process.exit(code ?? (failed ? 1 : 0))
})

// Check for output stall — if tests ran and output stopped for 5s, force exit
const stallCheck = setInterval(() => {
  if (hasTests && Date.now() - lastOutputTime > STALL_TIMEOUT) {
    child.kill()
    process.exit(failed ? 1 : 0)
  }
}, 1000)

// Safety: force exit after 120 seconds
setTimeout(() => {
  child.kill()
  process.exit(1)
}, 120000)
