import { promises as fs } from "fs"
import path from "path"

const PORTABLE_ROOT = path.join("portable", "compound-engineering")

await main()

async function main(): Promise<void> {
  let changed = 0

  for (const filePath of (await walkFiles(PORTABLE_ROOT)).filter(isCodexModelTarget)) {
    const text = await fs.readFile(filePath, "utf8")
    const next = seedCodexModel(text)
    if (next === text) continue

    await fs.writeFile(filePath, next, "utf8")
    changed += 1
  }

  console.log(`Updated ${changed} files with platforms.codex.model.`)
}

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkFiles(filePath))
    } else if (entry.isFile()) {
      files.push(filePath)
    }
  }

  return files
}

function isCodexModelTarget(filePath: string): boolean {
  const relativePath = path.relative(PORTABLE_ROOT, filePath).split(path.sep).join("/")

  if (relativePath.startsWith("agents/") && relativePath.endsWith(".md")) return true
  if (relativePath.startsWith("commands/") && relativePath.endsWith(".md") && !relativePath.includes("/references/")) {
    return true
  }
  if (relativePath === "commands/workflows/references/execution-agent-prompt.md") return true
  if (/^skills\/[^/]+\/SKILL\.md$/.test(relativePath)) return true
  if (/^skills\/create-agent-skills\/templates\/[^/]+\.md$/.test(relativePath)) return true

  return false
}

function seedCodexModel(text: string): string {
  if (!text.startsWith("---\n")) return text

  const end = text.indexOf("\n---", 4)
  if (end === -1) return text

  const frontmatter = text.slice(4, end)
  if (/^\s*\{\}\s*$/.test(frontmatter)) return text
  if (/\n  codex:\n/.test(frontmatter)) return text

  const model = chooseCodexModel(frontmatter)
  return `---\n${addCodexPlatform(frontmatter, model)}${text.slice(end)}`
}

function chooseCodexModel(frontmatter: string): string {
  const lines = frontmatter.split("\n")
  const copilotModel = readCopilotModel(lines)

  if (copilotModel === "gpt-5.3-codex") return "gpt-5.5"
  if (copilotModel?.startsWith("gpt-")) return copilotModel

  const rootModel = readRootModel(lines)
  if (rootModel?.toLowerCase().includes("haiku")) return "gpt-5.4-mini"

  return "gpt-5.5"
}

function readCopilotModel(lines: string[]): string | undefined {
  const start = lines.findIndex((line) => line === "  copilot:")
  if (start === -1) return undefined

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith("  ") && !line.startsWith("    ")) break

    const match = line.match(/^    model:\s*(.+)$/)
    if (match) return stripQuotes(match[1].trim())
  }

  return undefined
}

function readRootModel(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = line.match(/^model:\s*(.+)$/)
    if (match) return stripQuotes(match[1].trim())
  }

  return undefined
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "")
}

function addCodexPlatform(frontmatter: string, model: string): string {
  const lines = frontmatter.replace(/\s+$/g, "").split("\n")
  const platformsIndex = lines.findIndex((line) => line === "platforms:")

  if (platformsIndex === -1) {
    return [...lines, "platforms:", "  codex:", `    model: ${model}`].join("\n") + "\n"
  }

  lines.splice(platformsIndex + 1, 0, "  codex:", `    model: ${model}`)
  return lines.join("\n") + "\n"
}
