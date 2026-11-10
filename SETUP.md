# Setting up Poop Scoopin' Boogie

About 30 minutes, one time. Everything here is free.

## 1. Make the database (Supabase)

1. Go to [supabase.com](https://supabase.com), sign up with GitHub, and click **New project**. Name it `poop-scoopin-boogie`, pick a strong database password (save it somewhere), region **Central US**.
2. When it's ready, open **SQL Editor**, click **New query**, paste everything from [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and click **Run**. You should see "Success". Then do the same with [`supabase/migrations/0002_customers.sql`](supabase/migrations/0002_customers.sql).
3. Go to **Authentication → Sign In / Providers** and leave "Allow new users to sign up" **on**. Customers need it to log in with an email link. It's safe: a new login only sees the client record with the same email, and only people in the staff list see the route app.
4. Go to **Authentication → Users → Add user → Create new user**. Add yourself and your mom with email and password. Tick "Auto confirm user".
5. Back in **SQL Editor**, run this once, with your real emails and names:

   ```sql
   insert into public.staff (user_id, name)
   select id, 'Riley' from auth.users where email = 'YOUR_EMAIL';
   insert into public.staff (user_id, name)
   select id, 'Mom' from auth.users where email = 'MOMS_EMAIL';
   ```

6. Go to **Project Settings → API**. Keep this tab open: you need the **Project URL** and the **anon public** key next.

## 2. Turn on the website (GitHub Pages)

1. In this GitHub repo, go to **Settings → Secrets and variables → Actions → Variables** and add two repository variables:
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_ANON_KEY` = the anon public key (this one is safe to be public; the database rules protect your data)
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Go to **Actions → Deploy app → Run workflow**. When it turns green, your app is at
   `https://<your-github-name>.github.io/poop-scoopin-boogie/`.
4. In Supabase, go to **Authentication → URL Configuration**. Set **Site URL** to that app address and add it under **Redirect URLs** too. This is where customer login links send people.

The public website is the app address itself (home page, `#/faq`, `#/signup`). Customers sign up at `.../poop-scoopin-boogie/#/signup`. You and your mom use `.../poop-scoopin-boogie/#/app`. Put that link on your flyers and Google profile. New sign-ups show up at the top of the Clients tab.

## 3. Turn on customer emails (Gmail)

1. Make a business Gmail, for example `poopscoopinboogie@gmail.com`.
2. In that Google account, turn on **2-Step Verification**, then go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) and create an app password named "Scoopin app". Copy the 16 letters.
3. In Supabase, go to **Edge Functions → Secrets** and add:
   - `GMAIL_USER` = the business Gmail address
   - `GMAIL_APP_PASSWORD` = the 16-letter app password
4. In Supabase, go to **Edge Functions → Deploy a new function → Via Editor**. Name it exactly `complete-visit`, paste everything from [`supabase/functions/complete-visit/index.ts`](supabase/functions/complete-visit/index.ts), and click **Deploy**.

## 4. Turn on online payments (Stripe) — later

1. Make a free account at [stripe.com](https://stripe.com) and finish the business details.
2. In Stripe, go to **Settings → Billing → Customer portal** and click **Activate**.
3. Copy your **Secret key** from **Developers → API keys**. In Supabase **Edge Functions → Secrets**, add `STRIPE_SECRET_KEY`.
4. Deploy a new function named exactly `billing-portal` with the code from [`supabase/functions/billing-portal/index.ts`](supabase/functions/billing-portal/index.ts).

Until this is done, the customer page's "Pay or update card" button says online payments are coming soon.

## 5. Put it on your phones

Open the app link on each phone.

- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap the ⋮ menu, then **Add to Home screen** or **Install app**.

Log in with the email and password from step 1.4.
