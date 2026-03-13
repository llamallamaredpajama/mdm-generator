/**
 * Seed Photo Library
 * Uploads encounter photos to Firebase Storage and writes metadata to the
 * `photoLibrary` Firestore collection.
 *
 * Usage:
 *   cd backend && NODE_PATH=./node_modules npx tsx ../scripts/seed-photo-library.ts
 *   cd backend && NODE_PATH=./node_modules npx tsx ../scripts/seed-photo-library.ts --photos-dir /path/to/encounter-photos
 *
 * Prerequisites:
 * - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON env var
 *
 * Idempotent: Uses deterministic doc IDs (category_subcategory), so re-running
 * overwrites identically.
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Firebase Admin init — same pattern as seed-cdr-library.ts
// ---------------------------------------------------------------------------

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
const bucket = admin.storage().bucket()

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface PhotoDocument {
  id: string                              // "cardiac_chest-pain"
  category: string                        // "cardiac"
  subcategory: string                     // "chest-pain"
  storagePath: string                     // "encounter-photos/cardiac/chest-pain.png"
  downloadUrl: string                     // Firebase Storage download URL
  description: string                     // "Cardiac - Chest Pain"
  createdAt: FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.Timestamp
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Title-case a hyphen-delimited slug.
 * "chest-pain" → "Chest Pain"
 * "fb-ear"     → "Fb Ear"
 */
function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Build a human-readable description from category + subcategory.
 * "cardiac" + "chest-pain" → "Cardiac - Chest Pain"
 */
function buildDescription(category: string, subcategory: string): string {
  return `${titleCase(category)} - ${titleCase(subcategory)}`
}

/**
 * Build a deterministic Firestore document ID.
 * "cardiac" + "chest-pain" → "cardiac_chest-pain"
 */
function buildDocId(category: string, subcategory: string): string {
  return `${category}_${subcategory}`
}

/**
 * Build the public-style Firebase Storage download URL.
 * No token is embedded — clients send their auth token as a header per
 * Storage security rules.
 */
function buildDownloadUrl(bucketName: string, storagePath: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`
}

/**
 * Parse --photos-dir argument from process.argv.
 * Returns the value after --photos-dir, or undefined if not supplied.
 */
function parsePhotosDir(): string | undefined {
  const args = process.argv.slice(2)
  const idx = args.indexOf('--photos-dir')
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1]
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  // Resolve photos directory
  const photosDir =
    parsePhotosDir() ??
    path.join(__dirname, '..', 'docs', 'wireframes', 'encounter-photos')

  console.log(`Photos directory: ${photosDir}`)

  if (!fs.existsSync(photosDir)) {
    console.error(`Error: photos directory not found: ${photosDir}`)
    console.error(
      'Pass the correct path with: --photos-dir /path/to/encounter-photos'
    )
    process.exit(1)
  }

  // Discover categories (subdirectories of the photos dir)
  const categories = fs
    .readdirSync(photosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  if (categories.length === 0) {
    console.error(`No category subdirectories found in: ${photosDir}`)
    process.exit(1)
  }

  console.log(`Found ${categories.length} categories: ${categories.join(', ')}`)

  // Build the list of photos to process
  interface PhotoEntry {
    category: string
    subcategory: string
    localPath: string
    storagePath: string
    docId: string
  }

  const photos: PhotoEntry[] = []

  for (const category of categories) {
    const categoryDir = path.join(photosDir, category)
    const files = fs
      .readdirSync(categoryDir)
      .filter((f) => f.toLowerCase().endsWith('.png'))
      .sort()

    for (const file of files) {
      const subcategory = path.basename(file, '.png')
      const localPath = path.join(categoryDir, file)
      const storagePath = `encounter-photos/${category}/${file}`
      const docId = buildDocId(category, subcategory)

      photos.push({ category, subcategory, localPath, storagePath, docId })
    }
  }

  console.log(`Found ${photos.length} photos to upload.`)

  // ---------------------------------------------------------------------------
  // Upload photos to Firebase Storage
  // ---------------------------------------------------------------------------

  const now = admin.firestore.Timestamp.now()
  const photoDocs: PhotoDocument[] = []

  for (const photo of photos) {
    const fileBuffer = fs.readFileSync(photo.localPath)
    const storageFile = bucket.file(photo.storagePath)

    await storageFile.save(fileBuffer, {
      contentType: 'image/png',
      metadata: {
        // Firebase Storage download tokens are not used here; access is
        // controlled by Storage security rules + client auth headers.
        cacheControl: 'public, max-age=31536000',
      },
    })

    const downloadUrl = buildDownloadUrl(bucket.name, photo.storagePath)

    console.log(`  Uploaded: ${photo.storagePath}`)

    photoDocs.push({
      id: photo.docId,
      category: photo.category,
      subcategory: photo.subcategory,
      storagePath: photo.storagePath,
      downloadUrl,
      description: buildDescription(photo.category, photo.subcategory),
      createdAt: now,
      updatedAt: now,
    })
  }

  console.log(`\nAll ${photoDocs.length} photos uploaded to Firebase Storage.`)

  // ---------------------------------------------------------------------------
  // Delete stale Firestore docs
  // ---------------------------------------------------------------------------

  const photoIds = new Set(photoDocs.map((p) => p.id))
  const existingDocs = await db.collection('photoLibrary').listDocuments()
  const staleIds = existingDocs
    .filter((d) => !photoIds.has(d.id))
    .map((d) => d.id)

  if (staleIds.length > 0) {
    const deleteBatch = db.batch()
    for (const id of staleIds) {
      deleteBatch.delete(db.collection('photoLibrary').doc(id))
    }
    await deleteBatch.commit()
    console.log(`Deleted ${staleIds.length} stale photo docs from Firestore.`)
  }

  // ---------------------------------------------------------------------------
  // Batch write all photo metadata to Firestore
  // Firestore batch limit is 500; 101 docs fits in one batch.
  // ---------------------------------------------------------------------------

  const batch = db.batch()

  for (const photoDoc of photoDocs) {
    const docRef = db.collection('photoLibrary').doc(photoDoc.id)
    batch.set(docRef, photoDoc)
  }

  await batch.commit()
  console.log(`Successfully seeded ${photoDocs.length} photo documents.`)

  // ---------------------------------------------------------------------------
  // Print summary
  // ---------------------------------------------------------------------------

  const byCategory: Record<string, number> = {}
  for (const photoDoc of photoDocs) {
    byCategory[photoDoc.category] = (byCategory[photoDoc.category] || 0) + 1
  }

  console.log('\nSummary by category:')
  for (const [cat, count] of Object.entries(byCategory).sort()) {
    console.log(`  ${cat}: ${count} photo${count !== 1 ? 's' : ''}`)
  }
  console.log(`\nTotal: ${photoDocs.length} photos seeded.`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
