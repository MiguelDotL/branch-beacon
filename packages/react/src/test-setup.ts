import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Auto-clean rendered React trees between tests. testing-library only
// auto-cleans when vitest globals are enabled — we have `globals: false`,
// so we wire it up explicitly here.
afterEach(() => {
  cleanup();
});
