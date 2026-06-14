import path from "path"
import { formatFrontmatter, parseFrontmatter } from "./frontmatter"
import { pathExists, readText, walkFiles, writeText } from "./files"

export type TargetContentSurface = "claude" | "copilot" | "codex" | "opencode"

type ModelTier = "primary" | "small"

const TARGET_MODELS: Record<TargetContentSurface, Record<ModelTier, string>> = {
  claude: {
    primary: "claude-sonnet-4-6",
    small: "claude-haiku-4-5-20251001",
  },
  copilot: {
    primary: "gpt-5.3-codex",
    small: "gpt-5.4-mini",
  },
  codex: {
    primary: "gpt-5.5",
    small: "gpt-5.4-mini",
  },
  opencode: {
    primary: "openrouter/moonshotai/kimi-k2.6",
    small: "gpt-5.4-mini",
  },
}

const SMALL_MODEL_PATTERNS = [
  /anthropic\/claude-haiku-4-5-20251001/g,
  /openrouter\/minimax\/minimax-m2\.7/g,
  /openai\/gpt-5\.4-mini/g,
  /claude-3-haiku(?:-\d{8})?/g,
  /claude-haiku-4-5-20251001/g,
  /gpt-5\.4-mini/g,
  /minimax\/minimax-m2\.7/g,
]

const PRIMARY_MODEL_PATTERNS = [
  /openrouter\/moonshotai\/kimi-k2\.6/g,
  /anthropic\/claude-sonnet-4[.-]6/g,
  /anthropic\/claude-opus-4(?:-20250514|-6)/g,
  /openai\/gpt-5\.3-codex/g,
  /openai\/gpt-5\.5/g,
  /claude-3-sonnet(?:-\d{8})?/g,
  /claude-3-opus(?:-\d{8})?/g,
  /claude-sonnet-4[.-]6/g,
  /claude-opus-4(?:-20250514|-6)/g,
  /claude-sonnet\b/g,
  /claude-opus\b/g,
  /gpt-5\.3-codex/g,
  /gpt-5\.5/g,
]

type SanitizeOptions = {
  transformBody?: (body: string) => string
}

export function canonicalModelForTarget(target: TargetContentSurface): string {
  return TARGET_MODELS[target].primary
}

export function modelForTargetTier(target: TargetContentSurface, tier: ModelTier): string {
  return TARGET_MODELS[target][tier]
}

export function replaceModelIdsForTarget(content: string, target: TargetContentSurface): string {
  let result = content
  for (const pattern of SMALL_MODEL_PATTERNS) {
    result = result.replace(pattern, modelForTargetTier(target, "small"))
  }
  for (const pattern of PRIMARY_MODEL_PATTERNS) {
    result = result.replace(pattern, modelForTargetTier(target, "primary"))
  }
  return sanitizeHarnessLanguage(result, target)
}

export function sanitizeMarkdownForTarget(
  raw: string,
  target: TargetContentSurface,
  options: SanitizeOptions = {},
): string {
  if (!hasLeadingFrontmatter(raw)) {
    const body = options.transformBody ? options.transformBody(raw.trim()) : raw.trim()
    return replaceModelIdsForTarget(body, target)
  }

  let parsed: ReturnType<typeof parseFrontmatter>
  try {
    parsed = parseFrontmatter(raw)
  } catch {
    return sanitizeLooseFrontmatterMarkdown(raw, target, options)
  }
  const frontmatter = { ...parsed.data }
  const selectedModel = selectFrontmatterModel(parsed.data, target)
  const hasHarnessMetadata = selectedModel !== undefined || frontmatter.platforms !== undefined
  delete frontmatter.platforms

  if (hasHarnessMetadata) {
    const tier = modelTier(selectedModel)
    frontmatter.model = modelForTargetTier(target, tier)
  }

  const body = options.transformBody ? options.transformBody(parsed.body.trim()) : parsed.body.trim()
  return formatFrontmatter(frontmatter, replaceModelIdsForTarget(body, target))
}

export async function sanitizeMarkdownTreeForTarget(
  rootDir: string,
  target: TargetContentSurface,
  options: SanitizeOptions = {},
): Promise<void> {
  if (!(await pathExists(rootDir))) return

  const files = await walkFiles(rootDir)
  for (const filePath of files) {
    if (path.extname(filePath) !== ".md") continue
    const original = await readText(filePath)
    const sanitized = sanitizeMarkdownForTarget(original, target, options)
    if (sanitized === original.trim()) continue
    await writeText(filePath, sanitized + "\n")
  }
}

function hasLeadingFrontmatter(raw: string): boolean {
  return raw.split(/\r?\n/, 1)[0]?.trim() === "---"
}

function sanitizeLooseFrontmatterMarkdown(
  raw: string,
  target: TargetContentSurface,
  options: SanitizeOptions,
): string {
  const lines = raw.split(/\r?\n/)
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---")
  if (endIndex === -1) {
    const body = options.transformBody ? options.transformBody(raw.trim()) : raw.trim()
    return replaceModelIdsForTarget(body, target)
  }

  const frontmatterLines = stripPlatformsBlock(lines.slice(1, endIndex))
  const hadHarnessMetadata =
    lines.slice(1, endIndex).some((line) => /^model\s*:/.test(line) || /^platforms\s*:/.test(line))
  const model = modelForTargetTier(target, modelTier(lines.slice(1, endIndex).join("\n")))
  const body = lines.slice(endIndex + 1).join("\n").trim()
  const transformedBody = options.transformBody ? options.transformBody(body) : body
  const normalizedBody = replaceModelIdsForTarget(transformedBody, target)
  const normalizedFrontmatter = replaceOrInsertModelLine(frontmatterLines, model, hadHarnessMetadata)

  return ["---", ...normalizedFrontmatter, "---", "", normalizedBody].join("\n")
}

function stripPlatformsBlock(lines: string[]): string[] {
  const result: string[] = []
  let skipping = false

  for (const line of lines) {
    if (/^platforms\s*:/.test(line)) {
      skipping = true
      continue
    }
    if (skipping) {
      if (/^\s/.test(line) || line.trim() === "") {
        continue
      }
      skipping = false
    }
    result.push(line)
  }

  return result
}

function replaceOrInsertModelLine(lines: string[], model: string, shouldHaveModel: boolean): string[] {
  let replaced = false
  const next = lines.map((line) => {
    if (!/^model\s*:/.test(line)) return line
    replaced = true
    return `model: ${model}`
  })

  if (!shouldHaveModel || replaced) return next

  const descriptionIndex = next.findIndex((line) => /^description\s*:/.test(line))
  const insertIndex = descriptionIndex === -1 ? next.length : descriptionIndex + 1
  return [...next.slice(0, insertIndex), `model: ${model}`, ...next.slice(insertIndex)]
}

function selectFrontmatterModel(
  frontmatter: Record<string, unknown>,
  target: TargetContentSurface,
): string | undefined {
  const platformModel = platformModelForTarget(frontmatter.platforms, target)
  if (platformModel) return platformModel
  return typeof frontmatter.model === "string" ? frontmatter.model : undefined
}

function platformModelForTarget(platforms: unknown, target: TargetContentSurface): string | undefined {
  if (!platforms || typeof platforms !== "object" || Array.isArray(platforms)) return undefined
  const targetConfig = (platforms as Record<string, unknown>)[target]
  if (!targetConfig || typeof targetConfig !== "object" || Array.isArray(targetConfig)) return undefined
  const model = (targetConfig as Record<string, unknown>).model
  return typeof model === "string" ? model : undefined
}

function modelTier(model: string | undefined): ModelTier {
  if (!model) return "primary"
  const normalized = model.trim().toLowerCase()
  if (normalized === "haiku" || normalized.endsWith("/haiku") || normalized.includes("haiku")) {
    return "small"
  }
  return SMALL_MODEL_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0
    return pattern.test(model)
  })
    ? "small"
    : "primary"
}

function sanitizeHarnessLanguage(content: string, target: TargetContentSurface): string {
  const primaryModel = modelForTargetTier(target, "primary")
  const smallModel = modelForTargetTier(target, "small")

  return content
    .replace(
      /, and use platform-specific overrides like `platforms\.[^`]+` when GPT routing should differ/g,
      "",
    )
    .replace(
      /, with platform-specific overrides like `platforms\.[^`]+` when needed/g,
      "",
    )
    .replace(
      /GPT code\/review work to `[^`]+` via platform overrides, and reserve `[^`]+` \/ `[^`]+` for lightweight/g,
      `heavier code/review work to \`${primaryModel}\`, and reserve \`${smallModel}\` for lightweight`,
    )
    .replace(/\bGPT routing\b/g, "model routing")
}
