/**
 * Policy Explainer
 *
 * `aegis explain` reads the .agentpolicy/ directory and has Aegis
 * narrate it back in plain language. This is useful for:
 * - Verifying the policy matches intent
 * - Onboarding new human team members
 * - Understanding what agents will actually do
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { LLMProvider } from "../llm/provider.js";

const EXPLAIN_SYSTEM_PROMPT = `You are Aegis, and you're explaining a project's agent governance policy to the human who created it. Walk through the policy in plain language — warm, clear, and conversational. You're not reading JSON back to them. You're telling them, in your own words, what their agents will experience when they enter this workspace.

Cover:
1. Project identity and purpose
2. The principles that guide every decision
3. What agents can and can't do (autonomy levels, permissions)
4. The coding conventions and quality standards
5. The role structure (who does what)
6. How agents coordinate and handle edge cases

Be concise but thorough. Use your natural voice — this should feel like a colleague summarizing a document they know well, not a machine reading fields.

End with anything you'd recommend revisiting or adjusting.`;

export async function explainPolicy(
  projectRoot: string,
  provider: LLMProvider,
  onToken: (token: string) => void
): Promise<string> {
  const policyDir = path.join(projectRoot, ".agentpolicy");

  if (!fs.existsSync(policyDir)) {
    throw new Error(
      "No .agentpolicy/ directory found. Run `aegis init` first."
    );
  }

  // Read all policy files
  const files: Record<string, unknown> = {};

  const constitutionPath = path.join(policyDir, "constitution.json");
  if (fs.existsSync(constitutionPath)) {
    files["constitution"] = JSON.parse(
      fs.readFileSync(constitutionPath, "utf-8")
    );
  }

  const governancePath = path.join(policyDir, "governance.json");
  if (fs.existsSync(governancePath)) {
    files["governance"] = JSON.parse(
      fs.readFileSync(governancePath, "utf-8")
    );
  }

  const rolesDir = path.join(policyDir, "roles");
  if (fs.existsSync(rolesDir)) {
    files["roles"] = {};
    for (const f of fs.readdirSync(rolesDir).filter((f) => f.endsWith(".json"))) {
      (files["roles"] as Record<string, unknown>)[f.replace(".json", "")] =
        JSON.parse(fs.readFileSync(path.join(rolesDir, f), "utf-8"));
    }
  }

  const ledgerPath = path.join(policyDir, "state", "ledger.json");
  if (fs.existsSync(ledgerPath)) {
    files["ledger"] = JSON.parse(fs.readFileSync(ledgerPath, "utf-8"));
  }

  return provider.chatStream(
    [
      {
        role: "user",
        content: `Here is the complete .agentpolicy/ for this project:\n\n${JSON.stringify(files, null, 2)}\n\nExplain this policy to me.`,
      },
    ],
    EXPLAIN_SYSTEM_PROMPT,
    onToken
  );
}
