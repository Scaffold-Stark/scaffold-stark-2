import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  getTimeAgo,
  formatTimestamp,
  strkToFri,
  friToStrk,
  formatFee,
  truncateHash,
  truncateAddress,
} from "../formatters";

describe("utils/blockexplorer/formatters", () => {
  const realDateNow = Date.now;

  beforeAll(() => {
    vi.useFakeTimers();
    // Freeze time at 2024-01-01T00:00:00Z
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterAll(() => {
    vi.setSystemTime(realDateNow());
    vi.useRealTimers();
  });

  it("getTimeAgo formats seconds, minutes, hours, days", () => {
    const nowSec = Math.floor(Date.now() / 1000);
    expect(getTimeAgo(nowSec - 10)).toBe("10s");
    expect(getTimeAgo(nowSec - 5 * 60)).toBe("5m");
    expect(getTimeAgo(nowSec - 2 * 3600)).toBe("2h");
    expect(getTimeAgo(nowSec - 3 * 86400)).toBe("3d");
  });

  it("formatTimestamp returns Unknown if missing and formats when present", () => {
    expect(formatTimestamp(undefined)).toBe("Unknown");
    const ts = Math.floor(Date.parse("2024-01-01T00:00:00Z") / 1000);
    // localeString depends on environment; ensure it returns a non-empty string
    expect(typeof formatTimestamp(ts)).toBe("string");
    expect(formatTimestamp(ts).length).toBeGreaterThan(0);
  });

  it("strkToFri converts string STRK to bigint fri (1e18)", () => {
    expect(strkToFri("0")).toBe(0n);
    expect(strkToFri("1")).toBe(1000000000000000000n);
    expect(strkToFri("1.5")).toBe(1500000000000000000n);
  });

  it("friToStrk formats bigint fri to STRK string with trim zeros", () => {
    expect(friToStrk(0n)).toBe("0");
    expect(friToStrk(1000000000000000000n)).toBe("1");
    expect(friToStrk(1500000000000000000n)).toBe("1.5");
    expect(friToStrk(1234500000000000000n)).toBe("1.2345");
  });

  it("formatFee returns 0 when undefined, formats bigint-like strings otherwise", () => {
    expect(formatFee(undefined)).toBe("0");
    expect(formatFee("1000000000000000000")).toBe("1");
    expect(formatFee("1500000000000000000")).toBe("1.5");
    // If not bigint, returns raw
    expect(formatFee("not-a-number")).toBe("not-a-number");
  });

  it("truncateHash shortens long strings and leaves short as-is", () => {
    expect(truncateHash("0x1234", 2, 2)).toBe("0x...34");
    expect(truncateHash("0x1234567890", 4, 4)).toBe("0x12...7890");
  });

  it("truncateAddress delegates to truncateHash", () => {
    expect(truncateAddress("0xabcdef", 2, 2)).toBe("0x...ef");
    expect(truncateAddress("0xabcdef123456", 2, 2)).toBe("0x...56");
  });
});
