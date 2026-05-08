# Openbrolly Locations

A multi-tenant film locations platform built with Next.js 14, Firebase, and pnpm workspaces.

- **`apps/public`** — Client-facing locations site (port 3000 in dev)
- **`apps/admin`** — Admin dashboard for managing locations, enquiries, and brand settings (port 3001 in dev)
- **`packages/firebase`** — Shared Firebase config, client/admin SDK exports, and TypeScript types

---

## Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore, Storage, and Authentication enabled

---

## Local development

```bash
# Install dependencies
pnpm install

# Run both apps concurrently (two terminals)
pnpm dev:public    # → http://localhost:3000
pnpm dev:admin     # → http://localhost:3001
```

---

## Environment variables

Each app needs a `.env.local` file. Copy the example and fill in your values:

```bash
cp apps/public/.env.example   apps/public/.env.local
cp apps/admin/.env.example    apps/admin/.env.local
```

### `apps/public/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLIENT_ID` | Firestore client document ID this deployment serves |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config (browser-safe) |
| `FIREBASE_PROJECT_ID` | Service account project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (keep `\n` escapes) |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket (e.g. `project-id.firebasestorage.app`) |

### `apps/admin/.env.local`

Same Firebase variables as above, plus:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_PUBLIC_SITE_URL` | URL of the public site (for "View on site" links) |

> **Getting service account credentials:** Firebase Console → Project settings → Service accounts → Generate new private key. Download the JSON and either point `GOOGLE_APPLICATION_CREDENTIALS` at it or copy the individual fields into `.env.local`.

---

## Firebase setup

### First-time

1. Enable **Firestore**, **Storage**, and **Authentication** (Email/Password provider) in the Firebase Console.
2. Deploy security rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
3. Seed demo data:
   ```bash
   pnpm seed
   ```

### Admin user setup

After creating a user in Firebase Auth (Console → Authentication → Add user):

```
Firebase Console → Firestore → users/{uid} → { clientId: "your-client-id" }
```

Or insert via the Admin SDK / seed script. This mapping tells the admin dashboard which client's data the user manages.

---

## Multi-tenant public site: deploying a new client

Each client gets their own deployed instance of `apps/public` pointing at their `clientId`. The admin app is shared across all clients.

### Steps

1. **Create the client document** in Firestore (via the seed script or manually):
   ```
   clients/{clientId}   →   { name: "...", brandConfig: { ... } }
   ```

2. **Create a Firebase Hosting site** for the client:
   ```bash
   firebase hosting:sites:create {client-hosting-site-id}
   ```

3. **Add the target** to `.firebaserc`:
   ```json
   "targets": {
     "your-project": {
       "hosting": {
         "public": ["openbrollypubliclocations"],
         "client-a": ["{client-a-hosting-site-id}"]
       }
     }
   }
   ```

4. **Add a hosting entry** in `firebase.json`:
   ```json
   {
     "target": "client-a",
     "source": "apps/public",
     "frameworksBackend": { "region": "us-central1" }
   }
   ```

5. **Set environment variables** for the deployment. Firebase framework-aware hosting reads from `.env.local` during build. For CI/CD, set these as build environment variables or use Firebase App Hosting secrets.

6. **Deploy:**
   ```bash
   NEXT_PUBLIC_CLIENT_ID=client-a firebase deploy --only hosting:client-a
   ```

> On Windows / PowerShell use: `$env:NEXT_PUBLIC_CLIENT_ID="client-a"; firebase deploy --only hosting:client-a`

---

## Deployment

The project uses Firebase Hosting with Next.js framework-aware hosting. `firebase deploy` automatically runs `next build` and deploys SSR routes to Cloud Functions.

```bash
# Deploy only the public site
pnpm deploy:public

# Deploy only the admin dashboard
pnpm deploy:admin

# Deploy both
pnpm deploy:all
```

### Firebase Hosting targets

| Target | App | Hosting site |
|---|---|---|
| `public` | `apps/public` | `openbrollypubliclocations` |
| `admin` | `apps/admin` | `openbrolly-admin` |

Targets are configured in `.firebaserc`. Run `firebase target:apply hosting public {your-site-id}` to reconfigure.

---

## Security model

### Firestore

| Path | Public | Admin (own client) |
|---|---|---|
| `clients/{clientId}` | — | read / write |
| `clients/{clientId}/locations/{id}` | read if `status == published` | read / write |
| `clients/{clientId}/locations/{id}/enquiries/{id}` | create | read / update |
| `clients/{clientId}/fieldSchema/**` | read | write |
| `users/{uid}` | — | own record only |

Admin isolation is enforced by looking up `users/{uid}.clientId` in the rules. The admin dashboard uses the Firebase Admin SDK (which bypasses all rules), so these rules primarily guard the public site's client-SDK writes (enquiry form submissions).

### Storage

| Path | Public | Admin |
|---|---|---|
| `clients/{clientId}/brand/{file}` | read | upload via server action |
| `clients/{clientId}/locations/{locationId}/**` | read | upload via server action |

Image and logo uploads go through Next.js Server Actions using the Admin SDK, bypassing Storage security rules entirely. The `allow write: if false` rules make this explicit.

---

## Architecture notes

- **Multi-tenancy:** All data lives under `clients/{clientId}/...`. Each admin user is mapped to exactly one client via `users/{uid}.clientId`.
- **Auth split:** Admin uses Firebase session cookies (verified server-side). Public site has no authentication. The admin browser never holds a Firebase Auth ID token — all Firestore/Storage writes from admin go through Server Actions using the Admin SDK.
- **Branding:** `brandConfig` (logo, primaryColor, secondaryColor) lives on the client document. The public site reads it in the root layout Server Component and injects CSS custom properties (`--brand-primary`, `--brand-secondary`).
- **Custom fields:** Defined in `clients/{clientId}/fieldSchema/default`. The location editor renders them dynamically; the public site shows fields with `showOnPublic: true`.
