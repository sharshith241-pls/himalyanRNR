# Himalayan Runners

A trek-booking web application for Himalayan Runners — browse treks, book online, and pay via Razorpay.

## Tech Stack

- **Next.js 16** + **React 19** + **TypeScript**
- **Supabase** (PostgreSQL database, authentication, file storage)
- **Razorpay** (payment gateway)
- **Tailwind CSS 4**

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **npm** (comes with Node.js)
- A **Supabase** project (free at [supabase.com](https://supabase.com))
- A **Razorpay** account (for payments)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hr_webapp
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root folder with these values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_or_test_key
RAZORPAY_KEY_ID=rzp_live_or_test_key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Where to find these:**
- **Supabase keys**: Supabase Dashboard → Settings → API
- **Razorpay keys**: Razorpay Dashboard → Settings → API Keys

### 3. Set Up the Database

1. Go to your Supabase Dashboard → **SQL Editor**
2. Open the file `docs/COMPLETE_SUPABASE_SETUP.sql` from this project
3. Copy the entire contents and paste it into the SQL Editor
4. Click **Run** — this creates all tables, indexes, and security policies

### 4. Create a Storage Bucket

1. In Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Name it `trek-images`
4. Set it to **Public** (so images are accessible via URL)

### 5. Create Your Admin Account

1. Start the app and register a new account (or create a user in Supabase → Authentication → Users)
2. Copy the **User ID** (UUID) from Supabase → Authentication → Users
3. Run this SQL in the SQL Editor (replace the placeholders):

```sql
INSERT INTO public.profiles (id, email, full_name, role, approved)
VALUES ('<YOUR_USER_ID>', 'your-email@example.com', 'Your Name', 'admin', true)
ON CONFLICT (id) DO UPDATE SET role = 'admin', approved = true;
```

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use the App

### As a User

1. **Browse treks** — Visit the home page or click "Explore Treks" in the navbar
2. **Filter by category** — Use category tabs (Himalayan Treks, Sunrise Treks, etc.)
3. **View trek details** — Click on any trek card to see the full description, itinerary, and pricing
4. **Apply a coupon** — Enter a coupon code on the trek detail page and click "Apply" to get a discount
5. **Book & pay** — Click the "Pay" button to open Razorpay checkout. Complete the payment
6. **See your booking** — After payment, you'll be redirected to a success page with your booking details

### As an Admin

1. **Access the admin panel** — Go to `/admin` or click "Admin Portal" (visible only to admins)
2. **Dashboard** — See stats: total treks, bookings, guides, and users
3. **Manage Treks** — Add new treks, edit existing ones, upload images, set pricing
4. **View Bookings** — See all bookings with payment status
5. **Manage Coupons** — Create discount coupons with percentage, usage limits, and notes
6. **Manage Guides** — View and manage guide accounts
7. **Logout** — Click the "Logout" button in the dashboard header

### As a Guide

1. **Login** — Go to `/guide/login`
2. **Dashboard** — View your assigned treks at `/guide/dashboard`
3. **Manage Itinerary** — Add day-by-day itinerary details for your treks

---

## Deploying to Production (Vercel)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all the environment variables from `.env.local` to Vercel's project settings (Settings → Environment Variables)
4. Update `NEXT_PUBLIC_SITE_URL` to your production URL (e.g., `https://your-app.vercel.app`)
5. Deploy — Vercel will build and host your app automatically

### After Deploying

- Update your **Supabase redirect URLs**: Supabase Dashboard → Authentication → URL Configuration → add your production URL to "Redirect URLs"
- Update your **Razorpay webhook URL** if using webhooks

---

## Project Structure

See [BRIEF.md](BRIEF.md) for a detailed explanation of every file and folder.

```
hr_webapp/
├── app/                    # All pages and API routes
│   ├── page.tsx            # Home page
│   ├── layout.tsx          # Root layout
│   ├── admin/              # Admin panel (dashboard, treks, bookings, coupons, guides)
│   ├── auth/               # Authentication (login, register, forgot-password, etc.)
│   ├── api/                # Backend API routes (payment, coupons)
│   ├── guide/              # Guide portal (dashboard, trek management)
│   ├── treks/              # Public trek listing and detail pages
│   └── success/            # Payment success page
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── utils/                  # Helper utilities (Supabase clients, auth actions, etc.)
├── docs/                   # SQL setup file for the database
├── public/                 # Static assets (logo, icons)
└── .env.local              # Environment variables (not committed to git)
```

---

## Common Issues

| Problem | Solution |
|---|---|
| "Missing Supabase environment variables" | Check that `.env.local` has the correct keys with no extra quotes |
| RLS policy error when creating coupons | Run the SQL from `docs/COMPLETE_SUPABASE_SETUP.sql` to set up policies |
| Images not uploading | Make sure the `trek-images` Storage bucket exists and is set to public |
| "Invalid login credentials" | Double-check email/password. If using Google auth, ensure it's enabled in Supabase → Authentication → Providers |
| Admin panel shows "not authorized" | Make sure your profile row has `role = 'admin'` and `approved = true` |
