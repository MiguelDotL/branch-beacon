/**
 * Classification of a git branch into one of five risk-tiered kinds.
 * Used by both color resolution and the default classifier.
 */
export type BranchKind = "main" | "dev" | "feat" | "fix" | "other";

/**
 * Visual marker shape rendered alongside (or in place of) the branch name.
 * - `dot` / `square` / `bar`: solid geometric markers, color = resolved branch color
 * - `led`: square with glow, evokes a HUD status light
 * - `icon`: Unicode ⎇ glyph (renders inconsistently across fonts)
 * - `svg`: inline SVG git-branch icon (default — always crisp)
 * - `pill`: rounded background pill, no marker; the label sits inside
 * - `none`: just the label
 */
export type BranchShape =
  | "dot"
  | "square"
  | "led"
  | "icon"
  | "svg"
  | "pill"
  | "bar"
  | "none";

/**
 * The shape of the data returned by the backend git-branch endpoint.
 * Servers MUST return `null` (not throw, not 5xx) when git is unavailable
 * or the working tree isn't a repo — the consumer renders nothing on null.
 */
export interface BranchResponse {
  branch: string | null;
}
