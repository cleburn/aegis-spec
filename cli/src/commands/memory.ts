/**
 * aegis memory
 *
 * Lets the human audit and edit what Aegis remembers about them.
 * Transparency is non-negotiable — if Aegis remembers something,
 * the human can see it and delete it.
 */

import * as readline from "node:readline";
import chalk from "chalk";
import { loadMemory, saveMemory, removeMemory } from "../memory/store.js";

const DIM = chalk.dim;
const ACCENT = chalk.hex("#5B8DEF");

export async function memoryCommand(): Promise<void> {
  const store = loadMemory();

  if (store.entries.length === 0) {
    console.log("");
    console.log(
      `  ${DIM("Aegis doesn't have any memories yet.")}`
    );
    console.log(
      `  ${DIM("Run")} ${ACCENT("aegis init")} ${DIM("to start a conversation.")}\n`
    );
    return;
  }

  console.log("");
  console.log(
    `  ${chalk.bold("What Aegis remembers")}\n`
  );

  for (let i = 0; i < store.entries.length; i++) {
    const entry = store.entries[i];
    const scope = entry.project ? DIM(`[${entry.project}]`) : DIM("[global]");
    const date = DIM(
      new Date(entry.updatedAt).toLocaleDateString()
    );
    console.log(
      `  ${DIM(`${i + 1}.`)} ${scope} ${chalk.bold(entry.key)}: ${entry.value}  ${date}`
    );
  }

  console.log("");
  console.log(
    DIM(
      "  To delete an entry, run: aegis memory --delete <number>"
    )
  );
  console.log(
    DIM("  To clear everything: aegis memory --clear\n")
  );
}

export async function memoryDeleteCommand(index: number): Promise<void> {
  let store = loadMemory();

  if (index < 1 || index > store.entries.length) {
    console.log(
      `\n  ${chalk.red("✗")} Invalid entry number. Run ${ACCENT("aegis memory")} to see the list.\n`
    );
    return;
  }

  const entry = store.entries[index - 1];
  store = removeMemory(store, index - 1);
  saveMemory(store);

  console.log(
    `\n  ${chalk.green("✓")} Deleted: ${entry.key}\n`
  );
}

export async function memoryClearCommand(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(
      `\n  ${chalk.yellow("⚠")} Clear all of Aegis's memories? This can't be undone. (y/n): `,
      resolve
    );
  });
  rl.close();

  if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
    saveMemory({ version: "0.1.0", entries: [] });
    console.log(`\n  ${chalk.green("✓")} All memories cleared.\n`);
  } else {
    console.log(`\n  ${DIM("Cancelled.")}\n`);
  }
}
