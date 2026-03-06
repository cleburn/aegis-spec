/**
 * Terminal UI
 *
 * This is NOT an app interface. It's a conversation.
 *
 * Aegis is a person in another room. Messages arrive like texts from
 * a colleague. There are no spinners, no progress bars, no "Scanning..."
 * indicators. When Aegis needs a moment to think, there's just a natural
 * pause — the way there would be if a real person was typing.
 *
 * Visual elements (ANSI art, charts, notepads) are NEVER chrome or
 * decoration. They're introduced conversationally by Aegis when they'd
 * genuinely help — "mind if I sketch this out?" — and they feel like
 * something a creative colleague would do on a whiteboard.
 *
 * The spirit check: Does this feel like texting someone you respect
 * and enjoy working with? If anything feels like "interacting with
 * software," we've drifted.
 */

import * as readline from "node:readline";
import chalk from "chalk";
import type { ScanResult } from "../discovery/scanner.js";

// Subtle color palette — not branded, just warm
const AEGIS = chalk.hex("#5B8DEF");
const YOU = chalk.hex("#A8D8A8");
const DIM = chalk.dim;

export class TerminalUI {
  private rl: readline.Interface | null = null;
  private isStreaming = false;

  /**
   * A quiet entrance. No banner, no logo.
   * Just a warm line that says "we're here."
   */
  showWelcome(): void {
    console.log("");
    console.log(DIM("  aegis init\n"));
  }

  /**
   * Show an Aegis message — either complete or as the start of streaming.
   * Looks like a chat message from a person.
   */
  showAegisMessage(message: string): void {
    console.log(`  ${AEGIS("aegis")}  ${message}\n`);
  }

  /**
   * Begin streaming — just show the name tag and start writing.
   */
  startAegisResponse(): void {
    process.stdout.write(`  ${AEGIS("aegis")}  `);
    this.isStreaming = true;
  }

  /**
   * Stream a token. Just characters appearing, like someone typing.
   */
  streamToken(token: string): void {
    if (this.isStreaming) {
      process.stdout.write(token);
    }
  }

  /**
   * End streaming. Just a newline — no flourish.
   */
  endAegisResponse(): void {
    if (this.isStreaming) {
      console.log("\n");
      this.isStreaming = false;
    }
  }

  /**
   * Get input from the human. Simple prompt, their words.
   */
  async getUserInput(): Promise<string> {
    return new Promise((resolve) => {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      this.rl.question(`  ${YOU("you")}    `, (answer) => {
        this.rl?.close();
        this.rl = null;
        console.log("");
        resolve(answer);
      });
    });
  }

  /**
   * A quiet note — not from Aegis, just the system.
   * Used sparingly: "policy written to .agentpolicy/" and that's about it.
   */
  showNote(message: string): void {
    console.log(`  ${DIM(message)}\n`);
  }

  /**
   * Show the files that were created — minimal, factual.
   * Aegis will provide the warm context conversationally.
   */
  showFilesCreated(files: string[]): void {
    console.log("");
    for (const file of files) {
      console.log(`  ${DIM("→")} ${DIM(file)}`);
    }
    console.log("");
  }

  /**
   * ANSI visual element — only called when Aegis has conversationally
   * introduced it. This is the "whiteboard sketch" capability.
   *
   * Usage: Aegis says "let me lay this out visually" in conversation,
   * then the engine calls this to render the visual.
   */
  showVisual(content: string): void {
    const lines = content.split("\n").map((line) => `  ${DIM(line)}`);
    console.log("");
    console.log(lines.join("\n"));
    console.log("");
  }

  /**
   * Show an error — still conversational, not alarming.
   */
  showError(message: string): void {
    console.log(`\n  ${message}\n`);
  }

  /**
   * Clean up.
   */
  destroy(): void {
    this.rl?.close();
  }
}
