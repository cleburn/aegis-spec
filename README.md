# Aegis — Governance Specification for AI Agents

<p align="center">
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat" alt="License: Apache 2.0" />
  <img src="https://img.shields.io/badge/spec-v0.3.0-green?style=flat" alt="Spec Version: v0.3.0" />
</p>

<p align="center">
  A structured operating contract for every AI agent that touches your codebase: what it can touch, what's off-limits, what conventions to follow, how much autonomy it has, and who else is on the team. Schema-validated, machine-parseable, agent-agnostic.
</p>

<p align="center">
  <img src="assets/Open-page.png" alt="Aegis Lifecycle Overview" width="800" />
</p>

---

## The Problem

AI agents are writing production code. But every time one starts a session, it rebuilds its understanding of your project from scratch. The workarounds — markdown files, scattered configs, rules files — are written for humans, and agents just cope. Nothing is structured for how agents actually consume information. Nothing is queryable. Nothing is enforced.

When multiple agents work the same codebase? No shared state. No role boundaries. No coordination. They duplicate work, re-explore dead ends, and step on each other's changes without knowing anyone else was there.

The tools exist. The governance doesn't.

## The Spec

Aegis defines `.agentpolicy/` — a directory of schema-validated JSON that any agent, tool, or orchestration layer can parse deterministically. Not prose. Not suggestions. A contract.

```
.agentpolicy/
├── constitution.json       # Project identity, tech stack, principles, build commands
├── governance.json         # Autonomy levels, permissions, conventions, quality gates
├── roles/
│   ├── default.json        # Catch-all role for single-agent workflows
│   ├── frontend.json       # Scoped: owns UI, components, client-side state
│   ├── backend.json        # Scoped: owns API, business logic, database
│   └── testing.json        # Scoped: owns test suites, quality validation
├── state/
│   ├── ledger.json         # Living task state: in progress, done, failed, blocked
│   └── overrides.jsonl     # Append-only log of policy overrides and construction sessions
└── sessions/
    └── *.json              # Timestamped discovery session transcripts (append-only)
```

### Constitution

The first file any agent reads. What is this project? What's the tech stack? What are the non-negotiable principles? What are the build commands? If an agent reads nothing else, this prevents catastrophic mistakes.

### Governance

The employee handbook. Autonomy levels per domain (can the agent add dependencies freely, or must it ask?), file permissions (writable, read-only, forbidden), coding conventions as machine-queryable rules, quality gates that define "done," and escalation protocols for when policy doesn't cover a situation.

Autonomy domains are not limited to a fixed list — the schema accepts any domain string. A healthcare project might define `patient_data_access` and `pii_handling`. A fintech project might define `financial_transactions` and `regulatory_reporting`. The project's needs dictate the domains, not a predetermined list.

The governance also defines an override protocol — what happens when a human instructs an agent to violate a policy. Overrides are logged to an append-only file (`state/overrides.jsonl`) with timestamps, the policy violated, the human's rationale, and whether confirmation was given. Certain policies can be designated as immutable, meaning they cannot be overridden even with human confirmation — the governance must be formally revised through the discovery process.

### Roles

Individual job descriptions. Each role defines a scope (what paths it owns), autonomy overrides, convention overrides, and collaboration protocols — who it depends on, who depends on it, how it signals completion, and how it coordinates access to shared resources. Single-agent workflows need only a `default.json`. Multi-agent workflows define specialist roles with clear boundaries.

### Construction Role

A standard role recognized by all Aegis-compatible tooling for initial builds and major restructuring. The construction role is not defined as a file in `roles/` — it is a synthetic role that runtime tooling (such as the Aegis MCP server) provides automatically alongside the project-defined roles.

When an agent selects the construction role:
- It has full repository access (all paths writable, all paths readable)
- It uses the `.agentpolicy/` files as a blueprint — reading constitution, governance, and role files to understand the project's architecture, conventions, and quality standards
- It runs file operations through native tools rather than governed tools, for speed
- The runtime layer logs the construction session start and end to `state/overrides.jsonl` with timestamps and a summary of work completed
- When the build is complete, the agent calls the task completion tool to run quality gates and close construction mode

After construction, all future sessions select specialist roles with governed enforcement active.

### Ledger

The shared whiteboard — and the only file agents write to, not just read. Every task is recorded with timestamps, change logs, and failure records that prevent the next agent from retrying the same broken approach. A built-in write protocol with sequence checking and lock files ensures agents never corrupt each other's entries, even in parallel.

### Override Log

The `state/overrides.jsonl` file is an append-only audit trail of every policy override, construction session, and enforcement action. Each line is a self-contained JSON entry with a timestamp, the policy violated (or construction mode event), whether the human confirmed the action, the agent role, and the rationale. This file must never be modified or truncated — append only.

### Session Transcripts

The `sessions/` directory contains complete transcripts of every Aegis discovery session — the conversation between the human and Aegis, plus the closing guidance (files created, handoff prompt, deployment intent). Each session is a timestamped JSON file. Sessions are append-only: new sessions create new files, prior sessions are never modified.

On return visits, Aegis reads all prior session transcripts to understand the full history of governance decisions — why a particular autonomy level was chosen, what the human's compliance concerns were, how roles were structured and why. This replaces lossy memory systems with the actual conversation record.

Session transcripts also serve as audit evidence. In regulated environments, an assessor can trace any governance decision back to the conversation where it was discussed, who made the decision, and what rationale was given.

### Third-Party Validation

For projects operating under compliance frameworks (HIPAA, PCI-DSS, CMMC, SOX, FedRAMP, ITAR), the quality gate's `custom_checks` field should include at least one third-party infrastructure scanner that validates against an independent compliance baseline. Tools like Checkov, tfsec, Trivy, or Snyk IaC maintain rule sets built by security researchers — they catch misconfigurations that self-generated tests cannot, because the same model that wrote the infrastructure code also wrote the tests validating it. The `custom_checks` schema already supports this pattern with no changes needed. Aegis-compatible discovery tools should surface this recommendation when compliance frameworks are detected during conversation.

### Session Metadata

When an Aegis-compatible tool runs a discovery session and extracts policy files, it also produces two metadata fields that are not written to `.agentpolicy/` but are standard extraction outputs:

- **`deployment_intent`**: One of `"build_multi"`, `"build_single"`, or `"govern"`. Indicates whether the project needs to be built from scratch (by one or multiple agents) or whether governance is being added to an existing codebase. Tools use this to display appropriate next-step guidance.

- **`handoff_prompt`**: A custom prompt crafted from the conversation context, ready for the user to paste into their next agent session. The handoff prompt instructs the agent to connect to the runtime enforcement layer, select the appropriate role, and begin work with the right strategic context. For builds, it includes recommended sequencing. For return visits with changes, it describes the specific delta to apply.

These fields are included in the session transcript's closing guidance for auditability and so the user can reference them later.

## The Autonomy Framework

Every operational domain gets an autonomy level:

| Level | Behavior |
|-------|----------|
| **Conservative** | Agent never acts without explicit human approval. |
| **Advisory** | Agent surfaces recommendations and waits for approval. |
| **Delegated** | Agent acts on its own judgment and reports afterward. |

You set this per domain. Code modification might be `delegated` while infrastructure changes are `conservative`. A senior role might get more autonomy than a narrow specialist. The human always decides how much rope to give.

## Schemas

The JSON schemas define the `.agentpolicy/` format:

| Schema | Purpose |
|--------|---------|
| [`constitution.schema.json`](schemas/constitution.schema.json) | Project identity, stack, principles, build commands |
| [`governance.schema.json`](schemas/governance.schema.json) | Autonomy, permissions, conventions, quality gates, escalation |
| [`role.schema.json`](schemas/role.schema.json) | Scoped role definitions with collaboration protocols |
| [`ledger.schema.json`](schemas/ledger.schema.json) | Shared operational state and task tracking |
| [`overrides.schema.json`](schemas/overrides.schema.json) | Per-line shape of the append-only override log (`state/overrides.jsonl`) |
| [`session.schema.json`](schemas/session.schema.json) | Discovery session transcripts |

All policy files include a `$schema` reference and a `version` field. Tools can validate policy files against these schemas to ensure structural correctness.

## Example

The [`examples/`](./examples) directory contains a complete `.agentpolicy/` directory for a fictional project (Relay CRM) demonstrating all file types with realistic content, including role definitions, a populated ledger, and override log entries.

For real-world stress tests, see:
- [ClearHealth](https://github.com/cleburn/clearhealth) — A HIPAA-compliant healthcare platform built by a 5-agent AI swarm. 65+ files deployed in 27 minutes, zero governance violations.
- [ClearFinTech](https://github.com/cleburn/clearfintech) — A PCI-DSS/SOX-governed financial platform built by a single governed agent in 11 minutes. 100+ tests passing, CI green.
- [ClearDefense](https://github.com/cleburn/cleardefense) — A CMMC/ITAR-governed defense logistics platform. 412 tests, full compliance infrastructure, construction mode validated end-to-end.

## Agent-Agnostic

Aegis doesn't compete with Claude Code, Cursor, Codex, Gemini, or any other agent. It serves all of them. The `.agentpolicy/` format is an open spec — any tool can read it, and every tool benefits from a standardized way to understand its operating rules in a given repo.

## Adopting the Spec

To adopt Aegis governance in your project, tool, or framework:

1. Create an `.agentpolicy/` directory in the project root
2. Add JSON files conforming to the schemas above
3. Point your agents at the directory as their source of truth

You can generate the files by hand, with the [Aegis CLI](https://github.com/cleburn/aegis-cli), or with any tool that produces valid JSON against the schemas. The governance layer is the standard — the tooling is interchangeable.

## Runtime Enforcement

The [Aegis MCP](https://github.com/cleburn/aegis-mcp) (`aegis-mcp-server` on npm) provides runtime enforcement of Aegis governance. It connects to AI agents via the Model Context Protocol and validates every write, delete, and execute operation against the loaded policy — zero token overhead, full audit trail. The `.mcp.json` connection file is generated alongside `.agentpolicy/` for automatic connection.

The MCP server is one runtime layer — not the only one. Any tool can enforce Aegis governance by reading the `.agentpolicy/` files and validating agent actions against the schemas.

## Reference Implementation

The [Aegis CLI](https://github.com/cleburn/aegis-cli) (`aegis-cli` on npm) is the reference implementation for generating `.agentpolicy/` files. It scans your codebase, conducts a discovery conversation, and produces a complete governance directory with session transcripts. It's one way to produce the files — not the only way.

## Philosophy

We're building dev tools for humans who happen to use AI, when we should be building dev tools for AI agents who happen to work with humans.

The role of "software developer" is becoming "systems architect" — someone who designs and orchestrates a collaborative effort between themselves and a team of AI agents. Those agents need structure to operate well. Clear scopes, explicit rules, shared state, coordination protocols. They need governance.

Aegis is the bridge between your vision and the agents who bring it to life.

## Design Principles

**Machine-readable over human-readable.** The policy files are JSON with enforced schemas, not markdown with suggestions. Agents parse structure, not vibes.

**Deterministic over aspirational.** Autonomy levels, permissions, and escalation rules are concrete and enforceable. "Be careful with infrastructure" becomes `{ "domain": "infrastructure_changes", "level": "advisory" }`.

**Scoped over global.** Different agents (or the same agent in different contexts) can have different permissions, conventions, and autonomy levels. A frontend agent doesn't need write access to database migrations.

**Auditable over invisible.** The ledger, override log, and session transcripts create a traceable record of what agents did, what decisions were made, and why. Governance without audit is just hope.

**Independently verified over self-validated.** AI agents that generate compliance code and then generate tests to validate that code create a circular trust problem. The same model produces both layers, so the same blind spots exist in both. For projects operating under compliance frameworks (HIPAA, PCI-DSS, CMMC, SOX, FedRAMP, ITAR), Aegis recommends integrating a third-party infrastructure scanner (Checkov, tfsec, Trivy, Snyk IaC) into the CI pipeline as a quality gate. These tools validate against an independent compliance baseline maintained by security researchers, not by the same model that wrote the code. Self-generated tests prove internal consistency. Third-party scanners prove external compliance. Both are necessary; neither is sufficient alone.

## Contributing

Contributions to the spec are welcome. Please open an issue for discussion before submitting schema changes — the spec is versioned and changes affect every tool that implements it.

## License

Apache License 2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

Created by [Cleburn Walker](https://github.com/cleburn).
