import express from 'express'
import { z } from 'zod'
import admin from 'firebase-admin'
import { userService } from '../../services/userService'
import {
  getUserDoc,
  getOrderSetsCollection,
  getDispoFlowsCollection,
  getReportTemplatesCollection,
  serializeFirestoreDoc,
} from '../../shared/db'
import {
  OrderSetCreateSchema,
  OrderSetUpdateSchema,
  DispositionFlowCreateSchema,
  DispositionFlowUpdateSchema,
  ReportTemplateCreateSchema,
  ReportTemplateUpdateSchema,
  CustomizableOptionsSchema,
} from '../../types/userProfile'
import { CompleteOnboardingSchema } from './schemas'

// ============================================================================
// Auth Helper
// ============================================================================

/** Authenticate request via Bearer token and return uid, or send error response */
export async function authenticateRequest(req: express.Request, res: express.Response): Promise<string | null> {
  const idToken = req.headers.authorization?.split('Bearer ')[1]
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    return decoded.uid
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
}

// ============================================================================
// Whoami
// ============================================================================

export async function whoami(req: express.Request, res: express.Response) {
  try {
    const TokenSchema = z.object({ userIdToken: z.string().min(10) })
    const parsed = TokenSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })

    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      const uid = decoded.uid
      const email = decoded.email || ''

      // Ensure user exists
      const user = await userService.ensureUser(uid, email)

      // Get usage stats
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
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Internal error' })
  }
}

// ============================================================================
// Onboarding
// ============================================================================

export async function completeOnboarding(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = CompleteOnboardingSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // Guard against re-submission
    const user = await userService.getUser(uid)
    if (user?.onboardingCompleted === true) {
      return res.status(409).json({ error: 'Onboarding already completed' })
    }

    const { displayName, credentialType, surveillanceLocation } = parsed.data
    const updateData: Record<string, unknown> = {
      displayName,
      credentialType,
      onboardingCompleted: true,
      updatedAt: admin.firestore.Timestamp.now(),
    }
    if (surveillanceLocation) {
      updateData.surveillanceLocation = surveillanceLocation
    }

    await admin.firestore().collection('users').doc(uid).update(updateData)
    console.log({ userId: uid, action: 'complete-onboarding', timestamp: new Date().toISOString() })

    return res.json({ ok: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal error' })
  }
}

// ============================================================================
// Order Sets CRUD
// ============================================================================

export async function listOrderSets(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const snapshot = await getOrderSetsCollection(uid).get()
    const items = snapshot.docs.map(serializeFirestoreDoc)
    console.log({ userId: uid, action: 'list-order-sets', timestamp: new Date().toISOString() })
    return res.json({ ok: true, items })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function createOrderSet(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = OrderSetCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = await getOrderSetsCollection(uid).add({
      ...parsed.data,
      createdAt: admin.firestore.Timestamp.now(),
      usageCount: 0,
    })
    const doc = await docRef.get()
    console.log({ userId: uid, action: 'create-order-set', timestamp: new Date().toISOString() })
    return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function updateOrderSet(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const parsed = OrderSetUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = getOrderSetsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    )
    await docRef.update(updateData)
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'update-order-set', timestamp: new Date().toISOString() })
    return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function deleteOrderSet(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getOrderSetsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.delete()
    console.log({ userId: uid, action: 'delete-order-set', timestamp: new Date().toISOString() })
    return res.json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function useOrderSet(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getOrderSetsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'use-order-set', timestamp: new Date().toISOString() })
    return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

// ============================================================================
// Disposition Flows CRUD
// ============================================================================

export async function listDispoFlows(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const snapshot = await getDispoFlowsCollection(uid).get()
    const items = snapshot.docs.map(serializeFirestoreDoc)
    console.log({ userId: uid, action: 'list-dispo-flows', timestamp: new Date().toISOString() })
    return res.json({ ok: true, items })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function createDispoFlow(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = DispositionFlowCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = await getDispoFlowsCollection(uid).add({
      ...parsed.data,
      createdAt: admin.firestore.Timestamp.now(),
      usageCount: 0,
    })
    const doc = await docRef.get()
    console.log({ userId: uid, action: 'create-dispo-flow', timestamp: new Date().toISOString() })
    return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function updateDispoFlow(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const parsed = DispositionFlowUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = getDispoFlowsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    )
    await docRef.update(updateData)
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'update-dispo-flow', timestamp: new Date().toISOString() })
    return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function deleteDispoFlow(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getDispoFlowsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.delete()
    console.log({ userId: uid, action: 'delete-dispo-flow', timestamp: new Date().toISOString() })
    return res.json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function useDispoFlow(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getDispoFlowsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'use-dispo-flow', timestamp: new Date().toISOString() })
    return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

// ============================================================================
// Report Templates CRUD
// ============================================================================

export async function listReportTemplates(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const snapshot = await getReportTemplatesCollection(uid).get()
    const items = snapshot.docs.map(serializeFirestoreDoc)
    console.log({ userId: uid, action: 'list-report-templates', timestamp: new Date().toISOString() })
    return res.json({ ok: true, items })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function createReportTemplate(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = ReportTemplateCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = await getReportTemplatesCollection(uid).add({
      ...parsed.data,
      createdAt: admin.firestore.Timestamp.now(),
      usageCount: 0,
    })
    const doc = await docRef.get()
    console.log({ userId: uid, action: 'create-report-template', timestamp: new Date().toISOString() })
    return res.status(201).json({ ok: true, item: serializeFirestoreDoc(doc) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function updateReportTemplate(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const parsed = ReportTemplateUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = getReportTemplatesCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    )
    await docRef.update(updateData)
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'update-report-template', timestamp: new Date().toISOString() })
    return res.json({ ok: true, item: serializeFirestoreDoc(updated) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function deleteReportTemplate(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getReportTemplatesCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.delete()
    console.log({ userId: uid, action: 'delete-report-template', timestamp: new Date().toISOString() })
    return res.json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function useReportTemplate(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getReportTemplatesCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'use-report-template', timestamp: new Date().toISOString() })
    return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

// ============================================================================
// Customizable Options
// ============================================================================

export async function getOptions(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const doc = await getUserDoc(uid).get()
    const data = doc.data()
    const options = data?.customizableOptions ?? { dispositionOptions: [], followUpOptions: [] }
    console.log({ userId: uid, action: 'get-options', timestamp: new Date().toISOString() })
    return res.json({ ok: true, options })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function updateOptions(req: express.Request, res: express.Response) {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = CustomizableOptionsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    await getUserDoc(uid).set({ customizableOptions: parsed.data }, { merge: true })
    console.log({ userId: uid, action: 'update-options', timestamp: new Date().toISOString() })
    return res.json({ ok: true, options: parsed.data })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
}
