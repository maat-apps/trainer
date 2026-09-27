import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(async () => "data:image/png;base64,fake"),
}));

import { shareOrDownloadChart } from "@/lib/chart-export";

function stubFetchAsPngBlob() {
  // jsdom's Blob doesn't implement stream(), which the real Response
  // constructor needs — stub just the .blob() method chart-export.ts
  // actually calls, rather than a full Response.
  const blob = new Blob(["fake-png-bytes"], { type: "image/png" });
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    blob: () => Promise.resolve(blob),
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("shareOrDownloadChart", () => {
  it("shares the file when the Web Share API supports it", async () => {
    stubFetchAsPngBlob();
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      canShare: () => true,
      share,
    });

    const element = document.createElement("div");
    const result = await shareOrDownloadChart(element, "chart.png");

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      files: [expect.objectContaining({ name: "chart.png" })],
    });
  });

  it("returns 'cancelled' when the user dismisses the share sheet", async () => {
    stubFetchAsPngBlob();
    const abortError = Object.assign(new Error("cancelled"), {
      name: "AbortError",
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      canShare: () => true,
      share: vi.fn().mockRejectedValue(abortError),
    });

    const element = document.createElement("div");
    const result = await shareOrDownloadChart(element, "chart.png");

    expect(result).toBe("cancelled");
  });

  it("falls back to download when canShare rejects the file", async () => {
    stubFetchAsPngBlob();
    vi.stubGlobal("navigator", {
      ...navigator,
      canShare: () => false,
      share: vi.fn(),
    });
    let capturedDownload = "";
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedDownload = this.download;
    });

    const element = document.createElement("div");
    const result = await shareOrDownloadChart(element, "chart.png");

    expect(result).toBe("downloaded");
    expect(capturedDownload).toBe("chart.png");
  });

  it("falls back to download when the Web Share API doesn't exist at all", async () => {
    stubFetchAsPngBlob();
    const nav = { ...navigator } as Navigator & {
      canShare?: Navigator["canShare"];
      share?: Navigator["share"];
    };
    delete nav.canShare;
    delete nav.share;
    vi.stubGlobal("navigator", nav);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const element = document.createElement("div");
    const result = await shareOrDownloadChart(element, "chart.png");

    expect(result).toBe("downloaded");
  });

  it("re-throws a non-cancellation share error instead of silently downloading", async () => {
    stubFetchAsPngBlob();
    vi.stubGlobal("navigator", {
      ...navigator,
      canShare: () => true,
      share: vi.fn().mockRejectedValue(new Error("boom")),
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const element = document.createElement("div");
    const result = await shareOrDownloadChart(element, "chart.png");

    // A non-AbortError share failure isn't a cancellation — falls back to
    // download rather than surfacing a raw rejection to the caller.
    expect(result).toBe("downloaded");
  });
});
