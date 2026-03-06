/**
 * aegis init
 *
 * The main event. Scans the repo, starts a discovery conversation
 * with the human, and produces the .agentpolicy/ directory.
 *
 * There are no spinners or progress bars. Aegis just shows up.
 * The scan happens quietly before the first message. The policy
 * gets written quietly after the last one. In between, it's just
 * two people talking.
 */

import { resolveApiKey } from "../config/api-key.js";
import { AnthropicProvider } from "../llm/anthropic.js";
import { scanRepo } from "../discovery/scanner.js";
import { DiscoveryEngine } from "../discovery/engine.js";
import { writePolicy } from "../policy/writer.js";
import { loadMemory, pruneMemory, saveMemory, getProjectMemory } from "../memory/store.js";
import { TerminalUI } from "../ui/terminal.js";

export async function initCommand(): Promise<void> {
  const ui = new TerminalUI();

  try {
    ui.showWelcome();

    // Resolve API key (this may prompt interactively — that's fine,
    // it's a one-time setup moment, not a recurring UI pattern)
    const apiKey = await resolveApiKey();
    const provider = new AnthropicProvider(apiKey);

    // Validate API key quietly
    const valid = await provider.validate();
    if (!valid) {
      ui.showError(
        "Couldn't connect with that API key. Check that it's valid and try again."
      );
      process.exit(1);
    }

    // Scan the repo quietly — Aegis does his homework before the meeting
    const cwd = process.cwd();
    const scan = await scanRepo(cwd);

    // Load and prune memory
    let memory = loadMemory();
    memory = pruneMemory(memory);
    saveMemory(memory);
    const projectMemory = getProjectMemory(memory, scan.projectName);
    const hasMemory = Object.keys(projectMemory).length > 0;

    // Run the conversation — this is the whole thing
    const engine = new DiscoveryEngine(
      provider,
      scan,
      hasMemory ? projectMemory : null,
      ui
    );

    const result = await engine.run();

    // Write policy quietly
    const files = writePolicy(cwd, result.policy);

    // Show what was created — minimal, Aegis already said the warm goodbye
    ui.showFilesCreated(files);
  } catch (error) {
    if (error instanceof Error && error.message.includes("SIGINT")) {
      console.log("\n");
      ui.showNote("Interrupted. Run aegis init again anytime.");
      process.exit(0);
    }
    ui.showError(
      error instanceof Error ? error.message : "Something went wrong."
    );
    process.exit(1);
  } finally {
    ui.destroy();
  }
}
