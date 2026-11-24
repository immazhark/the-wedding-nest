/** Presentation only: never enables indexing, enquiry intake or a deployment. */
export function previewNoticeMode(flags: {
  publicRelease?: string | undefined;
  enquiriesEnabled?: string | undefined;
  turnstileSiteKey?: string | undefined;
}): "test" | "design" | null {
  // A public-release flag must never conceal the fictional-data warning.
  if (flags.enquiriesEnabled === "true" && flags.turnstileSiteKey === "1x00000000000000000000AA") {
    return "test";
  }
  return flags.publicRelease === "true" ? null : "design";
}

/** Build-time fail-closed guard. Actual domain/route state still requires release verification. */
export function assertIndexableRelease(
  flags: {
    indexable: boolean;
    publicRelease?: string | undefined;
    enquiriesEnabled?: string | undefined;
    turnstileSiteKey?: string | undefined;
  },
  deployment: { workers_dev?: unknown; preview_urls?: unknown },
): void {
  if (!flags.indexable) return;
  if (previewNoticeMode(flags) === "test") {
    throw new Error("A test environment must never publish an indexable build.");
  }
  if (flags.publicRelease !== "true") {
    throw new Error("Indexing requires separate public release approval (PUBLIC_SITE_RELEASED).");
  }
  if (deployment.workers_dev !== false || deployment.preview_urls !== false) {
    throw new Error(
      "Indexable assets must not be served on preview hosts: explicitly disable workers_dev and preview_urls before the approved production release.",
    );
  }
}
