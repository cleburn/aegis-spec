/**
 * Discovery Engine
 *
 * The beating heart of `aegis init`. Just a conversation loop.
 *
 * When Aegis needs to think, there's a playful animation — Zeus
 * throwing lightning, Einstein pacing. When policy gets extracted,
 * the same animations keep the human company. The experience is:
 * they talked to someone with real presence, and then files appeared.
 */

import type { LLMProvider, Message } from "../llm/provider.js";
import type { ScanResult } from "./scanner.js";
import {
  buildDiscoverySystemPrompt,
  buildExtractionSystemPrompt,
} from "./system-prompt.js";
import type { TerminalUI } from "../ui/terminal.js";

export interface DiscoveryResult {
  /** The full conversation transcript */
  transcript: Message[];
  /** The compiled policy JSON, ready to write to disk */
  policy: {
    constitution: Record<string, unknown>;
    governance: Record<string, unknown>;
    roles: Record<string, Record<string, unknown>>;
    ledger: Record<string, unknown>;
  };
}

export class DiscoveryEngine {
  private provider: LLMProvider;
  private scan: ScanResult;
  private memory: Record<string, unknown> | null;
  private ui: TerminalUI;
  private messages: Message[] = [];
  private systemPrompt: string;

  constructor(
    provider: LLMProvider,
    scan: ScanResult,
    memory: Record<string, unknown> | null,
    ui: TerminalUI
  ) {
    this.provider = provider;
    this.scan = scan;
    this.memory = memory;
    this.ui = ui;
    this.systemPrompt = buildDiscoverySystemPrompt(scan, memory);
  }

  /**
   * Run the full discovery conversation.
   * Returns the compiled policy when complete.
   */
  async run(): Promise<DiscoveryResult> {
    // Seed the conversation — the user ran "aegis init", that's the trigger
    this.messages.push({ role: "user", content: "aegis init" });
    const opening = await this.getAegisResponse();

    // Conversation loop
    while (true) {
      const userInput = await this.ui.getUserInput();

      // Handle exits gracefully
      if (
        userInput.toLowerCase() === "/quit" ||
        userInput.toLowerCase() === "/exit"
      ) {
        this.ui.showNote(
          "No worries — nothing saved yet, but you can pick this up anytime with aegis init."
        );
        process.exit(0);
      }

      if (userInput.trim() === "") {
        continue;
      }

      // Add user message
      this.messages.push({ role: "user", content: userInput });

      // Get Aegis's response (streamed to terminal)
      const response = await this.getAegisResponse();

      // Check for completion signal
      if (response.includes("[DISCOVERY_COMPLETE]")) {
        // Let the user know to hang tight while files are generated
        this.ui.showNote("Drafting your policy files...");

        // Extract policy — thinking animation keeps the human company
        // while Aegis compiles everything behind the scenes.
        const policy = await this.extractPolicy();

        return {
          transcript: [...this.messages],
          policy,
        };
      }

    }
  }

  /**
   * Get a streamed response from Aegis.
   *
   * Thinking animation starts on a 2-second timer. If the first token
   * arrives before 2 seconds (the common case), no animation appears.
   * If it takes longer, the animation fills the pause naturally.
   *
   * The stream is buffered to intercept [DISCOVERY_COMPLETE] so it
   * never appears in the terminal. The buffer holds tokens until we're
   * sure they don't contain the start of the marker, then flushes.
   */
  private async getAegisResponse(): Promise<string> {
    // Start thinking timer — animation appears only if >2s passes
    this.ui.startThinking();

    const MARKER = "[DISCOVERY_COMPLETE]";
    let firstToken = true;
    let buffer = "";

    const flushBuffer = () => {
      // Only flush content we're sure doesn't contain the marker start
      const safeLength = buffer.length - MARKER.length;
      if (safeLength > 0) {
        const safe = buffer.slice(0, safeLength);
        buffer = buffer.slice(safeLength);
        this.ui.streamToken(safe);
      }
    };

    const response = await this.provider.chatStream(
      this.messages,
      this.systemPrompt,
      (token) => {
        if (firstToken) {
          // First token arrived — stop thinking animation, start streaming
          this.ui.stopThinking();
          this.ui.startAegisResponse();
          firstToken = false;
        }

        buffer += token;

        // If the buffer contains the full marker, strip it and flush the rest
        if (buffer.includes(MARKER)) {
          buffer = buffer.replace(MARKER, "");
          this.ui.streamToken(buffer);
          buffer = "";
          return;
        }

        // Flush everything we're sure is safe
        flushBuffer();
      }
    );

    // Flush any remaining buffer (minus the marker if present)
    if (buffer.length > 0) {
      const cleaned = buffer.replace(MARKER, "");
      this.ui.streamToken(cleaned);
    }

    // If we never got a token (empty response edge case), clean up
    if (firstToken) {
      this.ui.stopThinking();
      this.ui.startAegisResponse();
    }

    this.ui.endAegisResponse();

    this.messages.push({ role: "assistant", content: response });
    return response;
  }

  /**
   * After discovery, compile the conversation into structured policy.
   * Thinking animation runs during extraction since this is always
   * a long operation — no 2-second threshold needed.
   */
  private async extractPolicy(): Promise<DiscoveryResult["policy"]> {
    // Extraction is always slow — start thinking animation immediately
    this.ui.startThinking();

    const extractionPrompt = buildExtractionSystemPrompt();

    const transcriptSummary = this.messages
      .map((m) => `${m.role === "user" ? "Human" : "Aegis"}: ${m.content}`)
      .join("\n\n");

    const extractionMessages: Message[] = [
      {
        role: "user",
        content: `Here is the complete discovery conversation transcript. Compile it into the .agentpolicy/ JSON files.\n\n${transcriptSummary}`,
      },
    ];

    const policy = await this.provider.chatJSON<DiscoveryResult["policy"]>(
      extractionMessages,
      extractionPrompt
    );

    this.ui.stopThinking();

    return policy;
  }
}