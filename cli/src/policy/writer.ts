/**
 * Policy Writer
 *
 * Takes the compiled policy from the extraction step and writes
 * it to disk as the .agentpolicy/ directory structure.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface PolicyFiles {
  constitution: Record<string, unknown>;
  governance: Record<string, unknown>;
  roles: Record<string, Record<string, unknown>>;
  ledger: Record<string, unknown>;
}

/**
 * Write the complete .agentpolicy/ directory to disk.
 * Returns the list of files created.
 */
export function writePolicy(
  projectRoot: string,
  policy: PolicyFiles
): string[] {
  const policyDir = path.join(projectRoot, ".agentpolicy");
  const rolesDir = path.join(policyDir, "roles");
  const stateDir = path.join(policyDir, "state");

  // Create directories
  fs.mkdirSync(rolesDir, { recursive: true });
  fs.mkdirSync(stateDir, { recursive: true });

  const written: string[] = [];

  // Write constitution
  const constitutionPath = path.join(policyDir, "constitution.json");
  writeJSON(constitutionPath, policy.constitution);
  written.push(".agentpolicy/constitution.json");

  // Write governance
  const governancePath = path.join(policyDir, "governance.json");
  writeJSON(governancePath, policy.governance);
  written.push(".agentpolicy/governance.json");

  // Write roles
  for (const [roleName, roleData] of Object.entries(policy.roles)) {
    const rolePath = path.join(rolesDir, `${roleName}.json`);
    writeJSON(rolePath, roleData);
    written.push(`.agentpolicy/roles/${roleName}.json`);
  }

  // Write ledger
  const ledgerPath = path.join(stateDir, "ledger.json");
  writeJSON(ledgerPath, policy.ledger);
  written.push(".agentpolicy/state/ledger.json");

  return written;
}

function writeJSON(filePath: string, data: Record<string, unknown>): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
