

# Plan: Pro Users Get Unlimited Access

## Problem
When admin promotes a user to "pro" plan, the usage limits (15/day, 100/month, 1 persona/month, 5 sequences/month) still apply. The `checkUsageLimits` function in every edge function never checks `subscription.plan` -- it only validates status and expiry. The `useUsageLimits` hook on the frontend also ignores the plan type.

## Solution
Add a "pro" plan check in both backend (edge functions) and frontend (hooks) so Pro users bypass all usage limits.

## Changes

### 1. All Edge Functions - Skip limits for Pro users
In the `checkUsageLimits` function of each edge function, after fetching the subscription, add:
```typescript
if (sub.plan === 'pro') {
  // Pro users: still increment for tracking, but never block
  await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "general" });
  return { allowed: true };
}
```

**Files affected** (7 edge functions):
- `supabase/functions/sales-strategist/index.ts`
- `supabase/functions/persona-generator/index.ts`
- `supabase/functions/ai-mentor-chat/index.ts`
- `supabase/functions/conversation-analyzer/index.ts`
- `supabase/functions/sequence-generator/index.ts`
- `supabase/functions/ad-creator/index.ts`
- `supabase/functions/manychat-flow-generator/index.ts`

Each function's subscription query changes from:
```sql
select("status, expires_at")
```
to:
```sql
select("status, expires_at, plan")
```

### 2. Frontend - `useUsageLimits.ts`
- Import `useAuth` and check `isPro`
- In `canMakeRequest`: if user is Pro, always return `{ allowed: true }`
- In `getUsagePercentages`: show actual usage but never trigger warnings for Pro

### 3. Frontend - `UsageDashboard.tsx`
- Show "Plano Pro - Uso Ilimitado" instead of limit counters when user is Pro
- Still show actual usage stats for reference but without limit fractions

### 4. Frontend - `usePermissions.ts`
- When user is Pro, set custom limits to `null` (unlimited) so permission checks don't block

## Summary
The root cause is that "pro" plan status is stored in the database but never consulted when enforcing limits. This plan adds a single `if (plan === 'pro') → bypass` check in every enforcement point.

