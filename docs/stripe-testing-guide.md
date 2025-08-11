# Stripe Integration Testing Guide

## Prerequisites

### 1. Firebase Stripe Extension Installation
The Firebase Stripe Extension must be installed in the Firebase project. This can be done through the Firebase Console:

1. Go to Firebase Console → Extensions
2. Search for "Run Payments with Stripe"
3. Click "Install in console"
4. Configure with **TEST MODE** settings:
   - Stripe API key (test mode): `sk_test_...`
   - Products collection: `products`
   - Customer collection: `customers`
   - Sync new users to Stripe: Yes
   - Automatically delete user data: No

### 2. Stripe Dashboard Setup
In the Stripe Dashboard (test mode):

#### Create Products
1. **MDM Generator Free**
   - Name: MDM Generator Free
   - Description: 10 MDM generations per month
   - Metadata: `tier: free`

2. **MDM Generator Pro** 
   - Name: MDM Generator Pro
   - Description: 250 MDM generations per month
   - Metadata: `tier: pro`

3. **MDM Generator Enterprise**
   - Name: MDM Generator Enterprise
   - Description: 1000 MDM generations per month
   - Metadata: `tier: enterprise`

#### Create Prices
For each product, create a monthly recurring price:
- Free: $0/month (or don't create a price for free tier)
- Pro: $29/month
- Enterprise: $99/month

## Testing Checklist

### Phase 1: Extension Configuration ✅
- [ ] Firebase Stripe Extension installed in test mode
- [ ] Extension has proper permissions (Firestore, Auth)
- [ ] Webhook endpoint configured and validated
- [ ] Environment variables set in Firebase Functions

### Phase 2: Product Sync
- [ ] Products created in Stripe Dashboard
- [ ] Products automatically synced to Firestore `products` collection
- [ ] Prices nested under products in Firestore
- [ ] Product metadata (tier) properly synced

### Phase 3: Customer Creation
- [ ] New Firebase Auth users create Stripe customers
- [ ] Customer documents created in Firestore `customers/{uid}`
- [ ] Stripe customer ID stored in document
- [ ] Email properly synced

### Phase 4: Checkout Flow Testing

#### Test Card Numbers
Use these Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

#### Test Scenarios

1. **Free to Pro Upgrade**
   ```
   1. Log in with test account
   2. Navigate to Settings page
   3. Click "Upgrade to Pro"
   4. Checkout session created in Firestore
   5. Redirect to Stripe Checkout
   6. Enter test card: 4242 4242 4242 4242
   7. Complete checkout
   8. Verify redirect back to app
   9. Check subscription status in Firestore
   ```

2. **Subscription Management**
   ```
   1. Click "Manage Billing" in Settings
   2. Portal session created in Firestore
   3. Redirect to Stripe Customer Portal
   4. Test cancellation
   5. Test reactivation
   6. Test payment method update
   ```

3. **Usage Limit Enforcement**
   ```
   1. Create free account
   2. Track MDM generation in usage collection
   3. Generate 10 MDMs
   4. Verify 11th attempt blocked
   5. Upgrade to Pro
   6. Verify can generate again
   ```

### Phase 5: Webhook Testing

Monitor webhook events in Stripe Dashboard:
- [ ] `checkout.session.completed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.payment_succeeded`
- [ ] `invoice.payment_failed`

### Phase 6: Edge Cases

1. **Payment Failure Recovery**
   - Use card: 4000 0000 0000 0341 (declines after attach)
   - Verify subscription enters `incomplete` state
   - Update payment method
   - Verify recovery

2. **Trial Period** (if configured)
   - Create subscription with trial
   - Verify trial status
   - Test trial expiration

3. **Proration Testing**
   - Upgrade mid-cycle
   - Verify proration calculation
   - Downgrade mid-cycle
   - Verify credit application

## Verification Points

### Firestore Collections Structure
```
customers/
  {uid}/
    - stripeId: "cus_..."
    - stripeLink: "https://dashboard.stripe.com/..."
    
    checkout_sessions/
      {sessionId}/
        - mode: "subscription"
        - price: "price_..."
        - url: "https://checkout.stripe.com/..."
        - success_url: "..."
        - cancel_url: "..."
        
    subscriptions/
      {subscriptionId}/
        - status: "active"
        - items: [...]
        - current_period_start: ...
        - current_period_end: ...
        
    portal_sessions/
      {sessionId}/
        - url: "https://billing.stripe.com/..."
        - return_url: "..."
        
    usage/
      {usageId}/
        - type: "mdm_generation"
        - timestamp: ...

products/
  {productId}/
    - active: true
    - name: "MDM Generator Pro"
    - metadata: { tier: "pro" }
    
    prices/
      {priceId}/
        - active: true
        - currency: "usd"
        - unit_amount: 2900
        - interval: "month"
```

### Frontend State Verification

Check browser console for:
```javascript
// After checkout completion
subscription.status === 'active'
tier === 'pro' // or 'enterprise'
mdmLimitThisMonth === 250 // or 1000
```

### Backend Verification

1. **User Service Checks**
   - User metadata includes stripeCustomerId
   - Subscription status properly cached
   - Usage tracking increments correctly

2. **API Endpoint Tests**
   - `/v1/generate` respects usage limits
   - Returns proper error for exceeded limits
   - Includes remaining usage in response

## Common Issues & Solutions

### Issue: Products not appearing in Firestore
**Solution**: Check webhook configuration in Stripe Dashboard. Ensure Firebase Extension webhook is registered and active.

### Issue: Checkout session URL not generated
**Solution**: 
1. Check Firebase Extension logs for errors
2. Verify Stripe API key is in test mode
3. Ensure price ID exists in Stripe

### Issue: Subscription status not updating
**Solution**: 
1. Check webhook delivery in Stripe Dashboard
2. Verify Firestore rules allow Extension writes
3. Check Extension service account permissions

### Issue: Customer portal not loading
**Solution**: 
1. Enable Customer Portal in Stripe Dashboard settings
2. Configure portal settings (cancellation, payment methods)
3. Verify return_url is set correctly

## Testing Commands

```bash
# Watch Firestore in real-time (using Firebase CLI)
firebase firestore:listen customers

# Check Extension logs
firebase ext:info firestore-stripe-payments

# Test webhook locally (if using Functions)
firebase functions:shell
```

## Success Criteria

- [ ] All test scenarios pass without errors
- [ ] Subscription states correctly reflected in UI
- [ ] Usage limits properly enforced
- [ ] Customer can manage billing through portal
- [ ] All webhook events processed successfully
- [ ] Error states handled gracefully
- [ ] No PHI or sensitive data logged

## Notes

- Always use test mode API keys during development
- Never commit real API keys to version control
- Test with multiple user accounts for isolation
- Clear test data periodically in Stripe Dashboard
- Monitor Firebase Extension quotas and limits