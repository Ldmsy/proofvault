// Reads an uploaded record in the browser and splits it into paragraphs for analysis.
// PDF and Word parsers are loaded only when such a file is chosen.

export const ACCEPTED_TYPES = '.txt,.md,.markdown,.csv,.json,.html,.htm,.pdf,.docx';
export const MAX_PARAGRAPHS = 40;
export const MAX_CHARS = 20_000;

async function pdfText(file) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    pages.push(content.items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join(''));
  }
  return pages.join('\n\n');
}

async function docxText(file) {
  const { default: mammoth } = await import('mammoth/mammoth.browser.js');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}

export async function extractText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return pdfText(file);
  if (name.endsWith('.docx')) return docxText(file);
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    return new DOMParser().parseFromString(await file.text(), 'text/html').body.innerText;
  }
  if (name.endsWith('.doc')) throw new Error('Legacy .doc is not supported — save as .docx or PDF');
  return file.text();
}

// Blank lines separate paragraphs; short lines (headings) are folded into the paragraph that follows.
export function toParagraphs(text) {
  const clean = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  let blocks = clean.split(/\n\s*\n/);
  // No blank lines (typical of PDF text): join wrapped lines until one ends a sentence.
  if (blocks.length === 1) {
    blocks = [];
    let cur = '';
    for (const line of clean.split('\n')) {
      cur = cur ? `${cur} ${line.trim()}` : line.trim();
      if (/[.!?]["”')\]]?$/.test(cur)) {
        blocks.push(cur);
        cur = '';
      }
    }
    if (cur) blocks.push(cur);
  }
  const merged = [];
  let carry = '';
  for (const raw of blocks) {
    const b = raw.replace(/\s*\n\s*/g, ' ').trim();
    if (!b) continue;
    if (b.length < 60 && !/[.!?]$/.test(b)) {
      carry = carry ? `${carry} ${b}` : b;
      continue;
    }
    merged.push(carry ? `${carry} — ${b}` : b);
    carry = '';
  }
  if (carry) merged.push(carry);

  const paragraphs = [];
  let total = 0;
  for (const p of merged) {
    if (paragraphs.length >= MAX_PARAGRAPHS || total + p.length > MAX_CHARS) {
      // A single oversized first paragraph is cut rather than dropped.
      if (!paragraphs.length) paragraphs.push(p.slice(0, MAX_CHARS));
      return { paragraphs, truncated: true };
    }
    paragraphs.push(p);
    total += p.length;
  }
  return { paragraphs, truncated: false };
}
