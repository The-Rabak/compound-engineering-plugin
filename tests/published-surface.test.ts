import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import { loadPortablePlugin } from "../src/parsers/portable"

const repoRoot = path.join(import.meta.dir, "..")
const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

async function readRepoFile(...segments: string[]): Promise<string> {
  return fs.readFile(path.join(repoRoot, ...segments), "utf8")
}

async function readRepoJson<T>(...segments: string[]): Promise<T> {
  return JSON.parse(await readRepoFile(...segments)) as T
}

async function pathExists(...segments: string[]): Promise<boolean> {
  try {
    await fs.access(path.join(repoRoot, ...segments))
    return true
  } catch {
    return false
  }
}

describe("published support surface", () => {
  test("generated metadata and plugin docs match the portable counts and description", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const pluginManifest = await readRepoJson<{ description: string }>("plugins", "compound-engineering", ".claude-plugin", "plugin.json")
    const marketplace = await readRepoJson<{ plugins: Array<{ description: string }> }>(".claude-plugin", "marketplace.json")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")

    expect(pluginManifest.description).toBe(plugin.manifest.description)
    expect(marketplace.plugins[0]?.description).toBe(plugin.manifest.description)
    expect(pluginReadme).toContain(
      `Includes ${plugin.agents.length} specialized agents, ${plugin.commands.length} commands, and ${plugin.skills.length} skills.`,
    )
    expect(pluginReadme).toContain(`| Agents | ${plugin.agents.length} |`)
    expect(pluginReadme).toContain(`| Commands | ${plugin.commands.length} |`)
    expect(pluginReadme).toContain(`| Skills | ${plugin.skills.length} |`)
  })

  test("plugin README presents the reduced support surface as a tiered support ladder", async () => {
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")

    expect(pluginReadme).toContain("OpenCode first-class, GitHub Copilot and Codex second, Claude Code third")
    expect(pluginReadme).toContain("**Codex:** explicit full local export plus repo marketplace packaging")
    expect(pluginReadme).toContain("**De-emphasize:** compatibility exporters for Droid, Pi, Gemini, and Kiro")
    expect(pluginReadme).toContain("**Removed legacy surfaces:** `.github_gpt/` and dormant Cursor-specific export/sync code")
    expect(pluginReadme).toContain("`/workflows:architecture` is the architecture-improvement handoff")
    expect(pluginReadme).toContain("Plans default to unit + e2e evidence")
    expect(pluginReadme).not.toContain("Includes 29 specialized agents, 25 commands")
  })

  test("changelog records the cleanup and workflow-contract changes shipped in the published surface", async () => {
    const pluginChangelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(pluginChangelog).toContain("**Support-surface cleanup**")
    expect(pluginChangelog).toContain("OpenCode first-class, GitHub Copilot and Codex second, Claude Code third")
    expect(pluginChangelog).toContain("**Codex full export**")
    expect(pluginChangelog).toContain("**Architecture handoff workflow**")
    expect(pluginChangelog).toContain("`/workflows:architecture`")
    expect(pluginChangelog).toContain("**Ralph/TDD evidence contract**")
    expect(pluginChangelog).toContain("unit + e2e evidence")
    expect(pluginChangelog).toContain("**Right-sized planning and lite workflow mode**")
    expect(pluginChangelog).toContain("`/workflows:plan --lite`")
  })

  test("README surfaces document full and lite workflow tracks", async () => {
    const rootReadme = await readRepoFile("README.md")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")
    const fullTrack =
      "constitution -> brainstorm -> plan -> architecture -> deepen-plan -> to-issues -> work -> review -> triage -> compound"
    const liteTrack =
      "`brainstorm/plan --lite -> work -> review -> triage if review creates todos -> compound if reusable knowledge exists`"

    for (const readme of [rootReadme, pluginReadme]) {
      expect(readme).toContain(fullTrack)
      expect(readme).toContain(liteTrack)
      expect(readme).toContain("lite mode is for small, low-risk changes")
      expect(readme).toContain("preserves TDD/evidence and scope contracts")
    }

    expect(rootReadme).toContain("36 specialized agents, 28 commands, and 26 skills")
    expect(rootReadme).not.toContain("34 specialized agents, 28 commands, and 26 skills")
  })

  test("published surfaces retire ideate as a standalone workflow and skill", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")

    expect(plugin.commands.some((command) => command.name === "workflows:ideate")).toBeFalse()
    expect(plugin.skills.some((skill) => skill.name === "ideate")).toBeFalse()
    expect(pluginReadme).not.toContain("`/workflows:ideate`")
    expect(pluginReadme).not.toContain("| `ideate` |")
    expect(await pathExists("plugins", "compound-engineering", "commands", "workflows", "ideate.md")).toBeFalse()
    expect(await pathExists(".github", "skills", "workflows-ideate", "SKILL.md")).toBeFalse()
    expect(await pathExists("plugins", "compound-engineering", "skills", "ideate", "SKILL.md")).toBeFalse()
  })

  test("lite planning is a mode of existing workflow commands, not a new portable command", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const commandNames = plugin.commands.map((command) => command.name)

    expect(commandNames).toContain("workflows:brainstorm")
    expect(commandNames).toContain("workflows:plan")
    expect(commandNames).not.toContain("workflows:plan-lite")
    expect(commandNames).not.toContain("workflows:lite")
    expect(plugin.commands.length).toBe(28)
  })

  test("publishes a path-only local visual artifact render wrapper", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const command = plugin.commands.find((candidate) => candidate.name === "visual-artifact")
    const portableCommand = await readRepoFile("portable", "compound-engineering", "commands", "visual-artifact.md")
    const generatedCommand = await readRepoFile("plugins", "compound-engineering", "commands", "visual-artifact.md")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")
    const changelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(command).toBeDefined()
    expect(command?.argumentHint).toBe("[artifact path] [--serve] [--port 3001]")
    expect(command?.codexModel).toBe("gpt-5.5")

    for (const content of [portableCommand, generatedCommand]) {
      expect(content).toContain("The user only needs to pass the artifact path")
      expect(content).toContain("docs/visual-artifacts/<workflow>/<slug>")
      expect(content).toContain("If the path points to `plan.mdx`, `canvas.mdx`, `prototype.mdx`, or `preview.html`, use its parent directory")
      expect(content).toContain("review -> `recap`; everything else -> `plan`")
      expect(content).toContain("plan local check --dir")
      expect(content).toContain("plan local preview --dir")
      expect(content).toContain("--out <artifact-dir>/preview.html")
      expect(content).toContain("--app-url http://127.0.0.1:<port>")
      expect(content).toContain("DEFAULT_LOCAL_PLAN_APP_PORT = 3001")
      expect(content).toContain("the CLI `--port` controls the localhost bridge port")
      expect(content).toContain("Never infer `30001`")
      expect(content).not.toContain("http://127.0.0.1:30001")
      expect(content).toContain("@agent-native/core@0.67.0")
      expect(content).not.toContain("@agent-native/core@latest")
      expect(content).not.toContain("@agent-native/core@<approved-version>")
      expect(content).not.toContain("mcpServers.plan")
      expect(content).not.toContain("create-visual-plan")
      expect(content).not.toContain("create-visual-recap")
    }

    expect(pluginReadme).toContain("| `/visual-artifact` | Render or serve a local visual artifact from only its artifact path |")
    expect(pluginReadme).toContain("| Commands | 28 |")
    expect(changelog).toContain("path-only `/visual-artifact` wrapper")
  })

  test("publishes one local visual artifact renderer agent across supported surfaces", async () => {
    const plugin = await loadPortablePlugin(portableRoot)
    const agent = plugin.agents.find((candidate) => candidate.name === "local-visual-artifact-renderer")
    const portableAgent = await readRepoFile(
      "portable",
      "compound-engineering",
      "agents",
      "workflow",
      "local-visual-artifact-renderer.md",
    )
    const generatedAgent = await readRepoFile(
      "plugins",
      "compound-engineering",
      "agents",
      "workflow",
      "local-visual-artifact-renderer.md",
    )
    const portableStyleReference = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "agent-native-plan-style.md",
    )
    const generatedStyleReference = await readRepoFile(
      "plugins",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "agent-native-plan-style.md",
    )
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")
    const changelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")

    expect(agent).toBeDefined()
    expect(agent?.model).toBe("opus-4.8")
    expect(agent?.codexModel).toBe("gpt-5.5")
    expect(agent?.copilotModel).toBe("gpt-5.5")
    expect(agent?.opencodeModel).toBe("openrouter/z-ai/glm-5.2")
    expect(plugin.agents.length).toBe(36)

    for (const content of [portableAgent, generatedAgent]) {
      expect(content).toContain("source artifact is authoritative")
      expect(content).toContain("commands/workflows/references/local-visual-artifacts.md")
      expect(content).toContain("commands/workflows/references/agent-native-plan-style.md")
      expect(content).toContain("plan blocks --format reference")
      expect(content).toContain("plan blocks --format schema")
      expect(content).toContain("docs/visual-artifacts/<workflow>/<slug>/")
      expect(content).toContain("localOnly: true")
      expect(content).toContain("agentNativeCoreVersion: \"0.67.0\"")
      expect(content).toContain("Generate `preview.html` with `npx @agent-native/core@0.67.0 plan local preview`")
      expect(content).toContain("--out <output-dir>/preview.html")
      expect(content).toContain("Static preview is the default handoff")
      expect(content).toContain("Plain Markdown with only cosmetic styling is a failure")
      expect(content).toContain("`diagram` with `data.html` / `data.css`")
      expect(content).toContain("`file-tree`, `tabs`, `annotated-code`, `diff`, `data-model`, `api-endpoint`, `json-explorer`, `checklist`, `table`, `callout`, and `question-form`")
      expect(content).toContain("canvas.mdx` and `wireframe` blocks only when the source artifact contains product UI")
      expect(content).toContain("source_path")
      expect(content).toContain("source_workflow")
      expect(content).toContain("visual_kind")
      expect(content).toContain("template_profile")
      expect(content).toContain("brainstorm")
      expect(content).toContain("architecture")
      expect(content).toContain("kind: recap")
      expect(content).toContain("Refuse hosted MCP")
      expect(content).toContain("do not hand-author the HTML")
      expect(content).not.toContain("@agent-native/core@latest")
    }

    for (const reference of [portableStyleReference, generatedStyleReference]) {
      expect(reference).toContain("Agent-Native Plan Style And Primitives")
      expect(reference).toContain("BuilderIO Agent-Native visual-plan style guidance")
      expect(reference).toContain("@agent-native/core@0.67.0")
      expect(reference).toContain("plan blocks --format reference")
      expect(reference).toContain("plan blocks --format schema")
      expect(reference).toContain("Complete Primitive Catalog")
      expect(reference).toContain("Anti-Flat-MDX Gate")
      expect(reference).toContain("Visual Surface Choice")
      expect(reference).toContain("Diagram Rules")
      expect(reference).toContain("Wireframe Rules")
      expect(reference).toContain("Canvas Rules")
      expect(reference).toContain("`diagram`")
      expect(reference).toContain("`file-tree`")
      expect(reference).toContain("`tabs`")
      expect(reference).toContain("`annotated-code`")
      expect(reference).toContain("`diff`")
      expect(reference).toContain("`data-model`")
      expect(reference).toContain("`api-endpoint`")
      expect(reference).toContain("`json-explorer`")
      expect(reference).toContain("`checklist`")
      expect(reference).toContain("`question-form`")
      expect(reference).toContain("`wireframe`")
      expect(reference).toContain(".diagram-panel")
      expect(reference).toContain("--wf-*")
      expect(reference).not.toContain("@agent-native/core@latest")
    }

    expect(pluginReadme).toContain("| `local-visual-artifact-renderer` |")
    expect(pluginReadme).toContain("BuilderIO Agent-Native plan style guidance")
    expect(pluginReadme).toContain("structured Plan primitives")
    expect(pluginReadme).toContain("| Agents | 36 |")
    expect(changelog).toContain("local visual artifact renderer")
    expect(changelog).toContain("Agent-Native visual style guidance")
  })

  test("local visual artifact guardrails stay local-only across the published surface", async () => {
    const pluginYaml = await readRepoFile("portable", "compound-engineering", "plugin.yaml")
    const portableReference = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "local-visual-artifacts.md",
    )
    const generatedReference = await readRepoFile(
      "plugins",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "local-visual-artifacts.md",
    )
    const portableStyleReference = await readRepoFile(
      "portable",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "agent-native-plan-style.md",
    )
    const generatedStyleReference = await readRepoFile(
      "plugins",
      "compound-engineering",
      "commands",
      "workflows",
      "references",
      "agent-native-plan-style.md",
    )
    const workflows = await Promise.all(
      ["brainstorm", "plan", "architecture", "review"].map((workflow) =>
        readRepoFile("portable", "compound-engineering", "commands", "workflows", `${workflow}.md`),
      ),
    )
    const renderer = await readRepoFile(
      "portable",
      "compound-engineering",
      "agents",
      "workflow",
      "local-visual-artifact-renderer.md",
    )
    const rootReadme = await readRepoFile("README.md")
    const pluginReadme = await readRepoFile("plugins", "compound-engineering", "README.md")
    const changelog = await readRepoFile("plugins", "compound-engineering", "CHANGELOG.md")
    const gitignore = await readRepoFile(".gitignore")
    const forbiddenHostedTools = [
      "create-visual-plan",
      "create-visual-recap",
      "update-visual-plan",
      "patch-visual-plan-source",
      "import-visual-plan-source",
      "export-visual-plan",
      "set-resource-visibility",
    ]

    expect(pluginYaml).toContain("mcpServers:")
    expect(pluginYaml).toContain("context7:")
    expect(pluginYaml).not.toContain("\n  plan:")
    expect(gitignore).toContain("docs/visual-artifacts/")

    for (const reference of [portableReference, generatedReference]) {
      expect(reference).toContain("@agent-native/core@0.67.0")
      expect(reference).toContain("license: MIT")
      expect(reference).toContain("commands/workflows/references/agent-native-plan-style.md")
      expect(reference).toContain("plan blocks --format reference")
      expect(reference).toContain("plan-blocks.md")
      expect(reference).toContain("plain Markdown with a different background is a rendering failure")
      expect(reference).not.toContain("@agent-native/core@latest")
      expect(reference).not.toContain("@agent-native/core@<approved-version>")
      expect(reference).not.toContain("mcpServers.plan")
      expect(reference).toContain("preview.html` when command execution is available")
      expect(reference).toContain("--kind recap --out docs/visual-artifacts/review/<slug>/preview.html")
      expect(reference).toContain("Static preview is the default local handoff")

      for (const line of reference.split("\n").filter((candidate) => candidate.includes("plan local serve"))) {
        expect(line).toContain("--app-url http://127.0.0.1:3001")
      }

      expect(reference).toContain("never silently substitute `30001`")
      expect(reference).toContain("`--port` controls the bridge port")
      expect(reference).not.toContain("http://127.0.0.1:30001")
    }

    for (const reference of [portableStyleReference, generatedStyleReference]) {
      expect(reference).toContain("local-only workflow")
      expect(reference).toContain("license: MIT")
      expect(reference).toContain("Do not author from memory")
      expect(reference).toContain("Plain Markdown with only cosmetic styling is a failure")
      expect(reference).toContain("`diagram`, `file-tree`, `tabs`, `annotated-code`, `diff`, `data-model`, `api-endpoint`, `json-explorer`, `checklist`, `table`, `callout`, `question-form`, `wireframe`")
      expect(reference).toContain("Do not use a top canvas for architecture-only")
      expect(reference).toContain("Do not write `<html>`, `<body>`, `<script>`, `<style>`")
      expect(reference).not.toContain("@agent-native/core@latest")
      expect(reference).not.toContain("mcpServers.plan")
    }

    for (const prompt of workflows) {
      expect(prompt).toContain("local-visual-artifact-renderer")
      expect(prompt).not.toContain("mcpServers.plan")
      for (const tool of forbiddenHostedTools) {
        expect(prompt).not.toContain(tool)
      }
    }

    expect(renderer).toContain("@agent-native/core@0.67.0")
    expect(renderer).not.toContain("@agent-native/core@latest")
    expect(renderer).not.toContain("@agent-native/core@<approved-version>")
    expect(renderer).toContain("Do not call hosted Plan tools")

    for (const docsSurface of [rootReadme, pluginReadme, changelog]) {
      expect(docsSurface).toContain("local-only visual artifacts")
      expect(docsSurface).toContain("36 specialized agents")
    }
  })
})
