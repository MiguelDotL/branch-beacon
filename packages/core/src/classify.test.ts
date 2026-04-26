import { describe, expect, it } from "vitest";
import {
  classify,
  defaultClassify,
  strictClassify,
  fuzzyClassify,
  type Classifier,
} from "./classify.js";
import type { BranchKind } from "./types.js";

describe("defaultClassify", () => {
  const cases: Array<[string, BranchKind]> = [
    // Protected: high-risk
    ["main", "main"],
    ["master", "main"],
    ["release/2026-04", "main"],
    ["release/v1.0.0", "main"],

    // Staging
    ["dev", "dev"],
    ["develop", "dev"],

    // Feature work
    ["feat/foo", "feat"],
    ["feat/long-name-with-dashes", "feat"],
    ["feat/123-issue-id", "feat"],

    // Bug work (both fix/ and hotfix/)
    ["fix/typo", "fix"],
    ["hotfix/critical", "fix"],

    // Falls through
    ["", "other"],
    ["chore/deps", "other"],
    ["random-name", "other"],
    ["feat", "other"], // no slash → not feat
    ["fix", "other"], // no slash → not fix
    ["FEAT/upper", "other"], // case-sensitive
  ];

  it.each(cases)("classifies %j as %s", (branch, expected) => {
    expect(defaultClassify(branch)).toBe(expected);
  });
});

describe("strictClassify", () => {
  it("only matches the canonical names", () => {
    expect(strictClassify("main")).toBe("main");
    expect(strictClassify("dev")).toBe("dev");
    expect(strictClassify("feat/x")).toBe("feat");
    expect(strictClassify("fix/x")).toBe("fix");
  });

  it("falls through for synonyms that defaultClassify accepts", () => {
    expect(strictClassify("master")).toBe("other");
    expect(strictClassify("develop")).toBe("other");
    expect(strictClassify("release/x")).toBe("other");
    expect(strictClassify("hotfix/x")).toBe("other");
  });
});

describe("fuzzyClassify", () => {
  it("is tolerant of substrings and casing", () => {
    expect(fuzzyClassify("PROD")).toBe("main");
    expect(fuzzyClassify("staging-2")).toBe("dev");
    expect(fuzzyClassify("FEATURE/X")).toBe("feat");
    expect(fuzzyClassify("hotfix-emergency")).toBe("fix");
  });
});

describe("classify (guard wrapper)", () => {
  it("returns whatever the classifier returns when it doesn't throw", () => {
    expect(classify(defaultClassify, "main")).toBe("main");
  });

  it('falls back to "other" when the classifier throws', () => {
    const broken: Classifier = () => {
      throw new Error("boom");
    };
    expect(classify(broken, "anything")).toBe("other");
  });
});
