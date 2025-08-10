#!/usr/bin/env -S node --loader tsx
/**
 * Admin script to set a user's plan in Firestore.
 * Usage: pnpm tsx backend/scripts/set-plan.ts <uid> <plan>
 * Plans: basic (250/mo), pro (1000/mo)
 */
import admin from 'firebase-admin'

const PLAN_LIMITS: Record<string, number> = { basic: 250, pro: 1000 }

async function main() {
  const [uid, plan] = process.argv.slice(2)
  if (!uid || !plan || !(plan in PLAN_LIMITS)) {
    console.error('Usage: pnpm tsx backend/scripts/set-plan.ts <uid> <basic|pro>')
    process.exit(1)
  }

  if (!admin.apps.length) admin.initializeApp()
  const db = admin.firestore()
  const ref = db.collection('users').doc(uid)

  const currentKey = new Date()
  const periodKey = `${currentKey.getUTCFullYear()}-${(currentKey.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}`

  await ref.set(
    {
      plan,
      monthlyQuota: PLAN_LIMITS[plan],
      usedThisPeriod: 0,
      periodKey,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  console.log(`Set plan for ${uid} -> ${plan}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

