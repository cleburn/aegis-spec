# Aegis — Governance Specification for AI Agents

<p align="center">
  <strong><code>.editorconfig</code> for AI agents — but with the depth of an actual governance framework.</strong>
</p>

<p align="center">
  A structured operating contract for every AI agent that touches your codebase: what it can touch, what's off-limits, what conventions to follow, how much autonomy it has, and who else is on the team. Schema-validated, machine-parseable, agent-agnostic.
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
└── state/
    └── ledger.json         # Living task state: in progress, done, failed, blocked
```

### Constitution

The first file any agent reads. What is this project? What's the tech stack? What are the non-negotiable principles? What are the build commands? If an agent reads nothing else, this prevents catastrophic mistakes.

### Governance

The employee handbook. Autonomy levels per domain (can the agent add dependencies freely, or must it ask?), file permissions (writable, read-only, forbidden), coding conventions as machine-queryable rules, quality gates that define "done," and escalation protocols for when policy doesn't cover a situation.

Autonomy domains are not limited to a fixed list — the schema accepts any domain string. A healthcare project might define `patient_data_access` and `pii_handling`. A fintech project might define `financial_transactions` and `regulatory_reporting`. The project's needs dictate the domains, not a predetermined list.

### Roles

Individual job descriptions. Each role defines a scope (what paths it owns), autonomy overrides, convention overrides, and collaboration protocols — who it depends on, who depends on it, how it signals completion, and how it coordinates access to shared resources. Single-agent workflows need only a `default.json`. Multi-agent workflows define specialist roles with clear boundaries.

### Ledger

The shared whiteboard — and the only file agents write to, not just read. Every task is recorded with timestamps, change logs, and failure records that prevent the next agent from retrying the same broken approach. A built-in write protocol with sequence checking and lock files ensures agents never corrupt each other's entries, even in parallel.

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

All policy files include a `$schema` reference and a `version` field. Tools can validate policy files against these schemas to ensure structural correctness.

## Example

The [`examples/`](./examples) directory contains a complete `.agentpolicy/` directory for a fictional project (Relay CRM) demonstrating all four file types with realistic content.

For a real-world stress test, see [ClearHealth](https://github.com/cleburn/clearhealth) — a HIPAA-compliant healthcare platform built entirely by a 5-agent AI swarm governed by Aegis. 65+ files deployed in 27 minutes, zero governance violations, PII scan passed on GitHub Actions.

## Agent-Agnostic

Aegis doesn't compete with Claude Code, Cursor, Codex, Gemini, or any other agent. It serves all of them. The `.agentpolicy/` format is an open spec — any tool can read it, and every tool benefits from a standardized way to understand its operating rules in a given repo.

## Adopting the Spec

To adopt Aegis governance in your project, tool, or framework:

1. Create an `.agentpolicy/` directory in the project root
2. Add JSON files conforming to the schemas above
3. Point your agents at the directory as their source of truth

You can generate the files by hand, with the [Aegis CLI](https://github.com/cleburn/aegis-cli), or with any tool that produces valid JSON against the schemas. The governance layer is the standard — the tooling is interchangeable.

## Reference Implementation

The [Aegis CLI](https://github.com/cleburn/aegis-cli) (`aegis-cli` on npm) is the reference implementation. It scans your codebase, conducts a discovery conversation, and generates a complete `.agentpolicy/` directory. It's one way to produce the files — not the only way.

## Philosophy

We're building dev tools for humans who happen to use AI, when we should be building dev tools for AI agents who happen to work with humans.

The role of "software developer" is becoming "systems architect" — someone who designs and orchestrates a collaborative effort between themselves and a team of AI agents. Those agents need structure to operate well. Clear scopes, explicit rules, shared state, coordination protocols. They need governance.

Aegis is the bridge between your vision and the agents who bring it to life.

## Design Principles

**Machine-readable over human-readable.** The policy files are JSON with enforced schemas, not markdown with suggestions. Agents parse structure, not vibes.

**Deterministic over aspirational.** Autonomy levels, permissions, and escalation rules are concrete and enforceable. "Be careful with infrastructure" becomes `{ "domain": "infrastructure_changes", "level": "advisory" }`.

**Scoped over global.** Different agents (or the same agent in different contexts) can have different permissions, conventions, and autonomy levels. A frontend agent doesn't need write access to database migrations.

**Auditable over invisible.** The ledger creates a traceable record of what agents did and why. Governance without audit is just hope.

## Contributing

Contributions to the spec are welcome. Please open an issue for discussion before submitting schema changes — the spec is versioned and changes affect every tool that implements it.

## License

Apache License 2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

Created by [Cleburn Walker](https://github.com/cleburn).
