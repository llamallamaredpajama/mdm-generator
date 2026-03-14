import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { userService } from '../../services/userService'
import {
  getDb,
  getUserDoc,
  getOrderSetsCollection,
  getDispoFlowsCollection,
  getReportTemplatesCollection,
  serializeFirestoreDoc,
} from '../../shared/db'

// ============================================================================
// Whoami
// ============================================================================

export async function whoami(req: Request, res: Response) {
  const uid = req.user!.uid
  const email = req.user!.email || ''

  const user = await userService.ensureUser(uid, email)
  const stats = await userService.getUsageStats(uid)

  return res.json({
    ok: true,
    uid,
    email,
    onboardingCompleted: user?.onboardingCompleted ?? true,
    displayName: user?.displayName ?? null,
    credentialType: user?.credentialType ?? null,
    ...stats
  })
}

// ============================================================================
// Onboarding
// ============================================================================

export async function completeOnboarding(req: Request, res: Response) {
  const uid = req.user!.uid

  // Guard against re-submission
  const user = await userService.getUser(uid)
  if (user?.onboardingCompleted === true) {
    return res.status(409).json({ error: 'Onboarding already completed' })
  }

  const { displayName, credentialType, surveillanceLocation } = req.body
  const updateData: Record<string, unknown> = {
    displayName,
    credentialType,
    onboardingCompleted: true,
    acknowledgedLimitations: true,
    acknowledgedLimitationsAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  }
  if (surveillanceLocation) {
    updateData.surveillanceLocation = surveillanceLocation
  }

  await getDb().collection('users').doc(uid).update(updateData)
  req.log!.info({ userId: uid, action: 'complete-onboarding' })

  return res.json({ ok: true })
}

// ============================================================================
// Order Sets CRUD
// ============================================================================

export async function listOrderSets(req: Request, res: Response) {
  const uid = req.user!.uid

  const snapshot = await getOrderSetsCollection(uid).get()
  const items = snapshot.docs.map(serializeFirestoreDoc)
  req.log!.info({ userId: uid, action: 'list-order-sets' })
  return res.json({ ok: true, items })
}

export async function createOrderSet(req: Request, res: Response) {
  const uid = req.user!.uid

  const docRef = await getOrderSetsCollection(uid).add({
    ...req.body,
    createdAt: admin.firestore.Timestamp.now(),
    usageCount: 0,
  })
  const doc = await docRef.get()
  req.log!.info({ userId: uid, action: 'create-order-set' })
  return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
}

export async function updateOrderSet(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getOrderSetsCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([, v]) => v !== undefined)
  )
  await docRef.update(updateData)
  const updated = await docRef.get()
  req.log!.info({ userId: uid, action: 'update-order-set' })
  return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
}

export async function deleteOrderSet(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getOrderSetsCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  await docRef.delete()
  req.log!.info({ userId: uid, action: 'delete-order-set' })
  return res.json({ ok: true, id })
}

export async function useOrderSet(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getOrderSetsCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
  const updated = await docRef.get()
  req.log!.info({ userId: uid, action: 'use-order-set' })
  return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
}

// ============================================================================
// Disposition Flows CRUD
// ============================================================================

export async function listDispoFlows(req: Request, res: Response) {
  const uid = req.user!.uid

  const snapshot = await getDispoFlowsCollection(uid).get()
  const items = snapshot.docs.map(serializeFirestoreDoc)
  req.log!.info({ userId: uid, action: 'list-dispo-flows' })
  return res.json({ ok: true, items })
}

export async function createDispoFlow(req: Request, res: Response) {
  const uid = req.user!.uid

  const docRef = await getDispoFlowsCollection(uid).add({
    ...req.body,
    createdAt: admin.firestore.Timestamp.now(),
    usageCount: 0,
  })
  const doc = await docRef.get()
  req.log!.info({ userId: uid, action: 'create-dispo-flow' })
  return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
}

export async function updateDispoFlow(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getDispoFlowsCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([, v]) => v !== undefined)
  )
  await docRef.update(updateData)
  const updated = await docRef.get()
  req.log!.info({ userId: uid, action: 'update-dispo-flow' })
  return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
}

export async function deleteDispoFlow(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getDispoFlowsCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  await docRef.delete()
  req.log!.info({ userId: uid, action: 'delete-dispo-flow' })
  return res.json({ ok: true, id })
}

export async function useDispoFlow(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getDispoFlowsCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
  const updated = await docRef.get()
  req.log!.info({ userId: uid, action: 'use-dispo-flow' })
  return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
}

// ============================================================================
// Report Templates CRUD
// ============================================================================

export async function listReportTemplates(req: Request, res: Response) {
  const uid = req.user!.uid

  const snapshot = await getReportTemplatesCollection(uid).get()
  const items = snapshot.docs.map(serializeFirestoreDoc)
  req.log!.info({ userId: uid, action: 'list-report-templates' })
  return res.json({ ok: true, items })
}

export async function createReportTemplate(req: Request, res: Response) {
  const uid = req.user!.uid

  const docRef = await getReportTemplatesCollection(uid).add({
    ...req.body,
    createdAt: admin.firestore.Timestamp.now(),
    usageCount: 0,
  })
  const doc = await docRef.get()
  req.log!.info({ userId: uid, action: 'create-report-template' })
  return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
}

export async function updateReportTemplate(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getReportTemplatesCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([, v]) => v !== undefined)
  )
  await docRef.update(updateData)
  const updated = await docRef.get()
  req.log!.info({ userId: uid, action: 'update-report-template' })
  return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
}

export async function deleteReportTemplate(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getReportTemplatesCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  await docRef.delete()
  req.log!.info({ userId: uid, action: 'delete-report-template' })
  return res.json({ ok: true, id })
}

export async function useReportTemplate(req: Request, res: Response) {
  const uid = req.user!.uid
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const docRef = getReportTemplatesCollection(uid).doc(id)
  const existing = await docRef.get()
  if (!existing.exists) {
    return res.status(404).json({ error: 'Not found' })
  }

  await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
  const updated = await docRef.get()
  req.log!.info({ userId: uid, action: 'use-report-template' })
  return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
}

// ============================================================================
// Customizable Options
// ============================================================================

export async function getOptions(req: Request, res: Response) {
  const uid = req.user!.uid

  const doc = await getUserDoc(uid).get()
  const data = doc.data()
  const options = data?.customizableOptions ?? { dispositionOptions: [], followUpOptions: [] }
  req.log!.info({ userId: uid, action: 'get-options' })
  return res.json({ ok: true, options })
}

export async function updateOptions(req: Request, res: Response) {
  const uid = req.user!.uid

  await getUserDoc(uid).set({ customizableOptions: req.body }, { merge: true })
  req.log!.info({ userId: uid, action: 'update-options' })
  return res.json({ ok: true, options: req.body })
}
