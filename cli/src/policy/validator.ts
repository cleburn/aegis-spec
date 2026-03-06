/**
 * Policy Validator
 *
 * Validates .agentpolicy/ files against the bundled JSON schemas.
 * Used by `aegis validate` and internally after policy generation.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Ajv = require("ajv").default;
const addFormats = require("ajv-formats");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.join(__dirname, "..", "schemas");

export interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
}

function loadSchema(name: string): object {
  const schemaPath = path.join(SCHEMA_DIR, `${name}.schema.json`);
  return JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
}

/**
 * Validate a single policy file against its schema.
 */
export function validateFile(
  filePath: string,
  schemaName: string
): ValidationResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ajv = new Ajv({ allErrors: true, strict: false }) as any;
  addFormats(ajv);

  const schema = loadSchema(schemaName);
  const validate = ajv.compile(schema);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const valid = validate(data);

    return {
      file: filePath,
      valid: valid === true,
      errors: valid
        ? []
        : ((validate.errors || []) as Array<{ instancePath?: string; message?: string }>).map(
            (e) => `${e.instancePath || "/"}: ${e.message}`
          ),
    };
  } catch (err) {
    return {
      file: filePath,
      valid: false,
      errors: [
        err instanceof Error ? err.message : "Failed to read or parse file",
      ],
    };
  }
}

/**
 * Validate the entire .agentpolicy/ directory.
 */
export function validatePolicy(projectRoot: string): ValidationResult[] {
  const policyDir = path.join(projectRoot, ".agentpolicy");
  const results: ValidationResult[] = [];

  // Constitution
  const constitutionPath = path.join(policyDir, "constitution.json");
  if (fs.existsSync(constitutionPath)) {
    results.push(validateFile(constitutionPath, "constitution"));
  } else {
    results.push({
      file: constitutionPath,
      valid: false,
      errors: ["File not found"],
    });
  }

  // Governance
  const governancePath = path.join(policyDir, "governance.json");
  if (fs.existsSync(governancePath)) {
    results.push(validateFile(governancePath, "governance"));
  } else {
    results.push({
      file: governancePath,
      valid: false,
      errors: ["File not found"],
    });
  }

  // Roles
  const rolesDir = path.join(policyDir, "roles");
  if (fs.existsSync(rolesDir)) {
    const roleFiles = fs
      .readdirSync(rolesDir)
      .filter((f) => f.endsWith(".json"));
    for (const roleFile of roleFiles) {
      results.push(validateFile(path.join(rolesDir, roleFile), "role"));
    }
  }

  // Ledger
  const ledgerPath = path.join(policyDir, "state", "ledger.json");
  if (fs.existsSync(ledgerPath)) {
    results.push(validateFile(ledgerPath, "ledger"));
  }

  return results;
}
