import fs from 'node:fs';
import path from 'node:path';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CdrRule {
  name: string;
  category: string;
  fullText: string;
  keywords: string[];
}

export interface CdrCategory {
  name: string;
  rules: CdrRule[];
  fullText: string;
}

// ── Stop words for keyword extraction ──────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'for', 'in', 'of', 'to', 'a', 'an', 'and', 'or', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'has', 'have', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'with', 'at', 'by', 'from', 'on', 'as', 'it', 'its', 'this', 'that',
  'these', 'those', 'not', 'no', 'but', 'if', 'then', 'than', 'so', 'all',
  'each', 'every', 'any', 'both', 'who', 'whom', 'which', 'what', 'when',
  'where', 'how', 'whether', 'after', 'before', 'during', 'about', 'into',
  'through', 'between', 'above', 'below', 'up', 'down', 'out', 'off',
  'over', 'under', 'again', 'further', 'other', 'some', 'such', 'only',
  'same', 'also', 'very', 'just', 'more', 'most', 'own', 'here', 'there',
]);

// ── Parsing helpers ────────────────────────────────────────────────────────

function extractKeywords(applicationLine: string, ruleName: string): string[] {
  const keywords = new Set<string>();

  // Extract words from Application line
  const appWords = applicationLine
    .replace(/[^a-zA-Z0-9\s/-]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  for (const w of appWords) keywords.add(w);

  // Extract words from rule name
  const nameWords = ruleName
    .replace(/[^a-zA-Z0-9\s/-]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  for (const w of nameWords) keywords.add(w);

  return Array.from(keywords);
}

function parseCategory(rawBlock: string, categoryName: string): CdrCategory {
  const rules: CdrRule[] = [];

  // Split by ## headers (level 2 only)
  const ruleSections = rawBlock.split(/^## /m);

  // First element is text before any ## (category intro), skip it
  for (let i = 1; i < ruleSections.length; i++) {
    const section = ruleSections[i];
    const newlineIdx = section.indexOf('\n');
    const name = newlineIdx >= 0 ? section.substring(0, newlineIdx).trim() : section.trim();
    const fullText = `## ${section}`.trim();

    // Extract Application line
    const appMatch = section.match(/\*\*Application:\*\*\s*(.+)/);
    const appLine = appMatch ? appMatch[1] : '';

    rules.push({
      name,
      category: categoryName,
      fullText,
      keywords: extractKeywords(appLine, name),
    });
  }

  return {
    name: categoryName,
    rules,
    fullText: rawBlock.trim(),
  };
}

// ── Module-level cache ─────────────────────────────────────────────────────

let cachedCategories: CdrCategory[] | null = null;

function loadFromDisk(): CdrCategory[] {
  const mdPath = path.join(__dirname, 'clinical-decision-rules.md');
  const raw = fs.readFileSync(mdPath, 'utf-8');

  const categories: CdrCategory[] = [];

  // Split by level-1 headers (# CATEGORY)
  // Regex: start of line, single #, space, then text (NOT ##)
  const parts = raw.split(/^# (?!#)/m);

  // Known category names to match against
  const CATEGORY_NAMES = new Set([
    'TRAUMA',
    'CARDIOVASCULAR',
    'PULMONARY',
    'NEUROLOGY',
    'GASTROINTESTINAL',
    'GENITOURINARY',
    'INFECTIOUS DISEASE',
    'TOXICOLOGY',
    'ENDOCRINE',
    'HEMATOLOGY / COAGULATION',
    'PEDIATRIC — Additional',
    'PROCEDURAL / AIRWAY',
    'ENVIRONMENTAL',
    'DISPOSITION / RISK STRATIFICATION',
  ]);

  for (const part of parts) {
    const newlineIdx = part.indexOf('\n');
    const headerLine = (newlineIdx >= 0 ? part.substring(0, newlineIdx) : part).trim();

    if (CATEGORY_NAMES.has(headerLine)) {
      categories.push(parseCategory(part, headerLine));
    }
  }

  return categories;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function loadCdrRules(): CdrCategory[] {
  if (!cachedCategories) {
    cachedCategories = loadFromDisk();
  }
  return cachedCategories;
}

export function getCdrIndex(): string {
  const categories = loadCdrRules();
  return categories
    .map(cat => `${cat.name}: ${cat.rules.map(r => r.name).join(', ')}`)
    .join('\n');
}
