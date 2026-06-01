import { promises as fs } from "fs"
import path from "path"
import { pathExists, readJson, writeJson } from "./files"

type ManagedOutputState = {
  version: 1
  generatedPaths: string[]
}

export async function pruneManagedOutput(
  rootDir: string,
  stateFileName: string,
  desiredPaths: string[],
): Promise<string[]> {
  const normalized = normalizePaths(desiredPaths)
  const state = await readManagedOutputState(rootDir, stateFileName)
  if (!state) return normalized

  const desiredSet = new Set(normalized)
  const stalePaths = state.generatedPaths
    .filter((filePath) => !desiredSet.has(filePath))
    .sort((left, right) => right.length - left.length)

  for (const stalePath of stalePaths) {
    await fs.rm(stalePath, { recursive: true, force: true })
  }

  return normalized
}

export async function writeManagedOutputState(
  rootDir: string,
  stateFileName: string,
  generatedPaths: string[],
): Promise<void> {
  const statePath = path.join(rootDir, stateFileName)
  await writeJson(statePath, {
    version: 1,
    generatedPaths: normalizePaths(generatedPaths),
  } satisfies ManagedOutputState)
}

export async function removeLegacyBackupArtifacts(
  rootDir: string,
  patterns: RegExp[],
): Promise<void> {
  if (!(await pathExists(rootDir))) return
  const entries = await fs.readdir(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      await removeLegacyBackupArtifacts(fullPath, patterns)
      continue
    }
    if (entry.isFile() && patterns.some((pattern) => pattern.test(entry.name))) {
      await fs.rm(fullPath, { force: true })
    }
  }
}

function normalizePaths(paths: string[]): string[] {
  return [...new Set(paths.map((filePath) => path.resolve(filePath)))].sort()
}

async function readManagedOutputState(
  rootDir: string,
  stateFileName: string,
): Promise<ManagedOutputState | null> {
  const statePath = path.join(rootDir, stateFileName)
  if (!(await pathExists(statePath))) return null

  try {
    const state = await readJson<ManagedOutputState>(statePath)
    if (state.version !== 1 || !Array.isArray(state.generatedPaths)) {
      return null
    }
    return state
  } catch {
    return null
  }
}
