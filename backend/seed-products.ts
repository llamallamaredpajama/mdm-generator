/**
 * Seed Stripe products to Firestore for testing
 *
 * This script manually adds products to Firestore to test the subscription flow
 * without the Firebase Stripe Extension installed.
 *
 * Run from backend directory: npx tsx seed-products.ts
 */

import 'dotenv/config'
import admin from 'firebase-admin'

// Initialize Firebase Admin using the same method as the backend
const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
if (!serviceAccountJson) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set')
  console.error('Make sure backend/.env is configured correctly')
  process.exit(1)
}

const serviceAccount = JSON.parse(serviceAccountJson)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'mdm-generator'
})

const db = admin.firestore()

// Products from Stripe (created in previous session)
const products = [
  {
    id: 'prod_Tj8kp324D4WDqA', // Actual Stripe product ID
    name: 'MDM Generator Pro',
    description: '250 MDM generations per month with priority processing',
    active: true,
    metadata: {
      tier: 'pro'
    },
    prices: [
      {
        id: 'price_1SlgUUC8SiPjuMOqTC4BJ9Kf', // Actual Stripe price ID
        active: true,
        currency: 'usd',
        unit_amount: 2900, // $29.00
        type: 'recurring',
        recurring: {
          interval: 'month',
          interval_count: 1
        }
      }
    ]
  },
  {
    id: 'prod_Tj8kNNUXwRIG9v', // Actual Stripe product ID
    name: 'MDM Generator Enterprise',
    description: '1000 MDM generations per month with API access and team features',
    active: true,
    metadata: {
      tier: 'enterprise'
    },
    prices: [
      {
        id: 'price_1SlgUYC8SiPjuMOqmY9saU3e', // Actual Stripe price ID
        active: true,
        currency: 'usd',
        unit_amount: 9900, // $99.00
        type: 'recurring',
        recurring: {
          interval: 'month',
          interval_count: 1
        }
      }
    ]
  }
]

async function seedProducts() {
  console.log('Seeding products to Firestore...\n')

  for (const product of products) {
    const { prices, ...productData } = product

    // Create product document with the Stripe product ID as the document ID
    const productRef = db.collection('products').doc(product.id)
    await productRef.set(productData)
    console.log(`✓ Created product: ${product.name} (${product.id})`)

    // Create prices subcollection
    for (const price of prices) {
      const priceRef = productRef.collection('prices').doc(price.id)
      await priceRef.set(price)
      console.log(`  ✓ Created price: $${price.unit_amount / 100}/month (${price.id})`)
    }
  }

  console.log('\n✅ Products seeded successfully!')
  console.log('\nVerify in Firebase Console:')
  console.log('https://console.firebase.google.com/project/mdm-generator/firestore/data/~2Fproducts')

  process.exit(0)
}

seedProducts().catch((error) => {
  console.error('Error seeding products:', error)
  process.exit(1)
})
