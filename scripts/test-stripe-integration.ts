#!/usr/bin/env tsx
/**
 * Stripe Integration Test Script
 * Run this after installing Firebase Stripe Extension
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp
} from 'firebase/firestore';

// Firebase config (replace with your config)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'mdm-generator',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test configuration
const TEST_EMAIL = 'stripe-test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('');
  log(`${'='.repeat(50)}`, 'cyan');
  log(title, 'cyan');
  log(`${'='.repeat(50)}`, 'cyan');
}

async function checkExtensionInstalled(): Promise<boolean> {
  logSection('Checking Firebase Stripe Extension');
  
  try {
    // Check if products collection exists
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(productsRef);
    
    if (productsSnap.empty) {
      log('❌ No products found in Firestore', 'yellow');
      log('   Either the extension is not installed or products are not synced', 'yellow');
      return false;
    }
    
    log(`✅ Found ${productsSnap.size} products in Firestore`, 'green');
    
    productsSnap.forEach(doc => {
      const data = doc.data();
      log(`   - ${data.name} (${doc.id})`, 'blue');
      if (data.metadata?.tier) {
        log(`     Tier: ${data.metadata.tier}`, 'blue');
      }
    });
    
    return true;
  } catch (error) {
    log(`❌ Error checking extension: ${error}`, 'red');
    return false;
  }
}

async function testUserSetup(): Promise<User | null> {
  logSection('Setting up Test User');
  
  try {
    // Try to create a new user
    let user: User;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      user = userCred.user;
      log(`✅ Created new test user: ${TEST_EMAIL}`, 'green');
    } catch (createError: any) {
      if (createError.code === 'auth/email-already-in-use') {
        // User exists, sign in instead
        const userCred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        user = userCred.user;
        log(`✅ Signed in existing test user: ${TEST_EMAIL}`, 'green');
      } else {
        throw createError;
      }
    }
    
    // Check if Stripe customer was created
    const customerRef = doc(db, 'customers', user.uid);
    const customerSnap = await getDoc(customerRef);
    
    if (customerSnap.exists()) {
      const customerData = customerSnap.data();
      if (customerData.stripeId) {
        log(`✅ Stripe customer created: ${customerData.stripeId}`, 'green');
      } else {
        log('⏳ Stripe customer document exists but no stripeId yet', 'yellow');
        log('   Waiting for webhook...', 'yellow');
        
        // Wait up to 10 seconds for stripeId
        await new Promise<void>((resolve) => {
          let resolved = false;
          const unsubscribe = onSnapshot(customerRef, (snap) => {
            const data = snap.data();
            if (data?.stripeId && !resolved) {
              resolved = true;
              log(`✅ Stripe customer created: ${data.stripeId}`, 'green');
              unsubscribe();
              resolve();
            }
          });
          
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              log('❌ Timeout waiting for Stripe customer creation', 'red');
              unsubscribe();
              resolve();
            }
          }, 10000);
        });
      }
    } else {
      log('❌ No customer document found', 'red');
      log('   The Firebase Stripe Extension may not be properly configured', 'red');
    }
    
    return user;
  } catch (error) {
    log(`❌ Error setting up user: ${error}`, 'red');
    return null;
  }
}

async function testCheckoutSession(user: User): Promise<boolean> {
  logSection('Testing Checkout Session Creation');
  
  try {
    // Get a test price ID
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('active', '==', true));
    const productsSnap = await getDocs(q);
    
    if (productsSnap.empty) {
      log('❌ No active products found', 'red');
      return false;
    }
    
    // Get the first product's price
    let priceId: string | null = null;
    let productName: string = '';
    
    for (const productDoc of productsSnap.docs) {
      productName = productDoc.data().name;
      const pricesRef = collection(db, 'products', productDoc.id, 'prices');
      const pricesSnap = await getDocs(pricesRef);
      
      if (!pricesSnap.empty) {
        priceId = pricesSnap.docs[0].id;
        const priceData = pricesSnap.docs[0].data();
        log(`✅ Found price for ${productName}: ${priceId}`, 'green');
        log(`   Amount: $${(priceData.unit_amount / 100).toFixed(2)} ${priceData.currency?.toUpperCase()}`, 'blue');
        break;
      }
    }
    
    if (!priceId) {
      log('❌ No prices found for products', 'red');
      return false;
    }
    
    // Create a checkout session
    const checkoutSessionRef = collection(db, 'customers', user.uid, 'checkout_sessions');
    
    log('📝 Creating checkout session...', 'yellow');
    
    const sessionData = {
      mode: 'subscription',
      price: priceId,
      success_url: 'http://localhost:5173/settings?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/settings',
      allow_promotion_codes: true,
      metadata: {
        userId: user.uid,
        userEmail: user.email,
        test: 'true'
      }
    };
    
    const docRef = await addDoc(checkoutSessionRef, sessionData);
    log(`✅ Checkout session document created: ${docRef.id}`, 'green');
    
    // Wait for Stripe to process and add the URL
    return new Promise((resolve) => {
      let resolved = false;
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        
        if (data?.error && !resolved) {
          resolved = true;
          log(`❌ Error creating checkout session: ${data.error.message}`, 'red');
          unsubscribe();
          resolve(false);
        }
        
        if (data?.url && !resolved) {
          resolved = true;
          log('✅ Checkout URL generated!', 'green');
          log(`   URL: ${data.url}`, 'blue');
          log('', 'reset');
          log('   To complete the test:', 'yellow');
          log('   1. Open the URL above in a browser', 'yellow');
          log('   2. Use test card: 4242 4242 4242 4242', 'yellow');
          log('   3. Use any future expiry and CVC', 'yellow');
          log('   4. Complete the checkout', 'yellow');
          unsubscribe();
          resolve(true);
        }
      });
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          log('❌ Timeout waiting for checkout URL', 'red');
          log('   Check Firebase Extension logs for errors', 'yellow');
          unsubscribe();
          resolve(false);
        }
      }, 15000);
    });
  } catch (error) {
    log(`❌ Error testing checkout: ${error}`, 'red');
    return false;
  }
}

async function checkSubscription(user: User): Promise<void> {
  logSection('Checking Subscription Status');
  
  try {
    const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
    const subsSnap = await getDocs(subscriptionsRef);
    
    if (subsSnap.empty) {
      log('ℹ️  No subscriptions found', 'yellow');
      log('   Complete a checkout to create a subscription', 'yellow');
    } else {
      log(`✅ Found ${subsSnap.size} subscription(s)`, 'green');
      
      subsSnap.forEach(doc => {
        const data = doc.data();
        log(`   - Subscription: ${doc.id}`, 'blue');
        log(`     Status: ${data.status}`, data.status === 'active' ? 'green' : 'yellow');
        
        if (data.current_period_end) {
          const endDate = new Date(data.current_period_end.seconds * 1000);
          log(`     Period ends: ${endDate.toLocaleDateString()}`, 'blue');
        }
        
        if (data.items?.[0]?.price?.product?.metadata?.tier) {
          log(`     Tier: ${data.items[0].price.product.metadata.tier}`, 'blue');
        }
      });
    }
  } catch (error) {
    log(`❌ Error checking subscription: ${error}`, 'red');
  }
}

async function testUsageTracking(user: User): Promise<void> {
  logSection('Testing Usage Tracking');
  
  try {
    // Add a test usage record
    const usageRef = collection(db, 'customers', user.uid, 'usage');
    
    const usageData = {
      type: 'mdm_generation',
      timestamp: Timestamp.now(),
      metadata: {
        test: true,
        narrative_length: 500
      }
    };
    
    const docRef = await addDoc(usageRef, usageData);
    log(`✅ Created test usage record: ${docRef.id}`, 'green');
    
    // Query usage for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const q = query(
      usageRef,
      where('timestamp', '>=', Timestamp.fromDate(monthStart)),
      where('type', '==', 'mdm_generation')
    );
    
    const usageSnap = await getDocs(q);
    log(`✅ Current month usage: ${usageSnap.size} MDM(s)`, 'green');
    
    // Check against limits (hardcoded for test)
    const limits = { free: 10, pro: 250, enterprise: 1000 };
    log(`   Free tier limit: ${limits.free}`, 'blue');
    log(`   Pro tier limit: ${limits.pro}`, 'blue');
    log(`   Enterprise tier limit: ${limits.enterprise}`, 'blue');
    
  } catch (error) {
    log(`❌ Error testing usage: ${error}`, 'red');
  }
}

async function runTests() {
  log('🚀 Starting Stripe Integration Tests', 'cyan');
  log(`   Project: ${firebaseConfig.projectId}`, 'blue');
  log('', 'reset');
  
  // Check if extension is installed
  const extensionInstalled = await checkExtensionInstalled();
  
  if (!extensionInstalled) {
    log('', 'reset');
    log('⚠️  Firebase Stripe Extension not properly configured', 'yellow');
    log('', 'reset');
    log('Next steps:', 'yellow');
    log('1. Install the "Run Payments with Stripe" extension in Firebase Console', 'yellow');
    log('2. Configure with test mode Stripe API keys', 'yellow');
    log('3. Create products in Stripe Dashboard', 'yellow');
    log('4. Wait for products to sync to Firestore', 'yellow');
    log('5. Run this test again', 'yellow');
    process.exit(1);
  }
  
  // Setup test user
  const user = await testUserSetup();
  
  if (!user) {
    log('❌ Failed to setup test user', 'red');
    process.exit(1);
  }
  
  // Test checkout session
  const checkoutCreated = await testCheckoutSession(user);
  
  // Check subscription status
  await checkSubscription(user);
  
  // Test usage tracking
  await testUsageTracking(user);
  
  logSection('Test Summary');
  
  if (checkoutCreated) {
    log('✅ Stripe integration is working!', 'green');
    log('', 'reset');
    log('Next steps:', 'yellow');
    log('1. Complete a test checkout using the URL above', 'yellow');
    log('2. Run this script again to verify subscription', 'yellow');
    log('3. Test the customer portal for billing management', 'yellow');
    log('4. Test upgrade/downgrade flows', 'yellow');
  } else {
    log('⚠️  Some tests failed', 'yellow');
    log('Check the Firebase Extension logs for more details', 'yellow');
  }
  
  // Keep the process alive briefly to allow async operations to complete
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Run the tests
runTests().catch(error => {
  log(`❌ Fatal error: ${error}`, 'red');
  process.exit(1);
});