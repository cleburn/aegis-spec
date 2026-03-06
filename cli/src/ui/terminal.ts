/**
 * Terminal UI
 *
 * This is NOT an app interface. It's a conversation with personality.
 *
 * Aegis is a person in another room. Messages arrive like texts from
 * a colleague. When Aegis needs a moment to think, he's visibly present —
 * a playful animation fills the pause the way a person might drum their
 * fingers or pace while working something out.
 *
 * Visual elements are NEVER chrome or decoration. They're part of Aegis's
 * character — the logo is him walking into the room, the animations are
 * him thinking out loud.
 *
 * The spirit check: Does this feel like working with someone who has
 * presence and personality? If anything feels like "interacting with
 * software," we've drifted.
 */

import * as readline from "node:readline";
import chalk from "chalk";
import {
  AEGIS_LOGO,
  THINKING_ANIMATIONS,
  THINKING_FRAME_HEIGHT,
} from "./art.js";

// Subtle color palette — not branded, just warm
const AEGIS = chalk.hex("#5B8DEF");
const YOU = chalk.hex("#A8D8A8");
const DIM = chalk.dim;
const ACCENT = chalk.hex("#5B8DEF");
const CHECK = chalk.hex("#A8D8A8");
const PROGRESS = chalk.hex("#FFD700");

export class TerminalUI {
  private rl: readline.Interface | null = null;
  private isStreaming = false;
  private thinkingTimer: ReturnType<typeof setTimeout> | null = null;
  private thinkingInterval: ReturnType<typeof setInterval> | null = null;
  private isAnimating = false;
  private currentFrameIndex = 0;
  private currentAnimation: string[] | null = null;

  // ── Intro Sequence ─────────────────────────────────────────────────

  /**
   * Show the Aegis logo. Clean, confident entrance.
   */
  async playIntro(): Promise<void> {
    // Clear terminal for a clean entrance
    process.stdout.write("\x1b[2J\x1b[H");

    // Show the logo with color
    const coloredLogo = colorizeLogo(AEGIS_LOGO);
    process.stdout.write(coloredLogo);
    await sleep(1500);

    // Clear to clean slate, ready for conversation
    clearScreen();
    console.log("");
  }

  /**
   * Quiet entrance for return visits. No logo, no fanfare.
   */
  showWelcome(): void {
    console.log("");
    console.log(DIM("  aegis init\n"));
  }

  // ── Conversation ───────────────────────────────────────────────────

  /**
   * Show an Aegis message — complete, not streamed.
   */
  showAegisMessage(message: string): void {
    console.log(`  ${AEGIS("aegis")}  ${message}\n`);
  }

  /**
   * Begin streaming — show the name tag and start writing.
   */
  startAegisResponse(): void {
    process.stdout.write(`  ${AEGIS("aegis")}  `);
    this.isStreaming = true;
  }

  /**
   * Stream a token. Characters appearing, like someone typing.
   */
  streamToken(token: string): void {
    if (this.isStreaming) {
      process.stdout.write(token);
    }
  }

  /**
   * End streaming. Clean newline.
   */
  endAegisResponse(): void {
    if (this.isStreaming) {
      console.log("\n");
      this.isStreaming = false;
    }
  }

  /**
   * Get input from the human.
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

  // ── Thinking Animations ────────────────────────────────────────────

  /**
   * Start the thinking sequence. Sets a 2-second timer.
   * If stopThinking() is called before the timer fires, nothing appears.
   * If the timer fires, a random animation starts looping.
   */
  startThinking(): void {
    this.thinkingTimer = setTimeout(() => {
      this.thinkingTimer = null;
      this.beginAnimation();
    }, 2000);
  }

  /**
   * Stop thinking. Cancels the timer or clears the animation.
   * Leaves the terminal clean for the next output.
   */
  stopThinking(): void {
    // Cancel timer if it hasn't fired
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
      return;
    }

    // Stop animation if running
    if (this.isAnimating) {
      this.clearAnimation();
    }
  }

  /**
   * Begin a random thinking animation loop.
   */
  private beginAnimation(): void {
    const animIndex = Math.floor(Math.random() * THINKING_ANIMATIONS.length);
    this.currentAnimation = THINKING_ANIMATIONS[animIndex];
    this.currentFrameIndex = 0;
    this.isAnimating = true;

    // Draw first frame
    this.drawFrame();

    // Loop through frames
    this.thinkingInterval = setInterval(() => {
      this.currentFrameIndex =
        (this.currentFrameIndex + 1) % this.currentAnimation!.length;
      this.redrawFrame();
    }, 600);
  }

  /**
   * Draw the current animation frame.
   */
  private drawFrame(): void {
    if (!this.currentAnimation) return;
    const frame = this.currentAnimation[this.currentFrameIndex];
    const colored = colorizeThinking(frame);
    process.stdout.write(colored);
  }

  /**
   * Redraw: move cursor up, clear lines, draw new frame.
   */
  private redrawFrame(): void {
    if (!this.currentAnimation) return;

    // Move cursor up by frame height and clear each line
    for (let i = 0; i < THINKING_FRAME_HEIGHT; i++) {
      process.stdout.write("\x1b[A"); // cursor up
      process.stdout.write("\x1b[2K"); // clear line
    }

    this.drawFrame();
  }

  /**
   * Clear the animation completely and reset state.
   */
  private clearAnimation(): void {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }

    // Clear the animation lines
    if (this.isAnimating) {
      for (let i = 0; i < THINKING_FRAME_HEIGHT; i++) {
        process.stdout.write("\x1b[A"); // cursor up
        process.stdout.write("\x1b[2K"); // clear line
      }
    }

    this.isAnimating = false;
    this.currentAnimation = null;
    this.currentFrameIndex = 0;
  }

  // ── System Messages ────────────────────────────────────────────────

  /**
   * A quiet note — not from Aegis, just the system.
   * Used sparingly.
   */
  showNote(message: string): void {
    console.log(`  ${DIM(message)}\n`);
  }

  /**
   * Show the files that were created — minimal, factual.
   */
  showFilesCreated(files: string[]): void {
    console.log("");
    for (const file of files) {
      console.log(`  ${DIM("\u2192")} ${DIM(file)}`);
    }
    console.log("");
  }

  /**
   * ANSI visual element — only called when Aegis has conversationally
   * introduced it. The "whiteboard sketch" capability.
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
    this.stopThinking();
    this.rl?.close();
  }
}

// ── Helper Functions ───────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

/**
 * Add color to the Aegis logo. Block letters get the aegis blue,
 * tagline stays dim.
 */
function colorizeLogo(text: string): string {
  const lines = text.split("\n");
  return lines
    .map((line) => {
      // Tagline line
      if (line.includes("governance for ai agents")) {
        return DIM(line);
      }
      // Block letter lines (contain box-drawing characters)
      if (
        line.includes("\u2588") ||
        line.includes("\u2554") ||
        line.includes("\u2557") ||
        line.includes("\u255A") ||
        line.includes("\u255D") ||
        line.includes("\u2550")
      ) {
        return AEGIS(line);
      }
      return line;
    })
    .join("\n");
}

/**
 * Add color to thinking animation frames.
 * Shield outline gets aegis blue, diamonds/checkmarks get distinct colors,
 * file tree and labels stay dim, "ready" gets accent color.
 */
function colorizeThinking(text: string): string {
  return text
    .replace(/\u25C7/g, DIM("\u25C7"))                    // empty diamond — dim
    .replace(/\u25C6/g, PROGRESS("\u25C6"))               // filled diamond — gold (in progress)
    .replace(/\u2713/g, CHECK("\u2713"))                   // checkmark — green
    .replace(/ready/g, CHECK("ready"))                     // "ready" label — green
    .replace(/thinking\.\.\./g, DIM("thinking..."))        // thinking label — dim
    .replace(/scanning repo\.\.\./g, DIM("scanning repo...")) // scanning label — dim
    .replace(/\.agentpolicy\//g, ACCENT(".agentpolicy/"))  // directory name — blue
    .replace(/\u25B3/g, ACCENT("\u25B3"))                  // triangle top — blue
    .replace(/V/g, ACCENT("V"));                           // V bottom — blue
}