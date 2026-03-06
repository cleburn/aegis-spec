import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as readline from "node:readline";

const AEGIS_DIR = path.join(os.homedir(), ".aegis");
const CONFIG_PATH = path.join(AEGIS_DIR, "config.json");

interface AegisConfig {
  anthropic_api_key?: string;
}

function readConfig(): AegisConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {
    // Corrupted config — start fresh
  }
  return {};
}

function writeConfig(config: AegisConfig): void {
  fs.mkdirSync(AEGIS_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {
    mode: 0o600, // Owner read/write only
  });
}

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      // Mask input for API keys
      process.stdout.write(question);
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }
      let input = "";
      const onData = (char: Buffer) => {
        const c = char.toString();
        if (c === "\n" || c === "\r") {
          stdin.removeListener("data", onData);
          if (stdin.isTTY && wasRaw !== undefined) {
            stdin.setRawMode(wasRaw);
          }
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (c === "\u0003") {
          // Ctrl+C
          process.exit(0);
        } else if (c === "\u007F" || c === "\b") {
          // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
          }
        } else {
          input += c;
          process.stdout.write("•");
        }
      };
      stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * Resolve an API key through the cascade:
 * 1. ANTHROPIC_API_KEY env var
 * 2. ~/.aegis/config.json
 * 3. Interactive prompt (with option to save)
 */
export async function resolveApiKey(): Promise<string> {
  // 1. Environment variable
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) {
    return envKey;
  }

  // 2. Config file
  const config = readConfig();
  if (config.anthropic_api_key) {
    return config.anthropic_api_key;
  }

  // 3. Interactive prompt
  console.log("");
  console.log("  Hi, please enter your Anthropic API key to get started.");
  console.log("  You can also set the ANTHROPIC_API_KEY environment variable.\n");

  const key = await prompt("  API key: ", true);

  if (!key || !key.startsWith("sk-")) {
    console.error("\n  That doesn't look like a valid Anthropic API key.");
    process.exit(1);
  }

  const saveChoice = await prompt(
    "  Save to ~/.aegis/config.json for next time? (y/n): "
  );

  if (saveChoice.toLowerCase() === "y" || saveChoice.toLowerCase() === "yes") {
    writeConfig({ ...config, anthropic_api_key: key });
    console.log("  Saved. (File is chmod 600 — only you can read it.)\n");
  } else {
    console.log("  Got it — using for this session only.\n");
  }

  return key;
}
