/**
 * One-time audit: test that normalizeCdrName matching works for all CDRs
 * against likely LLM name variations.
 *
 * Usage: cd scripts/cdr-configs && npx tsx audit-name-matching.ts
 */

import { batch1CardioCdrs } from './batch-1-cardio'
import { batch2TraumaCdrs } from './batch-2-trauma'
import { batch3PulmGiCdrs } from './batch-3-pulm-gi'
import { batch4NeuroCdrs } from './batch-4-neuro'
import { batch5IdToxCdrs } from './batch-5-id-tox'
import { batch6CritPedsCdrs } from './batch-6-crit-peds'
import { batch7MiscCdrs } from './batch-7-misc'
import { batch8CardioIiCdrs } from './batch-8-cardio-ii'
import { batch9CardioIiiCdrs } from './batch-9-cardio-iii'
import { batch10PulmNeuroCdrs } from './batch-10-pulm-neuro'
import { batch11NeuroTraumaCdrs } from './batch-11-neuro-trauma'
import { batch12GiIdCdrs } from './batch-12-gi-id'
import { batch13IdToxCdrs } from './batch-13-id-tox'
import { batch14PedsHemeCdrs } from './batch-14-peds-heme'
import { batch15DispositionProcCdrs } from './batch-15-disposition-proc'
import { batch16EnviroObPsychCdrs } from './batch-16-enviro-ob-psych'
import { batch17PsychBurnsNephroCdrs } from './batch-17-psych-burns-nephro'
import { batch18NephroOncCdrs } from './batch-18-nephro-onc'
import { batch19OncDermEntCdrs } from './batch-19-onc-derm-ent'
import { batch20OrthoGeriPallCdrs } from './batch-20-ortho-geri-pall'
import { batch21RescueCardioCdrs } from './batch-21-rescue-cardio'
import { batch22RescueHepaticCdrs } from './batch-22-rescue-hepatic'
import { batch23RescuePedsCdrs } from './batch-23-rescue-peds'
import { batch24RescueHemeCdrs } from './batch-24-rescue-heme'
import { batch25RescuePulmCdrs } from './batch-25-rescue-pulm'
import { batch26RescueId1Cdrs } from './batch-26-rescue-id1'
import { batch27RescueId2Cdrs } from './batch-27-rescue-id2'
import { batch28RescueObCdrs } from './batch-28-rescue-ob'
import { batch29RescueGiCdrs } from './batch-29-rescue-gi'
import { batch30RescueEndoCdrs } from './batch-30-rescue-endo'
import type { CdrSeed } from './types'

const ALL_CDRS: CdrSeed[] = [
  ...batch1CardioCdrs,
  ...batch2TraumaCdrs,
  ...batch3PulmGiCdrs,
  ...batch4NeuroCdrs,
  ...batch5IdToxCdrs,
  ...batch6CritPedsCdrs,
  ...batch7MiscCdrs,
  ...batch8CardioIiCdrs,
  ...batch9CardioIiiCdrs,
  ...batch10PulmNeuroCdrs,
  ...batch11NeuroTraumaCdrs,
  ...batch12GiIdCdrs,
  ...batch13IdToxCdrs,
  ...batch14PedsHemeCdrs,
  ...batch15DispositionProcCdrs,
  ...batch16EnviroObPsychCdrs,
  ...batch17PsychBurnsNephroCdrs,
  ...batch18NephroOncCdrs,
  ...batch19OncDermEntCdrs,
  ...batch20OrthoGeriPallCdrs,
  ...batch21RescueCardioCdrs,
  ...batch22RescueHepaticCdrs,
  ...batch23RescuePedsCdrs,
  ...batch24RescueHemeCdrs,
  ...batch25RescuePulmCdrs,
  ...batch26RescueId1Cdrs,
  ...batch27RescueId2Cdrs,
  ...batch28RescueObCdrs,
  ...batch29RescueGiCdrs,
  ...batch30RescueEndoCdrs,
]

/** Same normalization function as CdrCard.tsx */
function normalizeCdrName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[—–\-,;:()]/g, ' ')
    .replace(/[''""]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Generate likely LLM name variations for a CDR */
function generateVariations(cdr: CdrSeed): string[] {
  const variations: string[] = []

  // Use name and fullName as-is
  variations.push(cdr.name)
  variations.push(cdr.fullName)

  // Replace em-dash with comma
  if (cdr.fullName.includes('—')) {
    variations.push(cdr.fullName.replace(/—/g, ','))
    variations.push(cdr.fullName.replace(/—/g, '-'))
    variations.push(cdr.fullName.replace(/—/g, ' - '))
  }

  // Replace en-dash
  if (cdr.fullName.includes('–')) {
    variations.push(cdr.fullName.replace(/–/g, '-'))
    variations.push(cdr.fullName.replace(/–/g, ','))
  }

  // Strip parenthetical suffix
  const shortName = cdr.fullName.replace(/\s*\(.*$/, '').trim()
  if (shortName !== cdr.fullName && shortName.length >= 3) {
    variations.push(shortName)
  }

  // Name only (no fullName context)
  if (cdr.name !== cdr.fullName) {
    variations.push(cdr.name)
  }

  return [...new Set(variations)]
}

/** Simulate findCdrDef matching logic */
function wouldMatch(variation: string, cdr: CdrSeed, allCdrs: CdrSeed[]): boolean {
  const lower = variation.toLowerCase()

  // Strategy 2: exact name match
  if (cdr.name.toLowerCase() === lower || cdr.fullName.toLowerCase() === lower) return true

  // Strategy 3: normalized match
  const normalized = normalizeCdrName(variation)
  if (normalizeCdrName(cdr.name) === normalized || normalizeCdrName(cdr.fullName) === normalized) return true

  // Strategy 4: short-name prefix (both name and fullName without parens)
  const shortName = variation.replace(/\s*\(.*$/, '').trim().toLowerCase()
  if (shortName.length >= 3) {
    if (cdr.name.toLowerCase() === shortName) return true
    const cdrShort = cdr.fullName.replace(/\s*\(.*$/, '').trim().toLowerCase()
    if (cdrShort === shortName) return true
  }

  return false
}

// ── Run audit ──────────────────────────────────────────────────────────────────

console.log(`\n🔍 Auditing ${ALL_CDRS.length} CDRs for name matching robustness...\n`)

const flagged: { id: string; name: string; fullName: string; failedVariations: string[]; specialChars: string[] }[] = []

for (const cdr of ALL_CDRS) {
  const variations = generateVariations(cdr)
  const failedVariations: string[] = []

  for (const v of variations) {
    if (!wouldMatch(v, cdr, ALL_CDRS)) {
      failedVariations.push(v)
    }
  }

  // Check for unusual characters that might cause matching issues
  const specialChars: string[] = []
  const unusualPattern = /[—–''""≤≥±×÷°µ²³]/g
  const nameMatches = cdr.name.match(unusualPattern)
  const fullNameMatches = cdr.fullName.match(unusualPattern)
  if (nameMatches) specialChars.push(`name: ${[...new Set(nameMatches)].join(' ')}`)
  if (fullNameMatches) specialChars.push(`fullName: ${[...new Set(fullNameMatches)].join(' ')}`)

  if (failedVariations.length > 0 || specialChars.length > 0) {
    flagged.push({
      id: cdr.id,
      name: cdr.name,
      fullName: cdr.fullName,
      failedVariations,
      specialChars,
    })
  }
}

// ── Report ─────────────────────────────────────────────────────────────────────

if (flagged.length === 0) {
  console.log('✅ All CDRs pass name matching audit — no concerns found.\n')
} else {
  const withFailures = flagged.filter((f) => f.failedVariations.length > 0)
  const withSpecialOnly = flagged.filter((f) => f.failedVariations.length === 0 && f.specialChars.length > 0)

  if (withFailures.length > 0) {
    console.log(`❌ ${withFailures.length} CDRs have variations that would NOT match:\n`)
    for (const f of withFailures) {
      console.log(`  ${f.id}: "${f.name}"`)
      console.log(`    fullName: "${f.fullName}"`)
      for (const v of f.failedVariations) {
        console.log(`    ✗ "${v}"`)
      }
      console.log()
    }
  }

  if (withSpecialOnly.length > 0) {
    console.log(`⚠️  ${withSpecialOnly.length} CDRs have special characters (but all variations match):\n`)
    for (const f of withSpecialOnly) {
      console.log(`  ${f.id}: "${f.name}" — ${f.specialChars.join(', ')}`)
    }
    console.log()
  }
}

console.log(`Total CDRs audited: ${ALL_CDRS.length}`)
console.log(`Flagged (matching failures): ${flagged.filter((f) => f.failedVariations.length > 0).length}`)
console.log(`Flagged (special chars only): ${flagged.filter((f) => f.failedVariations.length === 0 && f.specialChars.length > 0).length}`)
console.log(`Clean: ${ALL_CDRS.length - flagged.length}\n`)

process.exit(flagged.filter((f) => f.failedVariations.length > 0).length > 0 ? 1 : 0)
