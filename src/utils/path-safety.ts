import { isValidSkillName } from "./symlink"

export function assertSafeOutputName(name: string, label: string): void {
  if (!isValidSkillName(name)) {
    throw new Error(`${label} name contains unsafe path characters: ${name}`)
  }
}
