import { toPng } from "html-to-image";

/**
 * "Generate PNG → share-or-download" kept as a small dedicated module (per
 * trainer#6) so this flow can be unit tested independently of the chart
 * rendering itself. No image is ever persisted anywhere — it's generated on
 * demand and handed straight to the share/download action.
 */

async function elementToFile(
  element: HTMLElement,
  fileName: string,
): Promise<File> {
  const dataUrl = await toPng(element);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: "image/png" });
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ShareChartResult = "shared" | "cancelled" | "downloaded";

/**
 * Renders `element` to a PNG and offers it via the Web Share API; falls
 * back to a direct download when sharing files isn't supported (or the
 * browser's `canShare` check rejects a PNG). A share the user dismisses
 * (`AbortError`) is a normal outcome, not a failure to fall back from.
 */
export async function shareOrDownloadChart(
  element: HTMLElement,
  fileName: string,
): Promise<ShareChartResult> {
  const file = await elementToFile(element, fileName);

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (error) {
      const cancelled =
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError";
      if (cancelled) return "cancelled";
    }
  }

  downloadFile(file);
  return "downloaded";
}
