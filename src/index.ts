#!/usr/bin/env bun
import { defineCommand, runMain } from "citty"
import build from "./commands/build"
import convert from "./commands/convert"
import install from "./commands/install"
import listCommand from "./commands/list"
import sync from "./commands/sync"
import syncOv from "./commands/sync-ov"

const main = defineCommand({
  meta: {
    name: "compound-plugin",
    version: "0.1.0",
    description: "Build portable plugins and convert them into agent formats",
  },
  subCommands: {
    build: () => build,
    convert: () => convert,
    install: () => install,
    list: () => listCommand,
    sync: () => sync,
    "sync-ov": () => syncOv,
  },
})

runMain(main)
