# Ticket: Personal Account Onboarding with Background Business & Avatar

## Summary

Allow users to onboard as **Personal** (in addition to Business/Government). For personal accounts, the app creates a **business in the background** with businessname **`<user name>-business`** and optional **avatar selection** so the experience feels light and personalized without asking for business details. **Location** and **PAN** are optional for Business schema and for business/government signup.

---

## Goals

- **Lower friction**: Personal users only provide name, email, password, phone (no business name, location, PAN, description).
- **Unified model**: Every account still has an associated Business behind the scenes so forms/submissions logic stays consistent.
- **Tone**: Fun, approachable naming and optional avatars to appeal to Gen Z.
- **Clarity**: Clear “Join as Personal” vs “Join as Business” so users know what they’re signing up for.

---

## User Flow (UX)

### 1. Entry: Account type choice

- **Where**: Signup page (first or early step).
- **UI**: Explicit choice, not buried in a dropdown:
  - **Personal** – “Just me” / “For myself” – minimal info, pick an avatar, we’ll set up your space.
  - **Business** – “I run a business” – current flow (business name, location, description, PAN).
  - **Government** – keep existing if still needed.
- **Recommendation**: Use two large cards or toggle (e.g. “Personal” | “Business”) so the choice is obvious. Default to **Personal** for lower friction.
- **Copy (Gen Z–friendly)**:
  - Personal: “Join as **Personal** – just you, no paperwork. We’ll create your space in the background.”
  - Business: “Join as **Business** – for shops, brands, and organizations. You’ll add business details next.”

### 2. Personal path: Minimal form + avatar

- **Fields (required)**:
  - Name  
  - Email  
  - Password  
  - Phone  
- **No** business name, location, description, or PAN.
- **Avatar step** (recommended: same screen or one extra step):
  - Show **4–6 preset avatar options** (icons/illustrations, not photo upload for v1).
  - Examples: default “person”, plant, laptop, coffee, moon, star, etc. (consistent with your design system).
  - Optional: “Skip for now” so avatar is not required.
  - Selected avatar is stored and shown in header/profile/dashboard.
- **Submit**: One “Create account” / “Get started” CTA.

### 3. Business path

- Require **business name** and **description** only. **Location** and **PAN** are **optional**. Optional: add avatar later in profile.

### 4. After signup (both paths)

- Redirect to dashboard (existing behavior).
- Personal users see the same dashboard structure but their “business” in the backend has the businessname **`<user name>-business`** (and optional location/description/PAN). They don’t need to see or edit that unless we add a “Your space” or “Account details” later.

---

## Backend Behavior

### Registration

- **Personal** (`role: 'user'`):
  - Create **User** as today (name, email, password, phone, role).
  - **Also** create a **Business** linked to that user with:
    - **type**: `'personal'` (to differentiate from commercial businesses).
    - **businessname**: **`<user name>-business`** (e.g. "Jane Doe-business"). Use the registered user's `name`; sanitize (trim, collapse spaces).
    - **location**: Optional (omit or leave unset).
    - **description**: Placeholder, e.g. `"Personal account"`.
    - **pancardNumber**: Optional (omit or leave unset).
  - Accept optional **avatarId** (or **avatar**) in register payload and store on User (see Data model).

- **Business / Government**: Require **businessname** and **description** only. **Location** and **PAN** are **optional** (see Data model). Create Business with **type**: `'commercial'`.

### Personal business name

- Use **`<user name>-business`** for the background business of personal accounts. Example: user name "Jane Doe" → businessname `"Jane Doe-business"`. Sanitize name (trim, collapse spaces) before appending `-business`. 
### Validation

- For `role === 'user'` (personal): do **not** require or validate `businessname`, `location`, `description`, `pancardNumber` in the register request; backend generates business name (`<name>-business`) and optional placeholders.
- For `role === 'business'` and `role === 'governmentservices'`: require **businessname** and **description** only; **location** and **pancardNumber** are **optional**.

---

## Data Model

### User

- Add optional field for avatar:
  - **avatarId** (string), e.g. `"avatar-1"`, `"avatar-2"`, … mapping to preset assets, **or**
  - **avatar** (string): asset key or URL.
- No need to change `role` enum; personal stays `role: 'user'`.

### Business

- **Schema**:
  - Add **type**: `{ type: String, enum: ['personal', 'commercial'], required: true }` to differentiate **personal** (background business for user accounts) from **commercial** (real business/government). Default new records: set explicitly on create (`'personal'` for personal signup, `'commercial'` for business/government signup). Existing documents: backfill or default to `'commercial'` for migration.
  - Make **location** and **pancardNumber** **optional** (not required). Keep **businessname** and **description** required.
- **Personal accounts**: Create Business with `type: 'personal'`, `businessname`: **`<user name>-business`**, optional location/description/pancardNumber as above.
- **Commercial accounts**: Create Business with `type: 'commercial'` and provided businessname, description, optional location/PAN.

### Avatar presets

- Store list of preset IDs and asset paths/URLs in config or constants (frontend + backend if we ever need to expose them via API).
- Example: `avatar-1` → `/assets/avatars/person.svg`, `avatar-2` → plant, etc.

---

## Frontend Changes

### Signup page

1. **Account type selector**
   - Replace or complement current “Account Type” dropdown with a clear **Personal vs Business** choice (cards or segmented control).
   - When **Personal** is selected:
     - Hide business name, location, description, PAN.
     - Show avatar picker (see below).
     - Submit only: name, email, password, phone, role (`'user'`), optional `avatarId`.
   - When **Business** (or Government) is selected:
     - Show business name and description (required); location and PAN optional. No avatar step required (can add to profile later).

2. **Avatar picker component**
   - **Location**: On signup for Personal; optionally reusable on Profile for changing avatar.
   - **UI**: Row or grid of 4–6 clickable avatar options (images or icons). Selected state (border/checkmark). Optional “Skip”.
   - **State**: Store selected `avatarId` in form state; send with register payload.
   - **A11y**: Labels, `aria-pressed` or `role="radio"` for selection, keyboard navigation.

3. **Copy and layout**
   - Headline/subcopy that explains “Personal” vs “Business” in one line each.
   - Use existing design system (e.g. `Button`, `Card`, `Input` from your component library).
   - Keep success/error handling and “Go to Login” as today.

### Profile / Dashboard

- **Profile**: If User has `avatarId`, show the corresponding preset avatar in the profile header (and in Edit Profile if we allow changing avatar). Existing `Avatar` component can accept `src` (URL) or a new prop for preset ID and resolve to image.
- **Dashboard**: If we show “business name” anywhere for personal users, show the fun name (e.g. “Vibes Only”) or a generic “Your space”; avoid showing “Personal” or raw placeholder in a way that feels like an error.

---

## Avatar Asset Spec (UI/UX)

- **Count**: 4–6 presets for v1.
- **Style**: Consistent with app (e.g. rounded, flat illustration or icon set). Same aspect ratio (e.g. 1:1).
- **Format**: SVG or PNG; small size for fast load.
- **Themes**: If the app has light/dark mode, ensure avatars look good in both (or use neutral backgrounds).
- **Naming**: Neutral and inclusive (no gender/ethnicity assumptions). Fun but professional enough for a “suggestion” product.

---

## Acceptance Criteria

- [ ] User can choose “Personal” or “Business” (and Government if applicable) on signup in a clear, visible way.
- [ ] Personal signup only asks for: name, email, password, phone, and optional avatar.
- [ ] Submitting personal signup creates both a User (`role: 'user'`) and a Business with **type `'personal'`**, businessname **`<user name>-business`**, and optional location/description/PAN.
- [ ] Business/Government signup creates a Business with **type `'commercial'`**; requires businessname and description only; location and PAN are optional. Schema has location and pancardNumber optional and Business has **type** enum `['personal', 'commercial']`.
- [ ] Personal users can select one of 4–6 preset avatars during signup; selection is persisted (avatarId on User) and shown in profile/dashboard where appropriate.
- [ ] No regression: existing business signup and login still work; dashboard and forms still work for both personal and business users.
- [ ] Copy is clear and Gen Z–friendly where specified (account type, optional taglines).

---

## Out of Scope / Later

- Photo upload for avatar (v1 = presets only).
- Letting personal users “upgrade” to business (add business details later); can be a separate ticket.
- Custom fun name (e.g. user types their own); v1 = backend-generated only.
- Translating fun names or avatar set per locale.

---

## Files to Touch (Reference)

- **Backend**: `src/routes/auth.ts` (register: create Business with **type** `'personal'` or `'commercial'`, accept avatarId), `src/models/User.ts` (avatarId), `src/models/Business.ts` (**type** enum `['personal','commercial']`, optional location/pancardNumber).
- **Frontend**: `src/auth/Signup.tsx` (account type UI, conditional fields, avatar picker), new component e.g. `AvatarPicker.tsx`, profile page for showing/editing avatar.
- **Tests**: Register tests (personal creates user + business with fun name; no business fields required), signup form tests (personal vs business fields, avatar selection).

---

## Copy Cheat Sheet (Gen Z–friendly)

| Context | Suggested copy |
|--------|-----------------|
| Personal option | “Personal – just you, no paperwork. We’ll create your space in the background.” |
| Business option | “Business – for shops, brands & orgs. You’ll add business details next.” |
| Avatar section title | “Pick your vibe” / “Choose your avatar” |
| Skip avatar | “Skip for now” |
| Submit (personal) | “Create account” / “Get started” |

You can tune tone to match your brand (more professional vs more casual) while keeping the same structure.
