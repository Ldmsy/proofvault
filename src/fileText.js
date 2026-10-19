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

const ENDS_SENTENCE = /[.!?]["”')\]]?$/;
// Headings are short and contain no sentence punctuation (a wrapped line in a narrow column usually does).
const isHeading = (line) => line.length < 60 && !/[.!?,;:]/.test(line);

// Splits one blank-line-separated block into paragraphs. PDF text has no blank lines, only wrapped
// lines: there a paragraph ends on a line that finishes a sentence and is clearly shorter than a full
// line. Otherwise (one paragraph per line) lines are joined until a sentence ends.
function splitLines(block) {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return [lines.join(' ')];
  const max = Math.max(...lines.map((l) => l.length));
  const wrapped = max >= 60 && lines.filter((l) => l.length >= 0.85 * max).length >= lines.length * 0.6;
  const out = [];
  let cur = '';
  for (const line of lines) {
    if (isHeading(line) && !cur) {
      out.push(line);
      continue;
    }
    cur = cur ? `${cur} ${line}` : line;
    if (ENDS_SENTENCE.test(line) && (!wrapped || line.length < 0.85 * max)) {
      out.push(cur);
      cur = '';
    }
  }
  if (cur) out.push(cur);
  return out;
}

// Blank lines separate paragraphs; short lines (headings) are folded into the paragraph that follows.
export function toParagraphs(text) {
  const clean = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  const blocks = clean.split(/\n\s*\n/).flatMap(splitLines);
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
