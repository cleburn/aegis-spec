/**
 * Discovery Engine
 *
 * The beating heart of `aegis init`. Just a conversation loop.
 *
 * No progress bars. No phase indicators. No "compiling..." messages.
 * When Aegis needs to think, there's a natural pause. When policy
 * gets extracted, it happens quietly. The human's experience is:
 * they talked to someone smart, and then files appeared.
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
    // Aegis opens. No preamble from the system — he just starts talking.
    const opening = await this.getAegisResponse();
    this.ui.showAegisMessage(opening);

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
        // Show the response without the marker
        const cleanResponse = response.replace("[DISCOVERY_COMPLETE]", "").trim();
        this.ui.showAegisMessage(cleanResponse);

        // Extract policy quietly — no "compiling..." message.
        // From the human's perspective, Aegis just said goodbye
        // and then files appeared.
        const policy = await this.extractPolicy();

        return {
          transcript: [...this.messages],
          policy,
        };
      }

      this.ui.showAegisMessage(response);
    }
  }

  /**
   * Get a streamed response from Aegis.
   */
  private async getAegisResponse(): Promise<string> {
    this.ui.startAegisResponse();

    const response = await this.provider.chatStream(
      this.messages,
      this.systemPrompt,
      (token) => {
        this.ui.streamToken(token);
      }
    );

    this.ui.endAegisResponse();

    this.messages.push({ role: "assistant", content: response });
    return response;
  }

  /**
   * After discovery, compile the conversation into structured policy.
   * This happens silently — no UI feedback.
   */
  private async extractPolicy(): Promise<DiscoveryResult["policy"]> {
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

    return policy;
  }
}
