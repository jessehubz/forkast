# Forkcast

Smart restaurant reservation platform with live floor maps, crowd heatmaps, and dynamic deposits.

---

## Quick Start

```
1. Set up Supabase project
2. Copy .env.example → .env.local and fill in values
3. Run: npx prisma db push
4. Run: npm run db:seed
5. Run: npm run dev
```

---

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project** — give it a name like "forkcast"
3. Choose a region close to you and set a database password (save it!)
4. Wait for the project to finish provisioning (~1 min)

### 2. Get Your Supabase Keys

In the Supabase dashboard, go to **Settings → API**:

- Copy **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon / public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Get Your Database Connection Strings

In the Supabase dashboard, go to **Settings → Database → Connection string**:

- Select **URI** tab
- For `DATABASE_URL`: use the **Session mode** connection (port **6543**). Append `?pgbouncer=true` at the end.
- For `DIRECT_URL`: use the **Direct connection** (port **5432**).

They look like:
```
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

> **Tip:** Find both under Settings → Database → Connection string. Switch between "Session mode" and "Transaction mode" tabs.

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all four values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
DATABASE_URL="postgresql://postgres.xxxx:password@...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:password@...pooler.supabase.com:5432/postgres"
```

### 5. Enable Email Auth in Supabase

In Supabase dashboard → **Authentication → Providers**:
- Make sure **Email** is enabled
- For development: disable "Confirm email" (Authentication → Settings → toggle off "Enable email confirmations")

### 6. Push the Database Schema

```bash
npx prisma db push
```

This creates all tables in your Supabase PostgreSQL database. You should see output like:
```
✓ Generated Prisma Client
✓ Your database is now in sync with your Prisma schema.
```

### 7. Create Demo Auth Users in Supabase

Before running the seed, create 4 users in **Supabase → Authentication → Users → Add user**:

| Email | Password | Role |
|-------|----------|------|
| maria@forkcast.ph | password123 | owner |
| carlos@forkcast.ph | password123 | owner |
| ana@example.com | password123 | diner |
| ben@example.com | password123 | diner |

After creating them, copy their **UUIDs** from the Users table.

### 8. Update Seed File with Real UUIDs

Open `prisma/seed.ts` and replace the placeholder UUIDs at the top with the real ones from Supabase:

```ts
const owner1Id = "paste-maria-uuid-here";
const owner2Id = "paste-carlos-uuid-here";
const diner1Id = "paste-ana-uuid-here";
const diner2Id = "paste-ben-uuid-here";
```

### 9. Run the Seed

```bash
npm run db:seed
```

Output:
```
🌱 Seeding Forkcast database...
✅ Seed complete!
```

This creates 3 restaurants, 28 tables, and 25+ reservations for realistic heatmap data.

### 10. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## User Flows

### As a Diner
1. Go to `/signup` → choose "Diner" → create account
2. Browse restaurants at `/restaurants`
3. Click a restaurant → see the heatmap of busy times
4. Click "Make a Reservation" → pick date/time → select table on floor map → confirm
5. View your bookings at `/dashboard`

### As a Restaurant Owner
1. Go to `/signup` → choose "Owner" → create account
2. Set up your restaurant at `/owner/setup` (info + drag-and-drop tables)
3. Monitor live floor map at `/owner/floor`
4. View all reservations at `/owner/reservations`
5. See analytics heatmap at `/owner/insights`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Build for production |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Create a migration file |
| `npm run db:seed` | Seed with demo data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + custom shadcn/ui components
- **Supabase** (Auth + PostgreSQL + Realtime)
- **Prisma** ORM
- **Recharts** for analytics
- **Sonner** for toast notifications

---

## Project Structure

```
app/
  (auth)/login        — Login page
  (auth)/signup       — Signup with role selection
  (diner)/dashboard   — Diner reservations & waitlists
  (diner)/restaurants/[id]/book — 3-step booking flow
  (diner)/reservations/[id]    — Reservation detail
  (owner)/owner/dashboard      — Owner stats overview
  (owner)/owner/setup          — Restaurant & table builder
  (owner)/owner/floor          — Live floor map (Realtime)
  (owner)/owner/reservations   — All reservations + guest profiles
  (owner)/owner/insights       — Heatmap + analytics
  api/                         — API routes
  actions/reservations.ts      — Server actions

components/
  ui/                 — shadcn/ui components
  FloorMap.tsx        — SVG floor map renderer
  TableNode.tsx       — Individual table SVG node
  HeatmapGrid.tsx     — Crowd heatmap grid
  ReservationCard.tsx — Reservation display card
  InsightsCharts.tsx  — Recharts analytics
  Navbar.tsx          — Shared navigation

lib/
  prisma.ts           — Prisma client singleton
  supabase.ts         — Browser Supabase client
  supabase-server.ts  — Server Supabase client
  depositCalculator.ts — Deposit logic
  heatmapUtils.ts     — Heatmap computation

prisma/
  schema.prisma       — Database schema
  seed.ts             — Demo data seed script
```

---

## Realtime Setup (for Live Floor Map)

Supabase Realtime must be enabled for the `Reservation` table. In Supabase:

1. Go to **Database → Replication**
2. Under **Source**, find the `Reservation` table
3. Toggle on **INSERT**, **UPDATE**, **DELETE**

The floor map page (`/owner/floor`) subscribes to these changes automatically.

---

## Troubleshooting

**"Can't reach database"** — Check your `DATABASE_URL` uses port 6543 (pooled) with `?pgbouncer=true`.

**"Invalid API key"** — Make sure `.env.local` has the right Supabase anon key (not the service_role key).

**Seed fails with "unique constraint"** — Run `npx prisma db push --force-reset` then seed again. **Warning:** This deletes all data.

**Auth redirects not working** — In Supabase → Authentication → URL Configuration, add `http://localhost:3000/**` to the allowed redirect URLs.

**Tables not showing on floor map** — Run the seed or go to `/owner/setup` and add tables manually.
