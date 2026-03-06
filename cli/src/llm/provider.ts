/**
 * LLM Provider Interface
 *
 * Thin abstraction so Aegis can talk to any LLM backend.
 * Anthropic is the first-class implementation, but the interface
 * is clean enough that OpenAI, Gemini, or local models slot in trivially.
 */

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface StreamEvent {
  type: "text_delta" | "message_start" | "message_stop";
  text?: string;
}

export interface LLMProvider {
  /**
   * Send a conversation and get a complete response.
   */
  chat(messages: Message[], systemPrompt: string): Promise<string>;

  /**
   * Send a conversation and stream the response token-by-token.
   * Calls onToken for each chunk, returns the full assembled response.
   */
  chatStream(
    messages: Message[],
    systemPrompt: string,
    onToken: (token: string) => void
  ): Promise<string>;

  /**
   * Send a conversation and get a structured JSON response.
   * Uses the provider's native JSON mode or structured output if available.
   */
  chatJSON<T = unknown>(
    messages: Message[],
    systemPrompt: string,
    schema?: object
  ): Promise<T>;

  /**
   * Provider name for display/logging.
   */
  readonly name: string;

  /**
   * Verify the API key works.
   */
  validate(): Promise<boolean>;
}
