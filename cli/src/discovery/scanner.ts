import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "glob";

// ── Types ──────────────────────────────────────────────────────────────

export interface FileContent {
  /** Relative path from project root */
  path: string;
  /** File contents (may be truncated) */
  content: string;
  /** Whether the content was truncated to fit size limits */
  truncated: boolean;
}

export interface ScanResult {
  /** Absolute path to project root */
  root: string;
  /** Project name (from package.json, pyproject.toml, or directory name) */
  projectName: string;
  /** Project description if found (package.json description, README first paragraph, etc.) */
  projectDescription: string;
  /** Detected languages */
  languages: string[];
  /** Detected frameworks */
  frameworks: string[];
  /** Detected package managers */
  packageManagers: string[];
  /** Detected infrastructure/CI */
  infrastructure: string[];
  /** Top-level directories (likely modules) */
  topLevelDirs: string[];
  /** Directory tree structure, 2 levels deep */
  directoryTree: Record<string, string[]>;
  /** Key config files found */
  configFiles: string[];
  /** Whether .agentpolicy/ already exists */
  hasExistingPolicy: boolean;
  /** Existing .agentpolicy files if found */
  existingPolicyFiles: string[];
  /** Contents of existing .agentpolicy files */
  existingPolicyContents: FileContent[];
  /** Raw package.json data if found */
  packageJson?: Record<string, unknown>;
  /** Scripts from package.json (or equivalent) */
  scripts: Record<string, string>;
  /** Approximate file counts by extension */
  fileCounts: Record<string, number>;
  /** Contents of high-value files Aegis actually read */
  fileContents: FileContent[];
  /** Files detected but intentionally not read (sensitive/private) */
  skippedSensitiveFiles: string[];
}

// ── Constants ──────────────────────────────────────────────────────────

/** Maximum bytes to read from any single file */
const MAX_FILE_SIZE = 10 * 1024; // 10KB

const LANGUAGE_SIGNALS: Record<string, { files: string[]; name: string }> = {
  typescript: {
    files: ["tsconfig.json", "tsconfig.*.json"],
    name: "TypeScript",
  },
  javascript: { files: ["jsconfig.json"], name: "JavaScript" },
  python: {
    files: ["pyproject.toml", "setup.py", "requirements.txt", "Pipfile"],
    name: "Python",
  },
  rust: { files: ["Cargo.toml"], name: "Rust" },
  go: { files: ["go.mod"], name: "Go" },
  java: { files: ["pom.xml", "build.gradle", "build.gradle.kts"], name: "Java" },
  ruby: { files: ["Gemfile"], name: "Ruby" },
  php: { files: ["composer.json"], name: "PHP" },
  csharp: { files: ["*.csproj", "*.sln"], name: "C#" },
  swift: { files: ["Package.swift"], name: "Swift" },
};

const FRAMEWORK_SIGNALS: Record<string, { files?: string[]; deps?: string[] }> =
  {
    "next.js": { files: ["next.config.*"], deps: ["next"] },
    react: { deps: ["react"] },
    vue: { files: ["vue.config.*", "nuxt.config.*"], deps: ["vue"] },
    angular: { files: ["angular.json"], deps: ["@angular/core"] },
    svelte: { files: ["svelte.config.*"], deps: ["svelte"] },
    express: { deps: ["express"] },
    fastapi: { deps: ["fastapi"] },
    django: { deps: ["django"], files: ["manage.py"] },
    flask: { deps: ["flask"] },
    rails: { files: ["Gemfile"], deps: ["rails"] },
    prisma: { files: ["prisma/schema.prisma"], deps: ["prisma", "@prisma/client"] },
    drizzle: { deps: ["drizzle-orm"] },
    tailwind: { files: ["tailwind.config.*"], deps: ["tailwindcss"] },
  };

const PACKAGE_MANAGER_SIGNALS: Record<string, string[]> = {
  pnpm: ["pnpm-lock.yaml", "pnpm-workspace.yaml"],
  npm: ["package-lock.json"],
  yarn: ["yarn.lock"],
  bun: ["bun.lockb"],
  pip: ["requirements.txt", "requirements-*.txt"],
  poetry: ["poetry.lock"],
  pipenv: ["Pipfile.lock"],
  cargo: ["Cargo.lock"],
  "go modules": ["go.sum"],
};

const INFRA_SIGNALS: Record<string, string[]> = {
  docker: ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", ".dockerignore"],
  terraform: ["*.tf", "terraform/"],
  "github-actions": [".github/workflows/"],
  gitlab: [".gitlab-ci.yml"],
  aws: ["serverless.yml", "samconfig.toml", "cdk.json"],
  vercel: ["vercel.json"],
  netlify: ["netlify.toml"],
  kubernetes: ["k8s/", "kubernetes/", "*.k8s.yml"],
};

/**
 * Files Aegis will always try to read for substance.
 * Config files, documentation, CI — anything that reveals
 * how the project works, not just that it exists.
 */
const HIGH_VALUE_FILES: string[] = [
  // Documentation — read in full
  "README.md",
  "README",
  "readme.md",
  "AGENT.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "ARCHITECTURE.md",
  "docs/README.md",

  // Project config — read for substance
  "tsconfig.json",
  "jsconfig.json",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "composer.json",

  // Framework config
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "vite.config.ts",
  "vite.config.js",
  "tailwind.config.js",
  "tailwind.config.ts",
  "svelte.config.js",
  "angular.json",

  // Database / ORM
  "prisma/schema.prisma",
  "drizzle.config.ts",

  // CI / Infrastructure
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".github/workflows/ci.yml",
  ".github/workflows/ci.yaml",
  ".github/workflows/main.yml",
  ".github/workflows/main.yaml",
  ".github/workflows/deploy.yml",
  ".github/workflows/deploy.yaml",
  ".gitlab-ci.yml",
  "vercel.json",
  "netlify.toml",

  // Linting / formatting
  ".eslintrc.json",
  ".eslintrc.js",
  "eslint.config.js",
  "eslint.config.mjs",
  ".prettierrc",
  ".prettierrc.json",
  "prettier.config.js",
  ".editorconfig",

  // Environment shape (not values)
  ".env.example",
  ".env.template",
  ".env.sample",
];

/**
 * Patterns that indicate a file is sensitive and should NOT be read.
 * Aegis will note these files exist but respect their privacy.
 */
const SENSITIVE_FILE_PATTERNS: RegExp[] = [
  // Environment files with real values
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.production$/,
  /^\.env\.development$/,
  /^\.env\.[^.]+$/, // .env.anything (except .example, .template, .sample — handled below)

  // Credentials and keys
  /credentials\.json$/i,
  /serviceAccountKey\.json$/i,
  /\.pem$/,
  /\.key$/,
  /\.cert$/,
  /^id_rsa/,
  /^id_ed25519/,
  /\.p12$/,
  /\.pfx$/,
  /\.jks$/,

  // Token files
  /^\.npmrc$/,
  /^\.pypirc$/,
  /^auth\.json$/,
  /^\.netrc$/,
  /^\.docker\/config\.json$/,

  // Secret management
  /secrets?\.(ya?ml|json|toml)$/i,
  /vault\.(ya?ml|json)$/i,

  // Private directories
  /^secrets?\//i,
  /^private\//i,
  /^\.keys?\//i,

  // Database files (sensitive data + context bloat risk)
  /\.sqlite3?$/i,
  /\.db$/i,
  /\.sql$/i,
  /\.mdb$/i,
  /\.rdb$/i,
  /\.dump$/i,
  /\.bak$/i,

  // Database / data directories
  /^data\//i,
  /^db\//i,
  /^dumps?\//i,
  /^backups?\//i,
];

/** These .env variants are safe to read (they're templates, not real values) */
const SAFE_ENV_PATTERNS: RegExp[] = [
  /\.env\.example$/,
  /\.env\.template$/,
  /\.env\.sample$/,
];

// ── Helpers ────────────────────────────────────────────────────────────

function fileExists(root: string, pattern: string): boolean {
  if (pattern.endsWith("/")) {
    return fs.existsSync(path.join(root, pattern));
  }
  if (pattern.includes("*")) {
    try {
      const matches = glob.sync(pattern, { cwd: root, nodir: true });
      return matches.length > 0;
    } catch {
      return false;
    }
  }
  return fs.existsSync(path.join(root, pattern));
}

function readPackageJson(
  root: string
): Record<string, unknown> | undefined {
  const pkgPath = path.join(root, "package.json");
  try {
    if (fs.existsSync(pkgPath)) {
      return JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    }
  } catch {
    // Not valid JSON
  }
  return undefined;
}

function getDeps(pkg: Record<string, unknown> | undefined): string[] {
  if (!pkg) return [];
  const deps = {
    ...(pkg.dependencies as Record<string, string> ?? {}),
    ...(pkg.devDependencies as Record<string, string> ?? {}),
  };
  return Object.keys(deps);
}

/** Hard ceiling — don't even attempt files larger than this */
const MAX_FILE_SIZE_ABSOLUTE = 1024 * 1024; // 1MB

/**
 * Read a file's contents, respecting the size cap.
 * Returns null if the file doesn't exist, can't be read, or exceeds 1MB.
 */
function readFileSafe(filePath: string): FileContent | null {
  try {
    if (!fs.existsSync(filePath)) return null;

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;

    // Hard ceiling — skip entirely if over 1MB
    if (stat.size > MAX_FILE_SIZE_ABSOLUTE) return null;

    // Skip binary files (rough heuristic: check first 512 bytes for null bytes)
    const probe = Buffer.alloc(Math.min(512, stat.size));
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, probe, 0, probe.length, 0);
    fs.closeSync(fd);
    if (probe.includes(0)) return null; // likely binary

    const truncated = stat.size > MAX_FILE_SIZE;
    const content = fs.readFileSync(filePath, "utf-8");
    const finalContent = truncated
      ? content.slice(0, MAX_FILE_SIZE) + "\n\n[... truncated at 10KB ...]"
      : content;

    return {
      path: "", // caller sets this to the relative path
      content: finalContent,
      truncated,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a relative file path matches sensitive patterns.
 */
function isSensitiveFile(relativePath: string): boolean {
  // Safe .env variants are explicitly allowed
  const basename = path.basename(relativePath);
  if (SAFE_ENV_PATTERNS.some((p) => p.test(basename))) return false;

  // Check against sensitive patterns (test both full relative path and basename)
  return SENSITIVE_FILE_PATTERNS.some(
    (p) => p.test(relativePath) || p.test(basename)
  );
}

/**
 * Parse .gitignore and return a set of ignored file paths.
 * This is a simplified parser — handles the most common patterns.
 */
function parseGitignore(root: string): Set<string> {
  const ignored = new Set<string>();
  const gitignorePath = path.join(root, ".gitignore");

  try {
    if (!fs.existsSync(gitignorePath)) return ignored;
    const content = fs.readFileSync(gitignorePath, "utf-8");
    const patterns = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    // Use glob to expand each pattern and collect matched files
    for (const pattern of patterns) {
      try {
        const matches = glob.sync(pattern, {
          cwd: root,
          dot: true,
          nodir: false,
        });
        for (const match of matches) {
          ignored.add(match);
        }
      } catch {
        // Invalid pattern, skip
      }
    }
  } catch {
    // Can't read .gitignore
  }

  return ignored;
}

/**
 * Build a directory tree 2 levels deep from project root.
 * Skips common noise directories.
 */
function buildDirectoryTree(root: string): Record<string, string[]> {
  const tree: Record<string, string[]> = {};
  const skipDirs = new Set([
    "node_modules", "dist", "build", ".git", "__pycache__",
    ".next", ".nuxt", ".output", "coverage", ".cache",
    ".turbo", ".vercel", ".netlify", "vendor", "target",
  ]);

  try {
    const topEntries = fs.readdirSync(root, { withFileTypes: true });
    for (const entry of topEntries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;
      if (skipDirs.has(entry.name)) continue;

      const subPath = path.join(root, entry.name);
      const children: string[] = [];

      try {
        const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.name.startsWith(".")) continue;
          if (skipDirs.has(sub.name)) continue;
          children.push(sub.isDirectory() ? `${sub.name}/` : sub.name);
        }
      } catch {
        // Can't read subdirectory
      }

      tree[entry.name] = children;
    }
  } catch {
    // Can't read root
  }

  return tree;
}

/**
 * Scan for any markdown files at project root that might be documentation.
 * Returns relative paths for files not already in HIGH_VALUE_FILES.
 */
function findRootMarkdownFiles(root: string): string[] {
  const knownMd = new Set(
    HIGH_VALUE_FILES.filter((f) => f.endsWith(".md") && !f.includes("/"))
      .map((f) => f.toLowerCase())
  );

  try {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    return entries
      .filter(
        (e) =>
          e.isFile() &&
          e.name.toLowerCase().endsWith(".md") &&
          !knownMd.has(e.name.toLowerCase())
      )
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Discover CI workflow files beyond the ones hardcoded in HIGH_VALUE_FILES.
 */
function findCIWorkflows(root: string): string[] {
  const workflowDir = path.join(root, ".github", "workflows");
  try {
    if (!fs.existsSync(workflowDir)) return [];
    const entries = fs.readdirSync(workflowDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && (e.name.endsWith(".yml") || e.name.endsWith(".yaml")))
      .map((e) => `.github/workflows/${e.name}`);
  } catch {
    return [];
  }
}

// ── Main Scanner ───────────────────────────────────────────────────────

export async function scanRepo(root: string): Promise<ScanResult> {
  const projectRoot = path.resolve(root);
  const pkg = readPackageJson(projectRoot);
  const deps = getDeps(pkg);
  const gitignored = parseGitignore(projectRoot);

  // ── Detect languages ─────────────────────────────────────────────
  const languages: string[] = [];
  for (const [lang, signal] of Object.entries(LANGUAGE_SIGNALS)) {
    if (signal.files.some((f) => fileExists(projectRoot, f))) {
      languages.push(lang);
    }
  }
  if (deps.length > 0 && !languages.includes("javascript") && !languages.includes("typescript")) {
    languages.push("javascript");
  }

  // ── Detect frameworks ────────────────────────────────────────────
  const frameworks: string[] = [];
  for (const [fw, signal] of Object.entries(FRAMEWORK_SIGNALS)) {
    const hasFile = signal.files?.some((f) => fileExists(projectRoot, f));
    const hasDep = signal.deps?.some((d) => deps.includes(d));
    if (hasFile || hasDep) {
      frameworks.push(fw);
    }
  }

  // ── Detect package managers ──────────────────────────────────────
  const packageManagers: string[] = [];
  for (const [pm, files] of Object.entries(PACKAGE_MANAGER_SIGNALS)) {
    if (files.some((f) => fileExists(projectRoot, f))) {
      packageManagers.push(pm);
    }
  }

  // ── Detect infrastructure ────────────────────────────────────────
  const infrastructure: string[] = [];
  for (const [infra, files] of Object.entries(INFRA_SIGNALS)) {
    if (files.some((f) => fileExists(projectRoot, f))) {
      infrastructure.push(infra);
    }
  }

  // ── Top-level directories ────────────────────────────────────────
  const topLevelDirs: string[] = [];
  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== "build" &&
        entry.name !== "__pycache__" &&
        entry.name !== ".git"
      ) {
        topLevelDirs.push(entry.name);
      }
    }
  } catch {
    // Can't read directory
  }

  // ── Directory tree (2 levels deep) ───────────────────────────────
  const directoryTree = buildDirectoryTree(projectRoot);

  // ── Config files ─────────────────────────────────────────────────
  const configSignals = [
    "tsconfig.json", "next.config.*", "vite.config.*", "tailwind.config.*",
    ".eslintrc*", "eslint.config.*", ".prettierrc*", "prettier.config.*",
    ".env.example", "docker-compose.yml", "Dockerfile",
    "prisma/schema.prisma", ".editorconfig",
  ];
  const configFiles: string[] = [];
  for (const pattern of configSignals) {
    if (fileExists(projectRoot, pattern)) {
      configFiles.push(pattern);
    }
  }

  // ── Existing policy ──────────────────────────────────────────────
  const policyDir = path.join(projectRoot, ".agentpolicy");
  const hasExistingPolicy = fs.existsSync(policyDir);
  let existingPolicyFiles: string[] = [];
  const existingPolicyContents: FileContent[] = [];

  if (hasExistingPolicy) {
    try {
      existingPolicyFiles = glob.sync("**/*.json", { cwd: policyDir });
      // Read every policy file — Aegis needs to know what's already established
      for (const policyFile of existingPolicyFiles) {
        const fullPath = path.join(policyDir, policyFile);
        const content = readFileSafe(fullPath);
        if (content) {
          content.path = `.agentpolicy/${policyFile}`;
          existingPolicyContents.push(content);
        }
      }
    } catch {
      // Can't read
    }
  }

  // ── File counts by extension ─────────────────────────────────────
  const fileCounts: Record<string, number> = {};
  try {
    const allFiles = glob.sync("**/*", {
      cwd: projectRoot,
      nodir: true,
      ignore: ["node_modules/**", "dist/**", "build/**", ".git/**", "__pycache__/**"],
    });
    for (const file of allFiles) {
      const ext = path.extname(file).toLowerCase() || "(no ext)";
      fileCounts[ext] = (fileCounts[ext] || 0) + 1;
    }
  } catch {
    // Limited access
  }

  // ── Read high-value files ────────────────────────────────────────
  const fileContents: FileContent[] = [];
  const skippedSensitiveFiles: string[] = [];

  // Collect all files we want to attempt reading
  const filesToRead = new Set<string>(HIGH_VALUE_FILES);

  // Add any root-level markdown files we didn't hardcode
  for (const mdFile of findRootMarkdownFiles(projectRoot)) {
    filesToRead.add(mdFile);
  }

  // Add discovered CI workflows
  for (const workflow of findCIWorkflows(projectRoot)) {
    filesToRead.add(workflow);
  }

  for (const relativePath of filesToRead) {
    const fullPath = path.join(projectRoot, relativePath);

    // Check sensitivity first
    if (isSensitiveFile(relativePath)) {
      if (fs.existsSync(fullPath)) {
        skippedSensitiveFiles.push(relativePath);
      }
      continue;
    }

    // Check if gitignored (another signal of "don't share this")
    if (gitignored.has(relativePath) || gitignored.has(path.basename(relativePath))) {
      // Gitignored files that aren't in our safe list get flagged
      if (!SAFE_ENV_PATTERNS.some((p) => p.test(relativePath))) {
        if (fs.existsSync(fullPath)) {
          skippedSensitiveFiles.push(relativePath);
        }
        continue;
      }
    }

    const content = readFileSafe(fullPath);
    if (content) {
      content.path = relativePath;
      fileContents.push(content);
    } else if (fs.existsSync(fullPath)) {
      // File exists but readFileSafe returned null — likely too large or binary
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && stat.size > MAX_FILE_SIZE_ABSOLUTE) {
          skippedSensitiveFiles.push(`${relativePath} (${(stat.size / 1024 / 1024).toFixed(1)}MB — too large)`);
        }
      } catch {
        // Can't stat, move on
      }
    }
  }

  // ── Project metadata ─────────────────────────────────────────────
  const projectName = (pkg?.name as string) || path.basename(projectRoot);

  const projectDescription =
    (pkg?.description as string) || "";

  const scripts = (pkg?.scripts as Record<string, string>) || {};

  return {
    root: projectRoot,
    projectName,
    projectDescription,
    languages,
    frameworks,
    packageManagers,
    infrastructure,
    topLevelDirs,
    directoryTree,
    configFiles,
    hasExistingPolicy,
    existingPolicyFiles,
    existingPolicyContents,
    packageJson: pkg,
    scripts,
    fileCounts,
    fileContents,
    skippedSensitiveFiles,
  };
}

// ── Briefing Formatter ─────────────────────────────────────────────────

/**
 * Format scan results as a rich briefing for the LLM.
 * This is what Aegis reads before starting the conversation.
 * Not a raw dump — a distilled understanding of the project.
 */
export function formatScanBriefing(scan: ScanResult): string {
  const lines: string[] = [
    `PROJECT SCAN BRIEFING`,
    `====================`,
    `Project: ${scan.projectName}`,
    `Root: ${scan.root}`,
  ];

  if (scan.projectDescription) {
    lines.push(`Description: ${scan.projectDescription}`);
  }

  lines.push("");

  // ── Stack overview ───────────────────────────────────────────────
  if (scan.languages.length > 0) {
    lines.push(`Languages: ${scan.languages.join(", ")}`);
  } else {
    lines.push("Languages: (nothing detected — likely a new project)");
  }
  if (scan.frameworks.length > 0) {
    lines.push(`Frameworks: ${scan.frameworks.join(", ")}`);
  }
  if (scan.packageManagers.length > 0) {
    lines.push(`Package managers: ${scan.packageManagers.join(", ")}`);
  }
  if (scan.infrastructure.length > 0) {
    lines.push(`Infrastructure: ${scan.infrastructure.join(", ")}`);
  }

  // ── Scripts ──────────────────────────────────────────────────────
  if (Object.keys(scan.scripts).length > 0) {
    lines.push("");
    lines.push("Scripts:");
    for (const [name, cmd] of Object.entries(scan.scripts)) {
      lines.push(`  ${name}: ${cmd}`);
    }
  }

  // ── Project structure ────────────────────────────────────────────
  lines.push("");

  if (Object.keys(scan.directoryTree).length > 0) {
    lines.push("Project structure:");
    for (const [dir, children] of Object.entries(scan.directoryTree)) {
      if (children.length === 0) {
        lines.push(`  ${dir}/`);
      } else {
        lines.push(`  ${dir}/`);
        for (const child of children) {
          lines.push(`    ${child}`);
        }
      }
    }
  } else if (scan.topLevelDirs.length > 0) {
    lines.push(`Top-level directories: ${scan.topLevelDirs.join(", ")}`);
  }

  if (scan.configFiles.length > 0) {
    lines.push("");
    lines.push(`Config files: ${scan.configFiles.join(", ")}`);
  }

  const topExts = Object.entries(scan.fileCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  if (topExts.length > 0) {
    lines.push(`File distribution: ${topExts.map(([ext, n]) => `${ext}: ${n}`).join(", ")}`);
  }

  // ── File contents Aegis studied ──────────────────────────────────
  if (scan.fileContents.length > 0) {
    lines.push("");
    lines.push("== FILES YOU STUDIED ==");
    lines.push("");
    for (const file of scan.fileContents) {
      lines.push(`--- ${file.path} ${file.truncated ? "(truncated)" : ""} ---`);
      lines.push(file.content);
      lines.push("");
    }
  }

  // ── Existing policy ──────────────────────────────────────────────
  if (scan.hasExistingPolicy && scan.existingPolicyContents.length > 0) {
    lines.push("");
    lines.push("== EXISTING .agentpolicy/ CONTENTS ==");
    lines.push("");
    for (const file of scan.existingPolicyContents) {
      lines.push(`--- ${file.path} ---`);
      lines.push(file.content);
      lines.push("");
    }
  } else if (scan.hasExistingPolicy) {
    lines.push("");
    lines.push(`⚠ Existing .agentpolicy/ found with: ${scan.existingPolicyFiles.join(", ")}`);
  }

  // ── Sensitive files Aegis noticed but didn't read ────────────────
  if (scan.skippedSensitiveFiles.length > 0) {
    lines.push("");
    lines.push("== FILES YOU NOTICED BUT DID NOT READ (potentially sensitive) ==");
    lines.push(scan.skippedSensitiveFiles.join(", "));
  }

  return lines.join("\n");
}