import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { walkFiles } from "../src/utils/files"

describe("walkFiles", () => {
  test("returns deterministic lexical order while traversing nested directories", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "walk-files-order-"))

    const nestedA = path.join(tempRoot, "b-dir")
    const nestedB = path.join(tempRoot, "a-dir")
    await fs.mkdir(path.join(nestedA, "sub"), { recursive: true })
    await fs.mkdir(nestedB, { recursive: true })

    const file1 = path.join(tempRoot, "z-root.txt")
    const file2 = path.join(nestedB, "a-child.txt")
    const file3 = path.join(nestedA, "sub", "b-grandchild.txt")

    await fs.writeFile(file1, "z", "utf8")
    await fs.writeFile(file2, "a", "utf8")
    await fs.writeFile(file3, "b", "utf8")

    const files = await walkFiles(tempRoot)

    expect(files).toEqual([file2, file3, file1])
  })
})
