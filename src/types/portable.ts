import type { ClaudePlugin, ClaudeMcpServer } from "./claude"

export type PortableDescription =
  | string
  | {
      lead: string
      suffix?: string
    }

export type PortableMarketplace = {
  name: string
  owner?: {
    name?: string
    url?: string
  }
  metadata?: {
    description?: string
    version?: string
  }
}

export type PortableManifest = {
  name: string
  version: string
  description?: PortableDescription
  author?: {
    name?: string
    email?: string
    url?: string
  }
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  mcpServers?: Record<string, ClaudeMcpServer>
  marketplace?: PortableMarketplace
}

export type PortablePlugin = ClaudePlugin & {
  portableManifest: PortableManifest
}
