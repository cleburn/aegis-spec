#!/usr/bin/env node

/**
 * aegis — The best colleague you've ever had.
 *
 * Usage:
 *   aegis init       Start a discovery conversation and generate .agentpolicy/
 *   aegis explain    Have Aegis explain the current policy in plain language
 *   aegis validate   Validate policy files against the schemas
 *   aegis memory     See what Aegis remembers about you
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { initCommand } from "../src/commands/init.js";
import { explainCommand } from "../src/commands/explain.js";
import { validateCommand } from "../src/commands/validate.js";
import {
  memoryCommand,
  memoryDeleteCommand,
  memoryClearCommand,
} from "../src/commands/memory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

const program = new Command();

program
  .name("aegis")
  .description("The best colleague you've ever had — for every AI agent on your team.")
  .version(pkg.version);

program
  .command("init")
  .description("Start a discovery conversation and generate .agentpolicy/")
  .action(async () => {
    await initCommand();
  });

program
  .command("explain")
  .description("Have Aegis explain the current policy in plain language")
  .action(async () => {
    await explainCommand();
  });

program
  .command("validate")
  .description("Validate policy files against the Aegis schemas")
  .action(async () => {
    await validateCommand();
  });

const mem = program
  .command("memory")
  .description("See what Aegis remembers about you")
  .action(async () => {
    await memoryCommand();
  });

mem
  .command("delete <number>")
  .description("Delete a specific memory entry")
  .action(async (number: string) => {
    await memoryDeleteCommand(parseInt(number, 10));
  });

mem
  .command("clear")
  .description("Clear all of Aegis's memories")
  .action(async () => {
    await memoryClearCommand();
  });

program.parse();