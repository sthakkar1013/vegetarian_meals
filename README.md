# 🍛 Ghar Ka Khana — Fresh Indian Meals Website

A complete website to advertise and manage your daily Indian meals.

## What you get

- **Customer page** — Browse today's meals, order with name/phone/notes
- **Admin dashboard** — Manage meals, view orders & feedback, adjust settings
- **Database** — All orders and meals stored in Supabase
- **Free hosting** — Deployed on Vercel, free forever

---

## 🚀 Deployment — Step by Step

### Step 1 — Set up Supabase database

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click **SQL Editor** in the left sidebar
3. Copy the entire contents of `supabase_setup.sql` and paste it in
4. Click **Run** — this creates all your tables and sample data

### Step 2 — Push this code to GitHub

Open a terminal on your computer and run:

```bash
# Navigate to where you want the project
cd ~/Desktop

# Clone your GitHub repo
git clone https://github.com/sthakkar1013/vegetarian_meals.git
cd vegetarian_meals

# Copy all these project files into the folder, then:
git add .
git commit -m "Initial website setup"
git push origin main
```

### Step 3 — Add environment variables to Vercel

1. Go to [vercel.com](https://vercel.com) and open your project
2. Click **Settings** → **Environment Variables**
3. Add these three variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sepjujspqtjdsabyrpej.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full key) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | `khana123` (change this to your own password!) |

4. Click **Save** then **Redeploy**

### Step 4 — See your website

Your website is live at:
```
https://vegetarian-meals.vercel.app
```
(or whatever Vercel named it — check your Vercel dashboard under Domains)

---

## 📱 How to use it every day

### As a customer (your buyers see this)
- Visit your website URL
- Browse today's meals
- Click **Order Now** → fill in name, phone, any notes → submit

### As admin (only you)
- Go to `yourwebsite.vercel.app/admin`
- Enter password: `khana123` (or whatever you set)
- **Today's Meals tab** — Edit meal names, descriptions, prices, mark as special, enable/disable
- **Orders & Feedback tab** — See all orders with customer notes
- **Settings tab** — Change daily portion limit, default price

### Every morning
1. Go to Admin → Settings → click **Reset for New Day**
2. This clears yesterday's orders and resets sold counts to zero
3. Update your meals for the day if needed

### Adding a special weekend meal
1. Admin → Today's Meals → **Add New Meal**
2. Fill in the details
3. Change **Meal Type** dropdown to **Weekend Special**
4. Click **Save Changes**

---

## 🔑 Changing your admin password

1. Go to Vercel → your project → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_ADMIN_PASSWORD` to your new password
3. Click Save → Redeploy
4. Use the new password next time you log in

---

## 🛠 Making design changes

If you want to change colours, layout, or text:

1. Edit files directly on GitHub (click the file → pencil icon → edit → commit)
2. Vercel will automatically redeploy within 30 seconds
3. No coding knowledge needed for simple text changes

Key files:
- `styles/globals.css` — all colours and styling
- `pages/index.js` — customer-facing page
- `pages/admin.js` — admin dashboard

---

## 📊 Database tables

| Table | What it stores |
|-------|----------------|
| `meals` | All meal details — name, description, price, components, sold count |
| `orders` | Every order placed — customer name, phone, notes, which meal |
| `settings` | Daily limit, default price, currency symbol |

---

## ❓ Troubleshooting

**Website shows "Failed to load meals"**
→ Check your Supabase environment variables in Vercel are correct and redeployed

**Orders not appearing in admin**
→ Run the `supabase_setup.sql` script again to ensure Row Level Security policies are set

**Admin password not working**
→ Check `NEXT_PUBLIC_ADMIN_PASSWORD` in Vercel environment variables

**Sold count not updating**
→ Run the `increment_sold` function part of the SQL script in Supabase SQL Editor
