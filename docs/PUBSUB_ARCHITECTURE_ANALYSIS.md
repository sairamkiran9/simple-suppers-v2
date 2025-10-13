# Pub-Sub Architecture Analysis for Simple Suppers

**Document Version:** 1.0
**Date:** 2025-10-13
**Status:** Recommendation

---

## Executive Summary

**Recommendation: DEFER pub-sub architecture until specific triggers are met.**

Simple Suppers is currently an MVP with direct API-to-database operations that perform well (~200ms responses). The application has no asynchronous workflows, no email notifications, no webhooks, and no background processing requirements. Introducing a pub-sub architecture now would add unnecessary complexity without solving any existing problems. However, the codebase is well-positioned for future adoption when scalability or feature requirements demand it.

**Defer until:** You need to implement emails, webhooks, audit trails, or experience database contention issues (typically 1,000+ concurrent users).

---

## Current Architecture Review

### Event Flow Analysis

#### Subscribe Operation Flow
```
User clicks "Subscribe"
  ↓
POST /api/purchases/instant
  ↓
1. Authenticate user (requireAuth)
2. Apply rate limiting (withRateLimit)
3. Validate meal_plan_id
4. Fetch meal plan from database (Supabase query)
5. Check for existing active subscription
6. Calculate earnings (70/30 split)
7. Create purchase record (createPurchase)
8. Track analytics event (trackEvent) ← Fire-and-forget
9. Return success response (200 OK)
  ↓
UI refetches data (refetchMealPlans, refetchMealPlanDetail)
  ↓
Dashboard updates with new subscription
```

**Key Characteristics:**
- **Synchronous**: All operations complete before response
- **Sequential**: Database writes happen in order
- **Blocking**: User waits for all operations (~200ms total)
- **Simple**: Direct function calls, no message passing

#### Unsubscribe Operation Flow
```
User confirms unsubscription
  ↓
POST /api/purchases/[id]/cancel
  ↓
1. Authenticate user
2. Apply rate limiting
3. Verify purchase ownership
4. Check if already canceled
5. Update is_active to false (cancelPurchase)
6. Track analytics event (trackEvent) ← Fire-and-forget
7. Return success response
  ↓
UI refetches data and updates dashboard
```

### Database Operations

**Current Purchase Creation (`createPurchase` function):**
```typescript
// lib/database-utils.ts
export async function createPurchase(purchaseData: Partial<UserPlanPurchase>) {
  const { data, error } = await supabaseAdmin
    .from('user_plan_purchases')
    .insert(purchaseData)
    .select()
    .single()

  if (error) throw error
  return data as UserPlanPurchase
}
```

**Analysis:**
- Single INSERT operation
- Uses Supabase admin client (bypasses RLS)
- Returns immediately on error or success
- No transactions or multi-step operations
- No retry logic or failure handling

**Current Analytics Tracking (`trackEvent` function):**
```typescript
// lib/database-utils.ts
export async function trackEvent(eventData: {
  event_type: string
  meal_plan_id?: string
  user_id?: string
  provider_id?: string
  session_id?: string
  metadata?: any
}) {
  const { error } = await supabaseAdmin
    .from('platform_analytics')
    .insert(eventData)

  if (error) console.error('Analytics tracking error:', error)
}
```

**Key Observations:**
- Fire-and-forget pattern (no await in calling code)
- Errors are logged but don't affect user experience
- No retry mechanism if analytics insert fails
- Simple INSERT into `platform_analytics` table

### Data Consistency Approach

**Current Consistency Model:** **Immediate Consistency**

1. **Purchase Creation**: Synchronous INSERT with immediate response
2. **Analytics Tracking**: Best-effort, non-blocking (errors ignored)
3. **UI Updates**: Manual refetch after operation completes
4. **No Rollback Logic**: If analytics fails, purchase still succeeds

**Trade-offs:**
- **Pros**: Simple to understand, easy to debug, immediate feedback
- **Cons**: No retry on analytics failure, tight coupling of operations

### Dependencies Map

```
┌─────────────────────────────────────────────────────────┐
│                     User Action                         │
│               (Subscribe/Unsubscribe)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  API Route Handler                      │
│    /api/purchases/instant or /cancel                    │
└─────┬───────────────────────┬──────────────────────┬────┘
      │                       │                      │
      ↓                       ↓                      ↓
┌──────────┐          ┌──────────────┐      ┌─────────────┐
│  Auth    │          │  Database    │      │  Analytics  │
│ requireAuth()       │ Operations   │      │ trackEvent()│
└──────────┘          └──────────────┘      └─────────────┘
                             │                      │
                             ↓                      ↓
                      ┌─────────────┐        ┌─────────────┐
                      │  Supabase   │        │  Supabase   │
                      │ user_plan_  │        │ platform_   │
                      │ purchases   │        │ analytics   │
                      └─────────────┘        └─────────────┘
```

**Critical Dependencies:**
- All operations depend on Supabase availability
- No message queue or buffer for failed operations
- No circuit breaker for database failures

---

## Pub-Sub Architecture Benefits

### What is Pub-Sub?

**Pub-Sub (Publisher-Subscriber)** is an event-driven architecture pattern where:
- **Publishers** emit events when something happens (e.g., "user subscribed")
- **Subscribers** listen for events and react independently (e.g., send email, update analytics)
- **Event Bus/Queue** decouples publishers from subscribers

### When Pub-Sub is Needed

| Scenario | Without Pub-Sub | With Pub-Sub |
|----------|----------------|--------------|
| **Send confirmation email** | API blocks 2-5 seconds waiting for email service | Instant response, email sent asynchronously |
| **Call external webhook** | API blocks, timeout risks | Non-blocking, retries on failure |
| **Generate PDF receipt** | User waits 3-10 seconds | Background job, notify when ready |
| **Update multiple systems** | Sequential calls, slow | Parallel event handlers |
| **Audit logging** | Tightly coupled, error-prone | Independent audit service |
| **Analytics tracking** | If it fails, purchase fails | Decoupled, can retry separately |

### Problems Pub-Sub Solves

#### 1. **Decoupling**
**Problem:** Adding a new side-effect (e.g., send Slack notification) requires modifying API route code.
**Solution:** Publish a "purchase_completed" event, add a new subscriber without touching existing code.

#### 2. **Asynchronous Processing**
**Problem:** User waits for slow operations (email, PDF generation, webhook calls).
**Solution:** API returns immediately, background workers handle slow tasks.

#### 3. **Fault Tolerance**
**Problem:** If analytics tracking fails, the entire purchase operation fails.
**Solution:** Events can be retried independently without affecting the main operation.

#### 4. **Scalability**
**Problem:** Database can't handle 1,000 analytics INSERTs per second during traffic spikes.
**Solution:** Queue events, process them in batches or throttle based on capacity.

#### 5. **Audit Trail / Event Sourcing**
**Problem:** Hard to reconstruct what happened when (e.g., "When did user X subscribe?").
**Solution:** Every event is stored with timestamp, metadata, and can be replayed.

### In-Memory Queue vs Message Broker

| Feature | In-Memory Queue | Message Broker (Redis/RabbitMQ) |
|---------|----------------|----------------------------------|
| **Setup Complexity** | Low (Node.js EventEmitter) | High (external service) |
| **Durability** | Lost on server restart | Persisted to disk |
| **Scalability** | Single process only | Multi-instance, distributed |
| **Use Case** | Development, MVP, low traffic | Production, high traffic |
| **Cost** | Free | Redis: $10-50/month, RabbitMQ: self-hosted or $100+/month |
| **Latency** | <1ms | 1-10ms (network overhead) |
| **Reliability** | No retry on crash | Dead letter queues, retries |

**Simple Suppers Context:**
- **Current needs:** Low traffic, single Next.js instance
- **Short-term:** In-memory EventEmitter would suffice
- **Long-term (1,000+ users):** Redis or RabbitMQ for durability

---

## Gap Analysis

### What We Can't Do Now (Without Pub-Sub)

1. **Send Email Notifications**
   - **Current:** No email infrastructure exists
   - **With Pub-Sub:** Subscribe to "purchase_completed" event, send welcome email

2. **Call Provider Webhooks**
   - **Current:** Would block API if provider's server is slow
   - **With Pub-Sub:** Fire-and-forget webhook, retry on failure

3. **Generate PDF Receipts**
   - **Current:** User waits 3-10 seconds for PDF generation
   - **With Pub-Sub:** Background job, notify via email when ready

4. **Retry Failed Analytics**
   - **Current:** If `trackEvent()` fails, event is lost forever
   - **With Pub-Sub:** Queue the event, retry 3 times before dead-lettering

5. **Audit Logging**
   - **Current:** `platform_analytics` table is fire-and-forget
   - **With Pub-Sub:** Dedicated audit service, guaranteed delivery

6. **Multi-Tenant Notifications**
   - **Current:** No way to notify providers when their plan is purchased
   - **With Pub-Sub:** Provider notification service subscribes to "purchase_completed"

### Future Features That Would Benefit

| Feature | Trigger Event | Subscribers |
|---------|---------------|-------------|
| **Email notifications** | `purchase_completed` | EmailService, ProviderNotificationService |
| **Webhook integrations** | `purchase_completed`, `subscription_canceled` | WebhookService |
| **PDF receipt generation** | `purchase_completed` | PDFGenerationService |
| **Provider dashboard alerts** | `purchase_completed` | ProviderDashboardService |
| **Recommendation engine** | `meal_plan_viewed`, `purchase_completed` | RecommendationService |
| **Stripe payment webhooks** | `payment_intent_succeeded` | PaymentProcessingService |
| **Scheduled reminders** | `subscription_expires_soon` (cron job publishes) | ReminderService |

### Scalability: When is it Necessary?

| User Activity Level | Database Load | Recommendation |
|---------------------|---------------|----------------|
| **0-100 users** | < 10 requests/min | Defer pub-sub |
| **100-1,000 users** | 10-100 requests/min | In-memory EventEmitter sufficient |
| **1,000-10,000 users** | 100-1,000 requests/min | Redis Pub-Sub recommended |
| **10,000+ users** | 1,000+ requests/min | Dedicated message broker (RabbitMQ, Kafka) |

**Current Status:** Early MVP with small user base → **Defer**

### Reliability Requirements

**When you need retry logic / dead letter queues:**
- **Email must be sent:** Welcome emails, password resets
- **Payments must be reconciled:** Stripe webhooks, refunds
- **Audit logs are legally required:** GDPR, SOC2 compliance
- **Third-party integrations are critical:** CRM sync, analytics platforms

**Simple Suppers Status:** No critical external dependencies → **Not urgent**

---

## Recommendation: Defer Pub-Sub Until Specific Triggers

### Verdict: **Wait for Concrete Needs**

**Do NOT implement pub-sub now because:**
1. No asynchronous workflows exist (no emails, webhooks, background jobs)
2. Performance is acceptable (~200ms API responses)
3. Adding pub-sub increases complexity without solving current problems
4. MVP stage requires speed of iteration, not premature optimization
5. Current analytics tracking is non-critical (failures are acceptable)

### Triggers to Implement Pub-Sub

Implement pub-sub architecture when **any** of these occur:

| Trigger | Example Scenario |
|---------|------------------|
| **1. Email notifications are required** | "Users must receive confirmation emails after purchase" |
| **2. Webhook integrations are added** | "Call Zapier webhook when user subscribes" |
| **3. Background processing is needed** | "Generate 100-page PDF meal plan book" |
| **4. Database contention occurs** | "Analytics INSERTs are causing purchase latency spikes" |
| **5. Audit requirements tighten** | "Legal team requires immutable audit trail of all transactions" |
| **6. Multi-service architecture emerges** | "Separate microservice handles notifications" |
| **7. Retry logic becomes critical** | "If Stripe webhook fails, we lose money" |

### Complexity vs Benefit Trade-Off

**Current Complexity:** Low
**Current Benefit:** Zero (no problems being solved)

**With Pub-Sub Complexity:** Medium-High
**With Pub-Sub Benefit:** Zero (no features requiring it)

**Verdict:** Wait until benefits justify complexity.

### Technical Debt Mitigation

To prepare for future pub-sub adoption without implementing it now:

1. **Event Naming Convention**
   - Use consistent event names: `purchase_completed`, `subscription_canceled`
   - Document events in code comments

2. **Centralized Event Definitions**
   - Create `lib/events.ts` file with event type definitions
   - Example:
     ```typescript
     export const APP_EVENTS = {
       PURCHASE_COMPLETED: 'purchase_completed',
       SUBSCRIPTION_CANCELED: 'subscription_canceled',
       MEAL_PLAN_VIEWED: 'meal_plan_viewed',
     } as const
     ```

3. **Wrap trackEvent() for Future Migration**
   - Create a facade function that can be swapped later:
     ```typescript
     // lib/event-emitter.ts (future-proof wrapper)
     export async function emitEvent(eventType: string, payload: any) {
       // Today: Direct database insert
       await trackEvent({ event_type: eventType, ...payload })

       // Tomorrow: Publish to queue
       // await eventBus.publish(eventType, payload)
     }
     ```

4. **Document Side-Effects**
   - Add code comments noting potential future events:
     ```typescript
     // TODO: When pub-sub is added, publish "purchase_completed" event here
     await createPurchase(purchaseData)
     ```

---

## Implementation Roadmap (If Recommended)

This roadmap is **deferred** but ready for when triggers are met.

### Phase 1: In-Memory EventEmitter (1-2 weeks)

**Goal:** Introduce pub-sub pattern without external dependencies

**Tasks:**
1. Create `lib/event-bus.ts` using Node.js EventEmitter
2. Define event types in `lib/events.ts`
3. Migrate `trackEvent()` to publish events
4. Create first subscriber: `AnalyticsSubscriber`
5. Add error handling and logging

**Events to Implement:**
- `purchase_completed`
- `subscription_canceled`
- `meal_plan_viewed`

**Libraries:** None (Node.js built-in EventEmitter)

### Phase 2: External Message Broker (2-4 weeks)

**Goal:** Add durability and retry logic

**Tasks:**
1. Set up Redis on hosting platform (Vercel KV, Upstash, Railway)
2. Replace EventEmitter with Redis Pub-Sub client
3. Implement retry logic with exponential backoff
4. Add dead letter queue for failed events
5. Create monitoring dashboard for queue metrics

**Recommended Libraries:**
- **Redis Client:** `ioredis` or `redis` npm package
- **Queue Library:** `bull` or `bullmq` (Redis-based job queues)
- **Monitoring:** `bull-board` for UI dashboard

**Infrastructure:**
- **Redis instance:** Upstash (free tier) or Redis Cloud ($10/month)

### Phase 3: Feature-Specific Subscribers (ongoing)

**Goal:** Add business logic subscribers as features are built

**Subscribers to Add:**
1. **EmailSubscriber**: Send confirmation/cancellation emails
2. **WebhookSubscriber**: Call third-party webhooks
3. **PDFSubscriber**: Generate meal plan PDFs
4. **ProviderNotificationSubscriber**: Alert providers of purchases
5. **AuditLogSubscriber**: Immutable audit trail

**Migration Strategy:**
1. Add new subscriber without removing old code
2. Run both systems in parallel for 1-2 weeks
3. Compare results for consistency
4. Remove old code after validation

---

## Code Examples

### Current Subscribe Flow

```typescript
// app/api/purchases/instant/route.ts
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  const { meal_plan_id } = await request.json()

  // 1. Fetch meal plan
  const { data: mealPlan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('id', meal_plan_id)
    .single()

  // 2. Create purchase
  const purchase = await createPurchase({
    user_id: user.id,
    meal_plan_id: meal_plan_id,
    purchase_price: mealPlan.final_price,
    status: 'completed',
  })

  // 3. Track analytics (fire-and-forget)
  await trackEvent({
    event_type: 'purchase',
    user_id: user.id,
    meal_plan_id: meal_plan_id,
    metadata: { purchase_price: mealPlan.final_price }
  })

  return SuccessResponses.ok({ purchase_id: purchase.id })
}
```

**Problems:**
- If `trackEvent()` fails, purchase still succeeds (inconsistent state)
- Adding email notification requires modifying this API route
- No retry logic if analytics database is temporarily down

### Future Pub-Sub Flow (Phase 1: In-Memory)

```typescript
// lib/event-bus.ts
import { EventEmitter } from 'events'

class EventBus extends EventEmitter {
  async publish(eventType: string, payload: any) {
    console.log(`[EventBus] Publishing event: ${eventType}`, payload)
    this.emit(eventType, payload)
  }

  subscribe(eventType: string, handler: (payload: any) => void) {
    this.on(eventType, async (payload) => {
      try {
        await handler(payload)
      } catch (error) {
        console.error(`[EventBus] Handler error for ${eventType}:`, error)
        // In Phase 2: Move to dead letter queue
      }
    })
  }
}

export const eventBus = new EventBus()
```

```typescript
// lib/events.ts
export const APP_EVENTS = {
  PURCHASE_COMPLETED: 'purchase_completed',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  MEAL_PLAN_VIEWED: 'meal_plan_viewed',
} as const

export interface PurchaseCompletedEvent {
  purchase_id: string
  user_id: string
  meal_plan_id: string
  provider_id: string
  purchase_price: number
  timestamp: string
}
```

```typescript
// lib/subscribers/analytics-subscriber.ts
import { eventBus } from '@/lib/event-bus'
import { APP_EVENTS, PurchaseCompletedEvent } from '@/lib/events'
import { trackEvent } from '@/lib/database-utils'

export function registerAnalyticsSubscriber() {
  eventBus.subscribe(
    APP_EVENTS.PURCHASE_COMPLETED,
    async (event: PurchaseCompletedEvent) => {
      await trackEvent({
        event_type: 'purchase',
        user_id: event.user_id,
        meal_plan_id: event.meal_plan_id,
        provider_id: event.provider_id,
        metadata: { purchase_price: event.purchase_price }
      })
    }
  )

  eventBus.subscribe(
    APP_EVENTS.SUBSCRIPTION_CANCELED,
    async (event: any) => {
      await trackEvent({
        event_type: 'cancel_subscription',
        user_id: event.user_id,
        meal_plan_id: event.meal_plan_id,
        metadata: { purchase_id: event.purchase_id }
      })
    }
  )
}
```

```typescript
// app/api/purchases/instant/route.ts (MODIFIED)
import { eventBus } from '@/lib/event-bus'
import { APP_EVENTS } from '@/lib/events'

export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  const { meal_plan_id } = await request.json()

  const { data: mealPlan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('id', meal_plan_id)
    .single()

  const purchase = await createPurchase({
    user_id: user.id,
    meal_plan_id: meal_plan_id,
    purchase_price: mealPlan.final_price,
    status: 'completed',
  })

  // NEW: Publish event instead of direct trackEvent()
  await eventBus.publish(APP_EVENTS.PURCHASE_COMPLETED, {
    purchase_id: purchase.id,
    user_id: user.id,
    meal_plan_id: meal_plan_id,
    provider_id: mealPlan.provider_id,
    purchase_price: mealPlan.final_price,
    timestamp: new Date().toISOString()
  })

  return SuccessResponses.ok({ purchase_id: purchase.id })
}
```

**Benefits:**
- Adding email subscriber doesn't touch API route code
- Analytics failure doesn't affect purchase success
- Easy to add retry logic in Phase 2

### Example: Adding Email Subscriber (Future)

```typescript
// lib/subscribers/email-subscriber.ts
import { eventBus } from '@/lib/event-bus'
import { APP_EVENTS, PurchaseCompletedEvent } from '@/lib/events'
import { sendEmail } from '@/lib/email-service' // Hypothetical

export function registerEmailSubscriber() {
  eventBus.subscribe(
    APP_EVENTS.PURCHASE_COMPLETED,
    async (event: PurchaseCompletedEvent) => {
      // Send confirmation email
      await sendEmail({
        to: event.user_id, // Lookup user email
        subject: 'Your meal plan is ready!',
        template: 'purchase-confirmation',
        data: {
          purchase_id: event.purchase_id,
          meal_plan_id: event.meal_plan_id
        }
      })
    }
  )
}
```

**No API route changes needed!**

### Phase 2: Redis-Based Queue (Future)

```typescript
// lib/event-bus-redis.ts
import Queue from 'bull'
import Redis from 'ioredis'

const redisClient = new Redis(process.env.REDIS_URL)

const queues = {
  analytics: new Queue('analytics', { redis: redisClient }),
  email: new Queue('email', { redis: redisClient }),
  webhooks: new Queue('webhooks', { redis: redisClient }),
}

export class RedisEventBus {
  async publish(eventType: string, payload: any) {
    const queueName = this.getQueueForEvent(eventType)
    await queues[queueName].add(eventType, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s
      },
    })
  }

  private getQueueForEvent(eventType: string): string {
    if (eventType.includes('email')) return 'email'
    if (eventType.includes('webhook')) return 'webhooks'
    return 'analytics'
  }
}

export const eventBus = new RedisEventBus()
```

**Worker Process:**
```typescript
// workers/analytics-worker.ts
import { queues } from '@/lib/event-bus-redis'
import { trackEvent } from '@/lib/database-utils'

queues.analytics.process(async (job) => {
  const { eventType, payload } = job.data
  await trackEvent({
    event_type: eventType,
    ...payload
  })
})
```

**Run worker:** `node workers/analytics-worker.js` (separate process)

---

## Conclusion

### Summary of Findings

1. **Current Architecture is Adequate**
   - Direct API → Database flow is simple and performs well
   - No asynchronous workflows to justify pub-sub
   - ~200ms response times are acceptable for MVP

2. **Pub-Sub Solves Problems You Don't Have Yet**
   - No emails, webhooks, or background jobs
   - No scalability issues with current traffic
   - Analytics failures are non-critical

3. **Future-Proofing is Possible Without Implementation**
   - Use consistent event naming conventions
   - Document side-effects for future migration
   - Create event type definitions now

4. **Clear Triggers Exist for Future Adoption**
   - Email notifications requirement
   - Webhook integrations
   - Database contention under load
   - Audit compliance needs

### Final Recommendation

**DEFER pub-sub architecture until:**
- You need to send emails (most likely trigger)
- You integrate with external systems via webhooks
- You experience database performance issues
- User base grows beyond 1,000 active users

**When you do implement:**
1. Start with Node.js EventEmitter (Phase 1)
2. Migrate to Redis/BullMQ when traffic scales (Phase 2)
3. Add feature-specific subscribers as needed (Phase 3)

**Cost of waiting:** Minimal. Refactoring API routes to publish events is straightforward.
**Cost of premature implementation:** High. Extra complexity slows down MVP development.

### Engineering Principles Applied

- **YAGNI (You Aren't Gonna Need It):** Don't build features before they're needed
- **KISS (Keep It Simple):** Direct API calls are simpler than event-driven systems
- **Measure First, Optimize Second:** No performance problems to solve yet
- **Iterate Quickly:** MVP speed > premature scaling

---

## Appendix: Comparison Table

| Aspect | Current Architecture | With Pub-Sub |
|--------|---------------------|--------------|
| **Complexity** | Low | Medium-High |
| **Latency** | 200ms (acceptable) | 150ms API + background processing |
| **Fault Tolerance** | Low (analytics failure = data loss) | High (retries, dead letter queues) |
| **Extensibility** | Low (modify API routes for new features) | High (add subscribers without touching routes) |
| **Debugging** | Easy (linear flow) | Hard (asynchronous, distributed) |
| **Cost** | $0 (no extra services) | $10-50/month (Redis) |
| **Development Time** | 0 days (no work needed) | 2-4 weeks (Phase 1-2) |
| **Production Readiness** | Production-ready | Needs monitoring, alerting setup |
| **Use Case Fit** | MVP, small traffic | High traffic, many side-effects |

---

## References

**Internal Documentation:**
- `/app/api/purchases/instant/route.ts` - Subscribe flow
- `/app/api/purchases/[id]/cancel/route.ts` - Unsubscribe flow
- `/lib/database-utils.ts` - Database operations and `trackEvent()`
- `/lib/database-types.ts` - Schema definitions

**External Resources:**
- [Martin Fowler on Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [AWS Well-Architected Framework: Event-Driven Architectures](https://docs.aws.amazon.com/wellarchitected/latest/event-driven-architectures/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Redis Pub-Sub Guide](https://redis.io/docs/manual/pubsub/)

---

**Document Owner:** Engineering Team
**Review Date:** Q2 2026 (or when first trigger condition is met)
