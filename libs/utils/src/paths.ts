import { join, dirname } from 'path'
import { existsSync } from 'fs'

let cachedRoot: string | null = null

function resolveRoot(): string {
  if (cachedRoot) return cachedRoot

  let dir = process.cwd()
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'nest-cli.json'))) {
      cachedRoot = dir
      return dir
    }
    dir = dirname(dir)
  }

  throw new Error('Project root not found: nest-cli.json not found in any parent directory')
}

export function fromRoot(...segments: string[]): string {
  return join(resolveRoot(), ...segments)
}
