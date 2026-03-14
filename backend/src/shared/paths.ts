import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// From src/shared/ → project root is ../../
export const PROJECT_ROOT = join(__dirname, '..', '..')

export function promptPath(filename: string): string {
  return join(PROJECT_ROOT, 'prompts', filename)
}
