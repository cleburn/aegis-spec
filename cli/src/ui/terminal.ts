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
  ZEUS_LOGO,
  SHIELD_ZOOM_FRAMES,
  THINKING_ANIMATIONS,
  THINKING_FRAME_HEIGHT,
} from "./art.js";

// Subtle color palette — not branded, just warm
const AEGIS = chalk.hex("#5B8DEF");
const YOU = chalk.hex("#A8D8A8");
const DIM = chalk.dim;
const BOLT = chalk.hex("#FFD700");

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
   * Play the full intro: Zeus logo → shield zoom-out → clean slate.
   * Only for first-time inits. Return visits skip this entirely.
   */
  async playIntro(): Promise<void> {
    // Clear terminal for a clean entrance
    process.stdout.write("\x1b[2J\x1b[H");

    // Show Zeus logo
    const coloredLogo = colorizeLogo(ZEUS_LOGO);
    process.stdout.write(coloredLogo);
    await sleep(2000);

    // Zoom out: shield shrinks across frames
    for (const frame of SHIELD_ZOOM_FRAMES) {
      clearScreen();
      const coloredFrame = colorizeLogo(frame);
      process.stdout.write(coloredFrame);
      await sleep(400);
    }

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
    }, 300);
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
      console.log(`  ${DIM("→")} ${DIM(file)}`);
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
 * Add color to the Zeus logo. Lightning bolts get gold,
 * the shield gets blue, text gets the aegis blue.
 */
function colorizeLogo(text: string): string {
  return text
    .replace(/⚡/g, BOLT("⚡"))
    .replace(/⛊/g, AEGIS("⛊"))
    .replace(/A  E  G  I  S/g, AEGIS("A  E  G  I  S"));
}

/**
 * Add color to thinking animation frames.
 */
function colorizeThinking(text: string): string {
  return text
    .replace(/⚡/g, BOLT("⚡"))
    .replace(/🤔/g, "🤔")
    .replace(/👀/g, "👀")
    .replace(/[~]/g, DIM("~"));
}