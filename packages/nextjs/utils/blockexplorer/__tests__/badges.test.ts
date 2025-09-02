import { describe, it, expect } from "vitest";
import {
  getStatusBadge,
  getTypeBadge,
  getTransactionStatusStyling,
  getAddressTypeStyling,
  getClassVersionStyling,
} from "../badges";

describe("utils/blockexplorer/badges", () => {
  it("getStatusBadge returns expected classes", () => {
    expect(getStatusBadge("ACCEPTED_ON_L2")).toContain("green");
    expect(getStatusBadge("SUCCEEDED")).toContain("green");
    expect(getStatusBadge("PENDING")).toContain("yellow");
    expect(getStatusBadge("REJECTED")).toContain("red");
    expect(getStatusBadge("REVERTED")).toContain("red");
    expect(getStatusBadge("UNKNOWN")).toContain("gray");
  });

  it("getTypeBadge returns expected classes", () => {
    expect(getTypeBadge("INVOKE")).toContain("blue");
    expect(getTypeBadge("DEPLOY")).toContain("purple");
    expect(getTypeBadge("DEPLOY_ACCOUNT")).toContain("purple");
    expect(getTypeBadge("DECLARE")).toContain("orange");
    expect(getTypeBadge("X")).toContain("gray");
  });

  it("getTransactionStatusStyling maps status to semantic colors", () => {
    expect(getTransactionStatusStyling("SUCCEEDED")).toContain("success");
    expect(getTransactionStatusStyling("REVERTED")).toContain("error");
    expect(getTransactionStatusStyling("PENDING")).toContain("warning");
    expect(getTransactionStatusStyling("OTHER")).toContain("warning");
  });

  it("getAddressTypeStyling maps type to color", () => {
    expect(getAddressTypeStyling("ACCOUNT")).toContain("green");
    expect(getAddressTypeStyling("CONTRACT")).toContain("blue");
    expect(getAddressTypeStyling("OTHER")).toContain("gray");
  });

  it("getClassVersionStyling maps version to color", () => {
    expect(getClassVersionStyling("Cairo 2")).toContain("orange");
    expect(getClassVersionStyling("Cairo 1")).toContain("purple");
    expect(getClassVersionStyling("Unknown")).toContain("gray");
  });
});
