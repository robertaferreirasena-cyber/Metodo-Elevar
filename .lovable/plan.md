
# Phase 6: Post-Signup Onboarding Flow

## Context
Phase 5 (Admin Learning) is already implemented. No onboarding system exists yet. The user wants a guided tour after signup with initial profile configuration.

## What to Build

### 1. Database: `onboarding_status` table
- `user_id` (uuid, references profiles, unique)
- `completed` (boolean, default false)
- `completed_at` (timestamptz)
- `current_step` (integer, default 0)
- `created_at` (timestamptz)
- RLS: users can read/update/insert own row
- Auto-create via trigger on new user signup (add to `handle_new_user`)

### 2. Onboarding Dialog Component (`src/components/OnboardingFlow.tsx`)
A multi-step modal dialog that appears on Dashboard when `completed = false`:

- **Step 1 - Welcome**: Welcome message, explain what the platform does (3-4 bullet points with icons)
- **Step 2 - Profile Setup**: Quick name/niche fields (pulls from persona_profiles if exists, or pre-fills)
- **Step 3 - Tour Highlights**: Visual cards showing key features: Mentora Gi, Calculadora, Aprendizado, Conquistas
- **Step 4 - First Action**: CTA buttons to start with Mentora Gi or create Persona

Each step saves `current_step` to DB so users can resume if they close.

### 3. Hook: `src/hooks/useOnboarding.ts`
- Fetch onboarding status for current user
- `completeOnboarding()` — marks as done
- `updateStep(step)` — saves progress
- Auto-creates row if missing (upsert)

### 4. Integration
- Import `OnboardingFlow` in `Dashboard.tsx`
- Show dialog when `onboarding.completed === false`
- After completion, never show again

### Files to Create/Edit
- **Migration**: Create `onboarding_status` table + update `handle_new_user` trigger
- **Create**: `src/hooks/useOnboarding.ts`
- **Create**: `src/components/OnboardingFlow.tsx`
- **Edit**: `src/pages/Dashboard.tsx` — add onboarding trigger
