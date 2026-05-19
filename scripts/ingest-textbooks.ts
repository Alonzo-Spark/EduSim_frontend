import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import { TEXTBOOK_EMBEDDING_MODEL, createTextbookEmbedding } from "../src/lib/textbook-rag";

type ManifestEntry = {
  sourceKey: string;
  file: string;
  title?: string;
  sourceName?: string;
  classId?: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  publisher?: string;
  edition?: string;
  language?: string;
  metadata?: Record<string, unknown>;
};

type ExtractedPage = {
  pageNumber: number;
  text: string;
  ocrUsed: boolean;
};

type ChunkPayload = {
  document_id: string;
  class_id: string | null;
  subject_id: string | null;
  chapter_id: string | null;
  topic_id: string | null;
  source: string;
  page: number | null;
  page_start: number | null;
  page_end: number | null;
  section_heading: string | null;
  page_label: string | null;
  chunk_index: number;
  content: string;
  content_hash: string;
  token_count: number;
  ocr_used: boolean;
  embedding_model: string;
  embedding: number[];
  metadata: Record<string, unknown>;
};

const DEFAULT_MANIFEST = path.resolve(process.cwd(), "scripts", "textbook-corpus.json");
const DEFAULT_ROOT = process.cwd();
const CHUNK_CHAR_LIMIT = 2200;
const OCR_TEXT_THRESHOLD = 60;
const EMBEDDING_MODEL = TEXTBOOK_EMBEDDING_MODEL;

function parseArgs(argv: string[]) {
  const options = {
    manifest: DEFAULT_MANIFEST,
    root: DEFAULT_ROOT,
    dryRun: false,
    force: false,
    ocr: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--manifest" && next) {
      options.manifest = path.resolve(process.cwd(), next);
      i += 1;
    } else if (arg === "--root" && next) {
      options.root = path.resolve(process.cwd(), next);
      i += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--no-ocr") {
      options.ocr = false;
    }
  }

  return options;
}

function sha256(input: Buffer | string) {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/-\n(\w)/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countTokens(text: string) {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.1));
}

function extractSectionHeading(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);

  return (
    lines.find(
      (line) => line.length > 12 && line.length < 90 && /[A-Za-z]/.test(line) && /[A-Z]/.test(line),
    ) ?? null
  );
}

function hasBinary(command: string) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [command], { encoding: "utf8" });
  return result.status === 0;
}

function runCommand(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${output}`);
  }

  return result.stdout;
}

async function extractPagesFromPdf(pdfPath: string, allowOcr: boolean) {
  if (!hasBinary("pdftotext")) {
    throw new Error("pdftotext is required for textbook ingestion.");
  }

  const rawText = runCommand("pdftotext", ["-layout", "-enc", "UTF-8", pdfPath, "-"]);
  const pages = rawText.split("\f").map((text, index) => ({
    pageNumber: index + 1,
    text: normalizeWhitespace(text),
    ocrUsed: false,
  }));

  if (!allowOcr || !hasBinary("pdftoppm") || !hasBinary("tesseract")) {
    return pages;
  }

  const needsOcr = pages.some((page) => page.text.length < OCR_TEXT_THRESHOLD);
  if (!needsOcr) {
    return pages;
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "edusim-ocr-"));
  try {
    const renderedPages: ExtractedPage[] = [];
    for (const page of pages) {
      if (page.text.length >= OCR_TEXT_THRESHOLD) {
        renderedPages.push(page);
        continue;
      }

      const prefix = path.join(tempDir, `page-${page.pageNumber}`);
      runCommand("pdftoppm", ["-f", String(page.pageNumber), "-l", String(page.pageNumber), "-png", pdfPath, prefix]);
      const imagePath = `${prefix}-1.png`;
      const ocrText = runCommand("tesseract", [imagePath, "stdout", "--psm", "6"]);
      renderedPages.push({
        pageNumber: page.pageNumber,
        text: normalizeWhitespace(ocrText),
        ocrUsed: true,
      });
    }
    return renderedPages;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function splitIntoChunks(pages: ExtractedPage[]) {
  const chunks: Array<{ text: string; pageStart: number; pageEnd: number; ocrUsed: boolean }> = [];
  let currentText = "";
  let pageStart = pages[0]?.pageNumber ?? 1;
  let pageEnd = pageStart;
  let currentOcrUsed = false;

  const flush = () => {
    const text = currentText.trim();
    if (!text) {
      return;
    }

    chunks.push({ text, pageStart, pageEnd, ocrUsed: currentOcrUsed });
    currentText = "";
    currentOcrUsed = false;
    pageStart = pageEnd;
  };

  for (const page of pages) {
    if (!currentText) {
      pageStart = page.pageNumber;
    }

    const candidate = currentText ? `${currentText}\n\n${page.text}` : page.text;
    if (currentText && candidate.length > CHUNK_CHAR_LIMIT) {
      flush();
      currentText = page.text;
      pageStart = page.pageNumber;
      pageEnd = page.pageNumber;
      currentOcrUsed = page.ocrUsed;
      continue;
    }

    currentText = candidate;
    pageEnd = page.pageNumber;
    currentOcrUsed = currentOcrUsed || page.ocrUsed;
  }

  flush();
  return chunks;
}

async function loadManifest(manifestPath: string) {
  const raw = await readFile(manifestPath, "utf8").catch(() => {
    throw new Error(
      `Manifest not found at ${manifestPath}. Create scripts/textbook-corpus.json from the sample manifest before ingesting.`,
    );
  });

  const parsed = JSON.parse(raw) as { textbooks?: ManifestEntry[] } | ManifestEntry[];
  return Array.isArray(parsed) ? parsed : parsed.textbooks ?? [];
}

async function ingestEntry(
  root: string,
  entry: ManifestEntry,
  options: { dryRun: boolean; force: boolean; ocr: boolean },
) {
  const pdfPath = path.resolve(root, entry.file);
  const pdfBuffer = await readFile(pdfPath);
  const sourceHash = sha256(pdfBuffer);
  const sourceName = entry.sourceName ?? path.basename(pdfPath);
  const title = entry.title ?? path.parse(pdfPath).name;

  const { data: existingDocument, error: existingError } = await supabaseAdmin
    .from("textbook_documents")
    .select("id, source_hash")
    .eq("source_key", entry.sourceKey)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingDocument && existingDocument.source_hash === sourceHash && !options.force) {
    console.log(`[skip] ${entry.sourceKey} unchanged`);
    return;
  }

  const pages = await extractPagesFromPdf(pdfPath, options.ocr);
  const documentMetadata = {
    sourceKey: entry.sourceKey,
    file: entry.file,
    title,
    sourceHash,
    pageCount: pages.length,
    embeddingModel: EMBEDDING_MODEL,
    scanned: pages.every((page) => page.ocrUsed),
    ...entry.metadata,
  };

  if (options.dryRun) {
    console.log(`[dry-run] ${entry.sourceKey}: ${pages.length} pages`);
    return;
  }

  const documentPayload = {
    source_key: entry.sourceKey,
    source_path: entry.file,
    source_name: sourceName,
    source_hash: sourceHash,
    class_id: entry.classId ?? null,
    subject_id: entry.subjectId ?? null,
    chapter_id: entry.chapterId ?? null,
    topic_id: entry.topicId ?? null,
    title,
    publisher: entry.publisher ?? null,
    edition: entry.edition ?? null,
    language: entry.language ?? "en",
    content_type: "application/pdf",
    page_count: pages.length,
    extraction_method: pages.some((page) => page.ocrUsed) ? "pdftotext+ocr" : "pdftotext",
    is_scanned: pages.every((page) => page.ocrUsed),
    metadata: documentMetadata,
  };

  const documentRow = existingDocument
    ? await supabaseAdmin
        .from("textbook_documents")
        .update(documentPayload)
        .eq("id", existingDocument.id)
        .select("id")
        .single()
    : await supabaseAdmin
        .from("textbook_documents")
        .insert(documentPayload)
        .select("id")
        .single();

  if (documentRow.error || !documentRow.data) {
    throw new Error(documentRow.error?.message ?? "Failed to persist textbook document");
  }

  const documentId = documentRow.data.id;

  if (existingDocument) {
    const { error: deleteError } = await supabaseAdmin
      .from("textbook_chunks")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  const chunks = splitIntoChunks(pages).map<ChunkPayload>((chunk, index) => ({
    document_id: documentId,
    class_id: entry.classId ?? null,
    subject_id: entry.subjectId ?? null,
    chapter_id: entry.chapterId ?? null,
    topic_id: entry.topicId ?? null,
    source: sourceName,
    page: chunk.pageStart,
    page_start: chunk.pageStart,
    page_end: chunk.pageEnd,
    section_heading: extractSectionHeading(chunk.text),
    page_label:
      chunk.pageStart === chunk.pageEnd
        ? `p.${chunk.pageStart}`
        : `pp.${chunk.pageStart}-${chunk.pageEnd}`,
    chunk_index: index,
    content: chunk.text,
    content_hash: sha256(`${sourceHash}:${index}:${chunk.text}`),
    token_count: countTokens(chunk.text),
    ocr_used: chunk.ocrUsed,
    embedding_model: EMBEDDING_MODEL,
    embedding: [],
    metadata: {
      ...documentMetadata,
      chunkIndex: index,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      pageLabel:
        chunk.pageStart === chunk.pageEnd
          ? `p.${chunk.pageStart}`
          : `pp.${chunk.pageStart}-${chunk.pageEnd}`,
      contentLength: chunk.text.length,
    },
  }));

  for (const chunk of chunks) {
    chunk.embedding = await createTextbookEmbedding(chunk.content);
  }

  const { error: insertError } = await supabaseAdmin.from("textbook_chunks").insert(chunks);
  if (insertError) {
    throw new Error(insertError.message);
  }

  console.log(`[ingested] ${entry.sourceKey}: ${chunks.length} chunks`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest(options.manifest);

  if (manifest.length === 0) {
    console.log("No textbook entries found in manifest.");
    return;
  }

  for (const entry of manifest) {
    await ingestEntry(options.root, entry, options);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});