import { shareOrDownloadFile } from "@maat-apps/core/backup";
import { toPng } from "html-to-image";

/**
 * "Generate PNG → share-or-download" kept as a small dedicated module (per
 * trainer#6) so this flow can be unit tested independently of the chart
 * rendering itself. No image is ever persisted anywhere — it's generated on
 * demand and handed straight to @maat-apps/core's share/download path.
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

export type ShareChartResult = "shared" | "cancelled" | "downloaded";

/**
 * Renders `element` to a PNG and offers it via the Web Share API; falls
 * back to a direct download when sharing files isn't supported (or fails).
 * A share the user dismisses (`AbortError`) is a normal outcome, not a
 * failure to fall back from.
 */
export async function shareOrDownloadChart(
  element: HTMLElement,
  fileName: string,
): Promise<ShareChartResult> {
  return shareOrDownloadFile(await elementToFile(element, fileName));
}
