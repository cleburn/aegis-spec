/**
 * aegis explain
 *
 * Has Aegis read the current .agentpolicy/ and explain it in
 * plain language. Like asking your COO to walk you through
 * the operating procedures.
 */

import chalk from "chalk";
import { resolveApiKey } from "../config/api-key.js";
import { AnthropicProvider } from "../llm/anthropic.js";
import { explainPolicy } from "../policy/explainer.js";

const AEGIS = chalk.hex("#5B8DEF");

export async function explainCommand(): Promise<void> {
  try {
    const apiKey = await resolveApiKey();
    const provider = new AnthropicProvider(apiKey);

    console.log("");
    process.stdout.write(`  ${AEGIS("aegis")}  `);

    await explainPolicy(process.cwd(), provider, (token) => {
      process.stdout.write(token);
    });

    console.log("\n");
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Something went wrong.";
    console.log(`\n  ${msg}\n`);
    process.exit(1);
  }
}
