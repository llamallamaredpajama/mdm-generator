/**
 * ZIP Code Crosswalk Loader
 * Downloads HUD USPS ZIP Code Crosswalk data and batch-writes
 * to Firestore `zip_to_fips` collection.
 *
 * Usage: npx tsx scripts/load-zip-crosswalk.ts
 *
 * Prerequisites:
 * - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON env var
 * - Firebase Admin SDK initialized
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

// Initialize Firebase Admin
const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (serviceAccountJson) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  })
} else if (serviceAccountPath) {
  const content = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(content)),
  })
} else {
  admin.initializeApp()
}

const db = admin.firestore()

interface ZipRecord {
  zip: string
  fips: string
  state: string
  county: string
}

/**
 * Parse a CSV line into a ZipRecord.
 * Expected CSV format: ZIP,FIPS,STATE,COUNTY,...
 */
function parseLine(line: string, headerMap: Map<string, number>): ZipRecord | null {
  const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''))

  const zipIdx = headerMap.get('zip') ?? headerMap.get('ZIP')
  const fipsIdx = headerMap.get('fips') ?? headerMap.get('COUNTY') ?? headerMap.get('GEOID')
  const stateIdx = headerMap.get('usps_zip_pref_state') ?? headerMap.get('STATE') ?? headerMap.get('state')
  const countyIdx = headerMap.get('county') ?? headerMap.get('COUNTYNAME')

  if (zipIdx === undefined || stateIdx === undefined) return null

  const zip = cols[zipIdx]
  if (!zip || !/^\d{5}$/.test(zip)) return null

  return {
    zip,
    fips: fipsIdx !== undefined ? cols[fipsIdx] || '' : '',
    state: cols[stateIdx] || '',
    county: countyIdx !== undefined ? cols[countyIdx] || '' : '',
  }
}

async function loadCrosswalk(csvPath: string): Promise<void> {
  console.log(`Loading ZIP crosswalk from: ${csvPath}`)

  const fileStream = createReadStream(csvPath)
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity })

  let headerMap: Map<string, number> | null = null
  const records: ZipRecord[] = []
  let lineCount = 0

  for await (const line of rl) {
    lineCount++

    if (!headerMap) {
      // Parse header row
      const headers = line.split(',').map((h) => h.trim().replace(/"/g, ''))
      headerMap = new Map(headers.map((h, i) => [h, i]))
      console.log(`Headers: ${headers.join(', ')}`)
      continue
    }

    const record = parseLine(line, headerMap)
    if (record) {
      records.push(record)
    }
  }

  console.log(`Parsed ${records.length} records from ${lineCount} lines`)

  // Batch write to Firestore (500 per batch — Firestore limit)
  const BATCH_SIZE = 500
  let written = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = records.slice(i, i + BATCH_SIZE)

    for (const record of chunk) {
      const docRef = db.collection('zip_to_fips').doc(record.zip)
      batch.set(docRef, {
        fips: record.fips,
        state: record.state,
        county: record.county,
      })
    }

    await batch.commit()
    written += chunk.length
    console.log(`Progress: ${written}/${records.length} (${Math.round((written / records.length) * 100)}%)`)
  }

  console.log(`Done! Wrote ${written} ZIP records to Firestore.`)
}

// CLI entry point
const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: npx tsx scripts/load-zip-crosswalk.ts <path-to-csv>')
  console.error('Download crosswalk from: https://www.huduser.gov/portal/datasets/usps_crosswalk.html')
  process.exit(1)
}

loadCrosswalk(csvPath).catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
