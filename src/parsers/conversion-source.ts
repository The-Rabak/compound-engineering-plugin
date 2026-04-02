import path from "path"
import type { ClaudePlugin } from "../types/claude"
import { pathExists } from "../utils/files"
import { loadClaudePlugin } from "./claude"
import { loadPortablePlugin } from "./portable"

const PORTABLE_MANIFEST = "plugin.yaml"

export async function loadPluginForTargetConversion(inputPath: string): Promise<ClaudePlugin> {
  const directPortablePath = await resolveDirectPortablePath(inputPath)
  if (directPortablePath) {
    return await loadPortablePlugin(directPortablePath)
  }

  const plugin = await loadClaudePlugin(inputPath)
  const portableSourcePath = await findPortableSourcePath(plugin.root, plugin.manifest.name)
  if (portableSourcePath) {
    return await loadPortablePlugin(portableSourcePath)
  }

  return plugin
}

async function resolveDirectPortablePath(inputPath: string): Promise<string | undefined> {
  const absolute = path.resolve(inputPath)
  const manifestAtPath = path.join(absolute, PORTABLE_MANIFEST)

  if (await pathExists(manifestAtPath)) {
    return absolute
  }

  if (absolute.endsWith(PORTABLE_MANIFEST) && (await pathExists(absolute))) {
    return absolute
  }

  return undefined
}

async function findPortableSourcePath(startPath: string, pluginName: string): Promise<string | undefined> {
  const pluginRoot = path.resolve(startPath)
  if (!isGeneratedPluginLayout(pluginRoot, pluginName)) {
    return undefined
  }

  let current = pluginRoot

  while (true) {
    const candidate = path.join(current, "portable", pluginName, PORTABLE_MANIFEST)
    if (await pathExists(candidate)) {
      return candidate
    }

    const parent = path.dirname(current)
    if (parent === current) {
      return undefined
    }
    current = parent
  }
}

function isGeneratedPluginLayout(pluginRoot: string, pluginName: string): boolean {
  return path.basename(pluginRoot) === pluginName && path.basename(path.dirname(pluginRoot)) === "plugins"
}
