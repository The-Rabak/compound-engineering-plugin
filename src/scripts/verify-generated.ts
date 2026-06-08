import { createHash } from "crypto"
import { promises as fs } from "fs"
import path from "path"

const GENERATED_TARGETS = [
  ".github",
  path.join(".agents", "plugins", "marketplace.json"),
  path.join("plugins", "compound-engineering"),
  path.join(".claude-plugin", "marketplace.json"),
]

await main()

async function main(): Promise<void> {
  const root = process.cwd()
  const before = await snapshotTargets(root, GENERATED_TARGETS)

  await runBuild(root)

  const after = await snapshotTargets(root, GENERATED_TARGETS)
  const drift = diffSnapshots(before, after)

  if (drift.length > 0) {
    console.error("Generated output drift detected. Run bun run build:platforms and commit the updated generated files.")
    for (const entry of drift) {
      console.error(` - ${entry}`)
    }
    process.exit(1)
  }

  console.log("Generated outputs are up to date.")
}

async function runBuild(root: string): Promise<void> {
  const proc = Bun.spawn(
    ["bun", "run", "src/index.ts", "build", "portable/compound-engineering", "--output", "."],
    {
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    },
  )

  const exitCode = await proc.exited
  if (exitCode !== 0) {
    process.exit(exitCode)
  }
}

async function snapshotTargets(root: string, targets: string[]): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>()

  for (const target of targets) {
    await collectSnapshot(path.join(root, target), target, snapshot)
  }

  return snapshot
}

async function collectSnapshot(absolutePath: string, relativePath: string, snapshot: Map<string, string>): Promise<void> {
  let stat
  try {
    stat = await fs.stat(absolutePath)
  } catch {
    return
  }

  if (stat.isDirectory()) {
    const entries = (await fs.readdir(absolutePath)).sort((left, right) => left.localeCompare(right))
    for (const entry of entries) {
      await collectSnapshot(path.join(absolutePath, entry), path.join(relativePath, entry), snapshot)
    }
    return
  }

  if (!stat.isFile()) {
    return
  }

  const content = await fs.readFile(absolutePath)
  snapshot.set(relativePath, hashContent(content))
}

function hashContent(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex")
}

function diffSnapshots(before: Map<string, string>, after: Map<string, string>): string[] {
  const allPaths = [...new Set([...before.keys(), ...after.keys()])].sort((left, right) => left.localeCompare(right))
  const drift: string[] = []

  for (const filePath of allPaths) {
    const beforeHash = before.get(filePath)
    const afterHash = after.get(filePath)

    if (!beforeHash && afterHash) {
      drift.push(`added ${filePath}`)
      continue
    }

    if (beforeHash && !afterHash) {
      drift.push(`removed ${filePath}`)
      continue
    }

    if (beforeHash !== afterHash) {
      drift.push(`modified ${filePath}`)
    }
  }

  return drift
}
