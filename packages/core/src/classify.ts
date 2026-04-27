import type { BranchKind } from "./types.js";

/**
 * Classifier signature. Maps a branch name string to a `BranchKind`.
 * Pure function; no I/O. Consumers can override the default by passing
 * their own implementation to `BranchIndicator`'s `classify` prop.
 */
export type Classifier = (branch: string) => BranchKind;

// Branch-name patterns, locked to match the risk-inverted color scheme.
// Each pattern is anchored — no fuzzy matching. The order matters: more
// specific prefixes (release/, hotfix/) come before broader ones.
const PROTECTED = /^(main|master|release\/.+)$/;
const STAGING = /^(dev|develop|development|staging)$/;
const FEATURE = /^feat\//;
const BUGFIX = /^(fix|hotfix)\//;

/**
 * Default branch classifier.
 *
 * | Pattern                                    | Kind   | Risk     |
 * |--------------------------------------------|--------|----------|
 * | `main`, `master`, `release/...`            | `main` | highest  |
 * | `dev`, `develop`, `development`, `staging` | `dev`  | medium   |
 * | `feat/...`                                 | `feat` | safe     |
 * | `fix/...`, `hotfix/...`                    | `fix`  | bug-work |
 * | anything else (incl. `chore/`)             | `other`| neutral  |
 *
 * Risk-inverted because the indicator's UI colors protected branches in
 * alarming hues — accidentally committing to `main` should look scary.
 */
export const defaultClassify: Classifier = (branch) => {
  if (PROTECTED.test(branch)) return "main";
  if (STAGING.test(branch)) return "dev";
  if (FEATURE.test(branch)) return "feat";
  if (BUGFIX.test(branch)) return "fix";
  return "other";
};

/**
 * Strict variant: only literal `main` / `dev` / `feat/*` / `fix/*` count.
 * `master`, `release/*`, `hotfix/*`, `develop` all fall to `other`.
 * Useful for teams that have decided their convention is the only one.
 */
export const strictClassify: Classifier = (branch) => {
  if (branch === "main") return "main";
  if (branch === "dev") return "dev";
  if (/^feat\//.test(branch)) return "feat";
  if (/^fix\//.test(branch)) return "fix";
  return "other";
};

/**
 * Fuzzy variant: tolerant of common synonyms.
 * Matches anything containing `main` / `master` / `prod` for `main`,
 * `staging` / `qa` / `dev` for `dev`, `feature` or `feat` for `feat`,
 * `bug` / `fix` / `hotfix` / `patch` for `fix`.
 */
export const fuzzyClassify: Classifier = (branch) => {
  const b = branch.toLowerCase();
  if (/main|master|prod|production/.test(b)) return "main";
  if (/staging|qa|dev/.test(b)) return "dev";
  if (/feat|feature/.test(b)) return "feat";
  if (/bug|fix|hotfix|patch/.test(b)) return "fix";
  return "other";
};

/**
 * Wraps a classifier in a guard that catches throws and falls back to "other".
 * Public-facing entry point in case a user-supplied classifier blows up on
 * unexpected input — we never want a malformed classifier to crash the host.
 */
export const classify = (classifier: Classifier, branch: string): BranchKind => {
  try {
    return classifier(branch);
  } catch {
    return "other";
  }
};
