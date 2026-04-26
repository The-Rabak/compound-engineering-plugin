import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import os from "os"

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function runGit(args: string[], cwd: string, env?: NodeJS.ProcessEnv): Promise<void> {
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: env ?? process.env,
  })
  const exitCode = await proc.exited
  const stderr = await new Response(proc.stderr).text()
  if (exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed (exit ${exitCode}).\nstderr: ${stderr}`)
  }
 }

describe("CLI", () => {
  test("install converts fixture plugin to OpenCode output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-opencode-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "install",
      fixtureRoot,
      "--to",
      "opencode",
      "--output",
      tempRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Installed compound-engineering")
    expect(await exists(path.join(tempRoot, "opencode.json"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".opencode", "agents", "repo-research-analyst.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".opencode", "agents", "security-sentinel.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".opencode", "skills", "skill-one", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".opencode", "plugins", "converted-hooks.ts"))).toBe(true)
  })

  test("install defaults output to ~/.config/opencode", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-local-default-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")

    const repoRoot = path.join(import.meta.dir, "..")
    const proc = Bun.spawn([
      "bun",
      "run",
      path.join(repoRoot, "src", "index.ts"),
      "install",
      fixtureRoot,
      "--to",
      "opencode",
    ], {
      cwd: tempRoot,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HOME: tempRoot,
      },
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Installed compound-engineering")
    // OpenCode global config lives at ~/.config/opencode per XDG spec
    expect(await exists(path.join(tempRoot, ".config", "opencode", "opencode.json"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".config", "opencode", "agents", "repo-research-analyst.md"))).toBe(true)
  })

  test("list returns plugins in a temp workspace", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-list-"))
    const pluginsRoot = path.join(tempRoot, "plugins", "demo-plugin", ".claude-plugin")
    await fs.mkdir(pluginsRoot, { recursive: true })
    await fs.writeFile(path.join(pluginsRoot, "plugin.json"), "{\n  \"name\": \"demo-plugin\",\n  \"version\": \"1.0.0\"\n}\n")

    const repoRoot = path.join(import.meta.dir, "..")
    const proc = Bun.spawn(["bun", "run", path.join(repoRoot, "src", "index.ts"), "list"], {
      cwd: tempRoot,
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("demo-plugin")
  })

  test("install pulls from GitHub when local path is missing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-github-install-"))
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-github-workspace-"))
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-github-repo-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")
    const pluginRoot = path.join(repoRoot, "plugins", "compound-engineering")

    await fs.mkdir(path.dirname(pluginRoot), { recursive: true })
    await fs.cp(fixtureRoot, pluginRoot, { recursive: true })

    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.com",
    }

    await runGit(["init"], repoRoot, gitEnv)
    await runGit(["add", "."], repoRoot, gitEnv)
    await runGit(["commit", "-m", "fixture"], repoRoot, gitEnv)

    const projectRoot = path.join(import.meta.dir, "..")
    const proc = Bun.spawn([
      "bun",
      "run",
      path.join(projectRoot, "src", "index.ts"),
      "install",
      "compound-engineering",
      "--to",
      "opencode",
    ], {
      cwd: workspaceRoot,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HOME: tempRoot,
        COMPOUND_PLUGIN_GITHUB_SOURCE: repoRoot,
      },
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Installed compound-engineering")
    // OpenCode global config lives at ~/.config/opencode per XDG spec
    expect(await exists(path.join(tempRoot, ".config", "opencode", "opencode.json"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".config", "opencode", "agents", "repo-research-analyst.md"))).toBe(true)
  })

  test("install by name ignores same-named local directory", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-shadow-"))
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-shadow-workspace-"))
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-shadow-repo-"))

    // Create a directory with the plugin name that is NOT a valid plugin
    const shadowDir = path.join(workspaceRoot, "compound-engineering")
    await fs.mkdir(shadowDir, { recursive: true })
    await fs.writeFile(path.join(shadowDir, "README.md"), "Not a plugin")

    // Set up a fake GitHub source with a valid plugin
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")
    const pluginRoot = path.join(repoRoot, "plugins", "compound-engineering")
    await fs.mkdir(path.dirname(pluginRoot), { recursive: true })
    await fs.cp(fixtureRoot, pluginRoot, { recursive: true })

    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.com",
    }
    await runGit(["init"], repoRoot, gitEnv)
    await runGit(["add", "."], repoRoot, gitEnv)
    await runGit(["commit", "-m", "fixture"], repoRoot, gitEnv)

    const projectRoot = path.join(import.meta.dir, "..")
    const proc = Bun.spawn([
      "bun",
      "run",
      path.join(projectRoot, "src", "index.ts"),
      "install",
      "compound-engineering",
      "--to",
      "opencode",
      "--output",
      tempRoot,
    ], {
      cwd: workspaceRoot,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HOME: tempRoot,
        COMPOUND_PLUGIN_GITHUB_SOURCE: repoRoot,
      },
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    // Should succeed by fetching from GitHub, NOT failing on the local shadow directory
    expect(stdout).toContain("Installed compound-engineering")
    expect(await exists(path.join(tempRoot, "opencode.json"))).toBe(true)
  })

  test("convert writes OpenCode output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-convert-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "convert",
      fixtureRoot,
      "--to",
      "opencode",
      "--output",
      tempRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Converted compound-engineering")
    expect(await exists(path.join(tempRoot, "opencode.json"))).toBe(true)
  })

  test("convert prefers portable source when generating Copilot output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-convert-copilot-"))
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-convert-portable-source-"))
    const portableFixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")
    const generatedFixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")
    const pluginRoot = path.join(repoRoot, "plugins", "compound-engineering")
    const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

    await fs.mkdir(path.dirname(pluginRoot), { recursive: true })
    await fs.mkdir(path.dirname(portableRoot), { recursive: true })
    await fs.cp(generatedFixtureRoot, pluginRoot, { recursive: true })
    await fs.cp(portableFixtureRoot, portableRoot, { recursive: true })

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "convert",
      pluginRoot,
      "--to",
      "copilot",
      "--output",
      tempRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    const skillContent = await fs.readFile(path.join(tempRoot, ".github", "skills", "skill-one", "SKILL.md"), "utf8")
    expect(stdout).toContain("Converted compound-engineering to copilot")
    expect(skillContent).toContain("model: gpt-5.4-mini")
  })

  test("install prefers portable source when cloning for Copilot output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-install-copilot-"))
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-install-copilot-workspace-"))
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-install-copilot-repo-"))
    const portableFixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")
    const generatedFixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")
    const pluginRoot = path.join(repoRoot, "plugins", "compound-engineering")
    const portableRoot = path.join(repoRoot, "portable", "compound-engineering")

    await fs.mkdir(path.dirname(pluginRoot), { recursive: true })
    await fs.mkdir(path.dirname(portableRoot), { recursive: true })
    await fs.cp(generatedFixtureRoot, pluginRoot, { recursive: true })
    await fs.cp(portableFixtureRoot, portableRoot, { recursive: true })

    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.com",
    }

    await runGit(["init"], repoRoot, gitEnv)
    await runGit(["add", "."], repoRoot, gitEnv)
    await runGit(["commit", "-m", "fixture"], repoRoot, gitEnv)

    const projectRoot = path.join(import.meta.dir, "..")
    const proc = Bun.spawn([
      "bun",
      "run",
      path.join(projectRoot, "src", "index.ts"),
      "install",
      "compound-engineering",
      "--to",
      "copilot",
      "--output",
      tempRoot,
    ], {
      cwd: workspaceRoot,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HOME: tempRoot,
        COMPOUND_PLUGIN_GITHUB_SOURCE: repoRoot,
      },
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    const skillContent = await fs.readFile(path.join(tempRoot, ".github", "skills", "skill-one", "SKILL.md"), "utf8")
    expect(stdout).toContain("Installed compound-engineering")
    expect(skillContent).toContain("model: gpt-5.4-mini")
  })

  test("build writes Claude and Copilot outputs from portable source", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-build-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "build",
      fixtureRoot,
      "--output",
      tempRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Built Claude output")
    expect(stdout).toContain("Built Copilot output")
    const claudePluginRoot = path.join(tempRoot, "plugins", "compound-engineering")
    const copilotSkillsRoot = path.join(tempRoot, ".github", "skills")
    expect(await exists(path.join(claudePluginRoot, ".claude-plugin", "plugin.json"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".claude-plugin", "marketplace.json"))).toBe(true)
    expect(await exists(path.join(tempRoot, ".github", "agents", "repo-research-analyst.agent.md"))).toBe(true)
    const generatedSkillPath = path.join(copilotSkillsRoot, "workflows-plan", "SKILL.md")
    expect(await exists(generatedSkillPath)).toBe(true)

    const claudeSkillContent = await fs.readFile(path.join(claudePluginRoot, "skills", "skill-one", "SKILL.md"), "utf8")
    expect(claudeSkillContent).toContain("model: haiku")

    const generatedSkillContent = await fs.readFile(generatedSkillPath, "utf8")
    expect(generatedSkillContent).toContain("model: gpt-5.4-mini")

    const copiedSkillPath = path.join(copilotSkillsRoot, "skill-one", "SKILL.md")
    expect(await exists(copiedSkillPath)).toBe(true)
    const copiedSkillContent = await fs.readFile(copiedSkillPath, "utf8")
    expect(copiedSkillContent).toContain("model: gpt-5.4-mini")
    expect(copiedSkillContent).toContain("/workflows-plan")
    expect(copiedSkillContent).toContain("~/.copilot/skills/skill-one/notes.md")
  })

  test("sync-ov registers portable agents, skills, commands, and skill support files", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-sync-ov-"))
    const sourceFixture = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")
    const fixtureRoot = path.join(tempRoot, "portable-plugin")
    const fakeOvCore = path.join(import.meta.dir, "fixtures", "fake-ov-core.sh")
    const fakeOvRoot = path.join(tempRoot, "ov-global")
    const fakeOvLog = path.join(tempRoot, "ov.log")

    await fs.cp(sourceFixture, fixtureRoot, { recursive: true })
    const constitutionCommandPath = path.join(fixtureRoot, "commands", "workflows", "constitution.md")
    await fs.writeFile(
      constitutionCommandPath,
      [
        "---",
        "name: workflows:constitution",
        "description: Create a repo constitution.",
        "---",
        "",
        "Task repo-research-analyst(understand repo rules)",
        "",
      ].join("\n"),
      "utf8",
    )

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "sync-ov",
      fixtureRoot,
      "--ov-core",
      fakeOvCore,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        FAKE_OV_ROOT: fakeOvRoot,
        FAKE_OV_LOG: fakeOvLog,
      },
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Synced 1 agents, 1 skills, 2 commands, and 1 skill support files")
    expect(await exists(path.join(fakeOvRoot, "agents", "repo-research-analyst.md"))).toBe(true)
    expect(await exists(path.join(fakeOvRoot, "skills", "skill-one.md"))).toBe(true)
    expect(await exists(path.join(fakeOvRoot, "skills", "workflows-constitution.md"))).toBe(true)
    const mirroredSupportPath = path.join(fakeOvRoot, "skills", "skill-one", "references", "guide.txt")
    expect(await exists(mirroredSupportPath)).toBe(true)
    expect(await fs.readFile(mirroredSupportPath, "utf8")).toBe("Portable reference\n")
    const generatedCommandContent = await fs.readFile(path.join(fakeOvRoot, "skills", "workflows-constitution.md"), "utf8")
    expect(generatedCommandContent).toContain("name: workflows-constitution")
    expect(generatedCommandContent).toContain("Use the repo-research-analyst skill to: understand repo rules")

    const log = await fs.readFile(fakeOvLog, "utf8")
    expect(log).toContain(`resource\tviking://resources/_global/agents\t${path.join(fakeOvRoot, "agents", "repo-research-analyst.md")}`)
    expect(log).toContain(`resource\tviking://resources/_global/skills\t${path.join(fakeOvRoot, "skills", "skill-one.md")}`)
    expect(log).toContain(`resource\tviking://resources/_global/skills\t${path.join(fakeOvRoot, "skills", "workflows-constitution.md")}`)
    expect(log).toContain("resource\tviking://resources/_global/skills/skill-one/references")
    expect(log).toContain("rebuild\tglobal-manifest")
  })

  test("sync-ov rejects unsafe skill names before mirroring", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-sync-ov-invalid-skill-"))
    const sourceFixture = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")
    const fixtureRoot = path.join(tempRoot, "portable-plugin")
    const fakeOvCore = path.join(import.meta.dir, "fixtures", "fake-ov-core.sh")
    const fakeOvRoot = path.join(tempRoot, "ov-global")
    const fakeOvLog = path.join(tempRoot, "ov.log")

    await fs.cp(sourceFixture, fixtureRoot, { recursive: true })
    const skillPath = path.join(fixtureRoot, "skills", "skill-one", "SKILL.md")
    const rawSkill = await fs.readFile(skillPath, "utf8")
    await fs.writeFile(skillPath, rawSkill.replace("name: skill-one", "name: .."))

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "sync-ov",
      fixtureRoot,
      "--ov-core",
      fakeOvCore,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        FAKE_OV_ROOT: fakeOvRoot,
        FAKE_OV_LOG: fakeOvLog,
      },
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const combinedOutput = `${stdout}\n${stderr}`

    expect(exitCode).not.toBe(0)
    expect(combinedOutput).toContain("Invalid skill name for OpenViking sync: ..")
    expect(await exists(fakeOvRoot)).toBe(false)
  })

  test("sync-ov sanitizes inherited shell startup hooks and PATH", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-sync-ov-bashenv-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-portable-plugin")
    const fakeOvCore = path.join(import.meta.dir, "fixtures", "fake-ov-core.sh")
    const fakeOvRoot = path.join(tempRoot, "ov-global")
    const fakeOvLog = path.join(tempRoot, "ov.log")
    const envSnapshotPath = path.join(tempRoot, "env.txt")
    const markerPath = path.join(tempRoot, "bash-env-marker.txt")
    const bashEnvPath = path.join(tempRoot, "malicious-bashenv.sh")
    const pathMarkerPath = path.join(tempRoot, "path-marker.txt")
    const fakeBin = path.join(tempRoot, "bin")
    const fakeCpPath = path.join(fakeBin, "cp")

    await fs.writeFile(bashEnvPath, `printf 'unexpected' > ${JSON.stringify(markerPath)}\n`, "utf8")
    await fs.mkdir(fakeBin, { recursive: true })
    await fs.writeFile(
      fakeCpPath,
      `#!/usr/bin/env bash\nprintf 'unexpected' > ${JSON.stringify(pathMarkerPath)}\nexec /bin/cp \"$@\"\n`,
      "utf8",
    )
    await fs.chmod(fakeCpPath, 0o755)

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "sync-ov",
      fixtureRoot,
      "--ov-core",
      fakeOvCore,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        BASH_ENV: bashEnvPath,
        "BASH_FUNC_source%%": "() { printf 'unexpected' > " + JSON.stringify(markerPath) + "; }",
        PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
        FAKE_OV_ROOT: fakeOvRoot,
        FAKE_OV_LOG: fakeOvLog,
        FAKE_OV_ENV_SNAPSHOT: envSnapshotPath,
      },
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(await exists(markerPath)).toBe(false)
    expect(await exists(pathMarkerPath)).toBe(false)
    expect(await exists(path.join(fakeOvRoot, "skills", "skill-one.md"))).toBe(true)

    const envSnapshot = await fs.readFile(envSnapshotPath, "utf8")
    expect(envSnapshot).not.toContain("BASH_ENV=")
    expect(envSnapshot).not.toContain("BASH_FUNC_source")
    expect(envSnapshot).not.toContain(`PATH=${fakeBin}`)
    expect(envSnapshot).toContain(`PATH=${path.join(process.env.HOME ?? "", ".local", "bin")}`)
    expect(envSnapshot).toContain("/usr/bin")
  })

  test("convert supports --codex-home for codex output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-codex-home-"))
    const codexRoot = path.join(tempRoot, ".codex")
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "convert",
      fixtureRoot,
      "--to",
      "codex",
      "--codex-home",
      codexRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Converted compound-engineering")
    expect(stdout).toContain(codexRoot)
    expect(await exists(path.join(codexRoot, "prompts", "workflows-review.md"))).toBe(true)
    expect(await exists(path.join(codexRoot, "skills", "workflows-review", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(codexRoot, "AGENTS.md"))).toBe(true)
  })

  test("install supports --also with codex output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-also-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")
    const codexRoot = path.join(tempRoot, ".codex")

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "install",
      fixtureRoot,
      "--to",
      "opencode",
      "--also",
      "codex",
      "--codex-home",
      codexRoot,
      "--output",
      tempRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Installed compound-engineering")
    expect(stdout).toContain(codexRoot)
    expect(await exists(path.join(codexRoot, "prompts", "workflows-review.md"))).toBe(true)
    expect(await exists(path.join(codexRoot, "skills", "workflows-review", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(codexRoot, "skills", "skill-one", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(codexRoot, "AGENTS.md"))).toBe(true)
  })

  test("convert supports --pi-home for pi output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-pi-home-"))
    const piRoot = path.join(tempRoot, ".pi")
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "convert",
      fixtureRoot,
      "--to",
      "pi",
      "--pi-home",
      piRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Converted compound-engineering")
    expect(stdout).toContain(piRoot)
    expect(await exists(path.join(piRoot, "prompts", "workflows-review.md"))).toBe(true)
    expect(await exists(path.join(piRoot, "skills", "repo-research-analyst", "SKILL.md"))).toBe(true)
    expect(await exists(path.join(piRoot, "extensions", "compound-engineering-compat.ts"))).toBe(true)
    expect(await exists(path.join(piRoot, "compound-engineering", "mcporter.json"))).toBe(true)
  })

  test("install supports --also with pi output", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-also-pi-"))
    const fixtureRoot = path.join(import.meta.dir, "fixtures", "sample-plugin")
    const piRoot = path.join(tempRoot, ".pi")

    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "install",
      fixtureRoot,
      "--to",
      "opencode",
      "--also",
      "pi",
      "--pi-home",
      piRoot,
      "--output",
      tempRoot,
    ], {
      cwd: path.join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("Installed compound-engineering")
    expect(stdout).toContain(piRoot)
    expect(await exists(path.join(piRoot, "prompts", "workflows-review.md"))).toBe(true)
    expect(await exists(path.join(piRoot, "extensions", "compound-engineering-compat.ts"))).toBe(true)
  })
})
