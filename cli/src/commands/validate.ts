/**
 * aegis validate
 *
 * Validates the .agentpolicy/ directory against the Aegis schemas.
 * Quick, local, no API key needed.
 */

import chalk from "chalk";
import { validatePolicy } from "../policy/validator.js";

const DIM = chalk.dim;

export async function validateCommand(): Promise<void> {
  const cwd = process.cwd();
  const results = validatePolicy(cwd);

  if (results.length === 0) {
    console.log("\n  No .agentpolicy/ directory found. Run aegis init first.\n");
    process.exit(1);
  }

  console.log("");

  let allValid = true;

  for (const result of results) {
    const shortPath = result.file.replace(cwd + "/", "");

    if (result.valid) {
      console.log(`  ${DIM("✓")} ${DIM(shortPath)}`);
    } else {
      allValid = false;
      console.log(`  ✗ ${shortPath}`);
      for (const error of result.errors) {
        console.log(`    ${DIM(error)}`);
      }
    }
  }

  console.log("");

  if (allValid) {
    console.log(`  All valid.\n`);
  } else {
    console.log(`  Some files have issues.\n`);
    process.exit(1);
  }
}
