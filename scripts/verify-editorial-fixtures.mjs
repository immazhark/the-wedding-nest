/**
 * ISOLATED EDITORIAL TEST FIXTURES — never published or committed.
 *
 * On CI only (or explicit local opt-in), creates clearly synthetic geometric
 * PNGs and fictional test records, builds into a separate disposable folder,
 * runs browser checks, and removes all generated files in a finally block.
 *
 * This intentionally exercises the real approval-gated Astro route + media
 * import pipeline without pretending that consent has been granted for any
 * actual client or that TWN delivers any particular service.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, open, rm, rmdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { deflateSync } from "node:zlib";

if (process.env.CI !== "true" && process.env.TWN_ALLOW_LOCAL_FIXTURES !== "1") {
  throw new Error("Fixture build requires CI=true or explicit TWN_ALLOW_LOCAL_FIXTURES=1");
}

const root = process.cwd();
const paths = [
  "src/content/services/guest-hospitality-hyderabad.json",
  "src/content/stories/ci-test-only-walima.json",
  "src/content/media/ci-test-only-walima.json",
  "src/assets/events/walima/ci-test-only-walima/01-geometry.png",
  "src/assets/events/walima/ci-test-only-walima/02-geometry.png",
];
const additionalServices = [
  "nikah-decoration-hyderabad",
  "mehndi-artist-hyderabad",
  "trousseau-packing-hyderabad",
];
paths.push(...additionalServices.map((slug) => `src/content/services/${slug}.json`));
const output = resolve(root, "dist-editorial-fixtures");
let ownsOutput = false;
const created = [];
const directories = new Set();

function pngChunk(type, bytes) {
  const label = Buffer.from(type, "ascii");
  const payload = Buffer.concat([label, bytes]);
  let crc = 0xffffffff;
  for (const byte of payload) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
  return Buffer.concat([length, payload, checksum]);
}

function geometricPng(alternate) {
  const width = 480;
  const height = 320;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 2; // RGB
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // no PNG filter
    for (let x = 0; x < width; x++) {
      const bright = (Math.floor(x / 48) + Math.floor(y / 40) + alternate) % 2 === 0;
      const rgb = bright ? [229, 212, 177] : [29, 55, 54];
      const at = rowStart + 1 + x * 3;
      raw[at] = rgb[0];
      raw[at + 1] = rgb[1];
      raw[at + 2] = rgb[2];
    }
  }
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", ihdr),
    pngChunk("tEXt", Buffer.from("Comment\0SYNTHETIC CI TEST FIXTURE - NEVER PUBLISH")),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const slug = "ci-test-only-walima";
const base = `../../assets/events/walima/${slug}/`;
const photoNames = ["01-geometry.png", "02-geometry.png"];
const photos = photoNames.map((name, index) => ({
  file: base + name,
  alt: `Synthetic geometric test fixture ${index + 1}; no real people or event`,
  category: "walima",
  orientation: "landscape",
  focal: "center",
  permission: true, // schema-only CI declaration, NOT a human approval
  releaseRef: `TWN-REL-2026-CITEST${index + 1}`,
  // No homepage slot: real approved photographs now occupy every homepage slot.
}));

const service = {
  slug: "guest-hospitality-hyderabad",
  title: "CI-only service page — never publish",
  description: "A synthetic testing page for rendering an editorial service layout in CI only.",
  introduction:
    "This generated service copy is fictional and exists solely to verify layout, linking and accessibility in an isolated automated build; it is not a business claim.",
  publicationApproved: true, // schema-only CI declaration, NOT a human approval
  approvalRef: "TWN-PUB-2026-CITEST",
  sections: [
    {
      title: "Fixture section one",
      body: "This placeholder paragraph contains no facts about real customers, availability or service delivery; it only tests the responsive editorial grid.",
    },
    {
      title: "Fixture section two",
      body: "This second placeholder paragraph is equally synthetic and exercises the page template when multiple content sections exist on the page.",
    },
  ],
};
const story = {
  slug,
  occasion: "walima",
  title: "CI-only synthetic Walima story — never publish",
  introduction:
    "This fictional automated-testing narrative contains no real event or family, and exists exclusively to exercise typography, picture delivery and page accessibility.",
  brief:
    "No actual family requested this event. This is a synthetically written paragraph to verify the layout, headings and content composition at various viewport widths.",
  contribution:
    "No actual event services were delivered. This synthetic description is for browser integration tests only and must never appear on the deployed public website.",
  images: photos.map((photo) => photo.file),
  publicationApproved: true, // schema-only CI declaration, NOT a human approval
  approvalRef: "TWN-STORY-2026-CITEST",
};

const sources = new Map([
  [paths[0], Buffer.from(JSON.stringify(service, null, 2))],
  [paths[1], Buffer.from(JSON.stringify(story, null, 2))],
  [paths[2], Buffer.from(JSON.stringify({ images: photos }, null, 2))],
  [paths[3], geometricPng(0)],
  [paths[4], geometricPng(1)],
]);

// Exercise each production composition without approving or publishing its draft copy.
// Include every target in the collision check and the same finally-based cleanup.
for (const slug of additionalServices) {
  sources.set(
    `src/content/services/${slug}.json`,
    Buffer.from(JSON.stringify({ ...service, slug }, null, 2)),
  );
}

function run(command, args, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`${command} failed with ${code}`)),
    );
  });
}

try {
  // Real service records already exercise the composition. Leave them byte-for-byte
  // intact and let the normal build validate their approval. Synthetic story/media
  // targets remain reserved and any collision is a hard error.
  for (const relative of paths) {
    if (!existsSync(resolve(root, relative))) continue;
    if (relative.startsWith("src/content/services/")) {
      sources.delete(relative);
      continue;
    }
    throw new Error("Refusing to replace existing source with CI fixture: " + relative);
  }
  if (existsSync(output)) {
    throw new Error("Refusing to overwrite pre-existing editorial fixture output");
  }
  ownsOutput = true;
  for (const [relative, bytes] of sources) {
    const absolute = resolve(root, relative);
    const parent = dirname(absolute);
    await mkdir(parent, { recursive: true });
    directories.add(parent);
    const handle = await open(absolute, "wx");
    created.push(absolute);
    try {
      await handle.writeFile(bytes);
    } finally {
      await handle.close();
    }
  }
  const testEnv = {
    ASTRO_OUT_DIR: "./dist-editorial-fixtures",
    PUBLIC_ALLOW_INDEXING: "false",
    PUBLIC_ENQUIRIES_ENABLED: "false",
  };
  process.stdout.write("\nSynthetic CI-only editorial fixture build; not for deployment.\n");
  await run("npm", ["run", "build"], testEnv);
  await run("npx", ["playwright", "test", "--config=playwright.editorial.config.ts"], testEnv);
} finally {
  for (const file of created.reverse()) {
    await rm(file, { force: true });
  }
  for (const dir of [...directories].sort((a, b) => b.length - a.length)) {
    try {
      await rmdir(dir);
    } catch (err) {
      if (err?.code !== "ENOTEMPTY" && err?.code !== "ENOENT") throw err;
    }
  }
  if (ownsOutput) await rm(output, { recursive: true, force: true });
  process.stdout.write("Synthetic fixture files and build output removed.\n");
}
