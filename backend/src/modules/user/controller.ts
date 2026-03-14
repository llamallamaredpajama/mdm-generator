import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { serializeFirestoreDoc } from '../../shared/db.js'
import type { UserModuleDeps } from '../../dependencies.js'

export function createUserController({ userService, db }: UserModuleDeps) {
  // Subcollection helpers — use injected db instead of shared/db helpers
  const getCustomersDoc = (uid: string) => db.collection('customers').doc(uid)
  const getOrderSetsCollection = (uid: string) => getCustomersDoc(uid).collection('orderSets')
  const getDispoFlowsCollection = (uid: string) => getCustomersDoc(uid).collection('dispoFlows')
  const getReportTemplatesCollection = (uid: string) => getCustomersDoc(uid).collection('reportTemplates')

  return {
    // ── Whoami ──────────────────────────────────────────────────────────────
    whoami: async (req: Request, res: Response) => {
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
    },

    // ── Onboarding ──────────────────────────────────────────────────────────
    completeOnboarding: async (req: Request, res: Response) => {
      const uid = req.user!.uid

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

      await db.collection('users').doc(uid).update(updateData)
      req.log!.info({ userId: uid, action: 'complete-onboarding' })

      return res.json({ ok: true })
    },

    // ── Order Sets CRUD ─────────────────────────────────────────────────────
    listOrderSets: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const snapshot = await getOrderSetsCollection(uid).get()
      const items = snapshot.docs.map(serializeFirestoreDoc)
      req.log!.info({ userId: uid, action: 'list-order-sets' })
      return res.json({ ok: true, items })
    },

    createOrderSet: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const docRef = await getOrderSetsCollection(uid).add({
        ...req.body,
        createdAt: admin.firestore.Timestamp.now(),
        usageCount: 0,
      })
      const doc = await docRef.get()
      req.log!.info({ userId: uid, action: 'create-order-set' })
      return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
    },

    updateOrderSet: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getOrderSetsCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([, v]) => v !== undefined)
      )
      await docRef.update(updateData)
      const updated = await docRef.get()
      req.log!.info({ userId: uid, action: 'update-order-set' })
      return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
    },

    deleteOrderSet: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getOrderSetsCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      await docRef.delete()
      req.log!.info({ userId: uid, action: 'delete-order-set' })
      return res.json({ ok: true, id })
    },

    useOrderSet: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getOrderSetsCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
      const updated = await docRef.get()
      req.log!.info({ userId: uid, action: 'use-order-set' })
      return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
    },

    // ── Disposition Flows CRUD ──────────────────────────────────────────────
    listDispoFlows: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const snapshot = await getDispoFlowsCollection(uid).get()
      const items = snapshot.docs.map(serializeFirestoreDoc)
      req.log!.info({ userId: uid, action: 'list-dispo-flows' })
      return res.json({ ok: true, items })
    },

    createDispoFlow: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const docRef = await getDispoFlowsCollection(uid).add({
        ...req.body,
        createdAt: admin.firestore.Timestamp.now(),
        usageCount: 0,
      })
      const doc = await docRef.get()
      req.log!.info({ userId: uid, action: 'create-dispo-flow' })
      return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
    },

    updateDispoFlow: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getDispoFlowsCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([, v]) => v !== undefined)
      )
      await docRef.update(updateData)
      const updated = await docRef.get()
      req.log!.info({ userId: uid, action: 'update-dispo-flow' })
      return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
    },

    deleteDispoFlow: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getDispoFlowsCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      await docRef.delete()
      req.log!.info({ userId: uid, action: 'delete-dispo-flow' })
      return res.json({ ok: true, id })
    },

    useDispoFlow: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getDispoFlowsCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
      const updated = await docRef.get()
      req.log!.info({ userId: uid, action: 'use-dispo-flow' })
      return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
    },

    // ── Report Templates CRUD ───────────────────────────────────────────────
    listReportTemplates: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const snapshot = await getReportTemplatesCollection(uid).get()
      const items = snapshot.docs.map(serializeFirestoreDoc)
      req.log!.info({ userId: uid, action: 'list-report-templates' })
      return res.json({ ok: true, items })
    },

    createReportTemplate: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const docRef = await getReportTemplatesCollection(uid).add({
        ...req.body,
        createdAt: admin.firestore.Timestamp.now(),
        usageCount: 0,
      })
      const doc = await docRef.get()
      req.log!.info({ userId: uid, action: 'create-report-template' })
      return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
    },

    updateReportTemplate: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getReportTemplatesCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([, v]) => v !== undefined)
      )
      await docRef.update(updateData)
      const updated = await docRef.get()
      req.log!.info({ userId: uid, action: 'update-report-template' })
      return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
    },

    deleteReportTemplate: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getReportTemplatesCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      await docRef.delete()
      req.log!.info({ userId: uid, action: 'delete-report-template' })
      return res.json({ ok: true, id })
    },

    useReportTemplate: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const docRef = getReportTemplatesCollection(uid).doc(id)
      const existing = await docRef.get()
      if (!existing.exists) return res.status(404).json({ error: 'Not found' })

      await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
      const updated = await docRef.get()
      req.log!.info({ userId: uid, action: 'use-report-template' })
      return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
    },

    // ── Customizable Options ────────────────────────────────────────────────
    getOptions: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const doc = await getCustomersDoc(uid).get()
      const data = doc.data()
      const options = data?.customizableOptions ?? { dispositionOptions: [], followUpOptions: [] }
      req.log!.info({ userId: uid, action: 'get-options' })
      return res.json({ ok: true, options })
    },

    updateOptions: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      await getCustomersDoc(uid).set({ customizableOptions: req.body }, { merge: true })
      req.log!.info({ userId: uid, action: 'update-options' })
      return res.json({ ok: true, options: req.body })
    },
  }
}
