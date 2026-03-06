import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "glob";

export interface ScanResult {
  /** Absolute path to project root */
  root: string;
  /** Project name (from package.json, pyproject.toml, or directory name) */
  projectName: string;
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
  /** Key config files found */
  configFiles: string[];
  /** Whether .agentpolicy/ already exists */
  hasExistingPolicy: boolean;
  /** Existing .agentpolicy files if found */
  existingPolicyFiles: string[];
  /** Raw package.json data if found */
  packageJson?: Record<string, unknown>;
  /** Approximate file counts by extension */
  fileCounts: Record<string, number>;
}

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

export async function scanRepo(root: string): Promise<ScanResult> {
  const projectRoot = path.resolve(root);
  const pkg = readPackageJson(projectRoot);
  const deps = getDeps(pkg);

  // Detect languages
  const languages: string[] = [];
  for (const [lang, signal] of Object.entries(LANGUAGE_SIGNALS)) {
    if (signal.files.some((f) => fileExists(projectRoot, f))) {
      languages.push(lang);
    }
  }
  // Also check file extensions for languages that might not have config files
  if (deps.length > 0 && !languages.includes("javascript") && !languages.includes("typescript")) {
    languages.push("javascript");
  }

  // Detect frameworks
  const frameworks: string[] = [];
  for (const [fw, signal] of Object.entries(FRAMEWORK_SIGNALS)) {
    const hasFile = signal.files?.some((f) => fileExists(projectRoot, f));
    const hasDep = signal.deps?.some((d) => deps.includes(d));
    if (hasFile || hasDep) {
      frameworks.push(fw);
    }
  }

  // Detect package managers
  const packageManagers: string[] = [];
  for (const [pm, files] of Object.entries(PACKAGE_MANAGER_SIGNALS)) {
    if (files.some((f) => fileExists(projectRoot, f))) {
      packageManagers.push(pm);
    }
  }

  // Detect infrastructure
  const infrastructure: string[] = [];
  for (const [infra, files] of Object.entries(INFRA_SIGNALS)) {
    if (files.some((f) => fileExists(projectRoot, f))) {
      infrastructure.push(infra);
    }
  }

  // Top-level directories
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

  // Config files
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

  // Existing policy
  const policyDir = path.join(projectRoot, ".agentpolicy");
  const hasExistingPolicy = fs.existsSync(policyDir);
  let existingPolicyFiles: string[] = [];
  if (hasExistingPolicy) {
    try {
      existingPolicyFiles = glob.sync("**/*.json", { cwd: policyDir });
    } catch {
      // Can't read
    }
  }

  // File counts by extension
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

  // Project name
  const projectName =
    (pkg?.name as string) || path.basename(projectRoot);

  return {
    root: projectRoot,
    projectName,
    languages,
    frameworks,
    packageManagers,
    infrastructure,
    topLevelDirs,
    configFiles,
    hasExistingPolicy,
    existingPolicyFiles,
    packageJson: pkg,
    fileCounts,
  };
}

/**
 * Format scan results as a concise briefing for the LLM.
 * This is what Aegis reads before starting the conversation.
 */
export function formatScanBriefing(scan: ScanResult): string {
  const lines: string[] = [
    `PROJECT SCAN BRIEFING`,
    `====================`,
    `Project: ${scan.projectName}`,
    `Root: ${scan.root}`,
    ``,
  ];

  if (scan.languages.length > 0) {
    lines.push(`Languages detected: ${scan.languages.join(", ")}`);
  }
  if (scan.frameworks.length > 0) {
    lines.push(`Frameworks detected: ${scan.frameworks.join(", ")}`);
  }
  if (scan.packageManagers.length > 0) {
    lines.push(`Package managers: ${scan.packageManagers.join(", ")}`);
  }
  if (scan.infrastructure.length > 0) {
    lines.push(`Infrastructure: ${scan.infrastructure.join(", ")}`);
  }

  lines.push("");

  if (scan.topLevelDirs.length > 0) {
    lines.push(`Top-level directories: ${scan.topLevelDirs.join(", ")}`);
  }
  if (scan.configFiles.length > 0) {
    lines.push(`Config files found: ${scan.configFiles.join(", ")}`);
  }

  const topExts = Object.entries(scan.fileCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([ext, count]) => `${ext}(${count})`)
    .join(", ");
  if (topExts) {
    lines.push(`File distribution: ${topExts}`);
  }

  if (scan.hasExistingPolicy) {
    lines.push("");
    lines.push(`⚠ Existing .agentpolicy/ found with: ${scan.existingPolicyFiles.join(", ")}`);
  }

  return lines.join("\n");
}
