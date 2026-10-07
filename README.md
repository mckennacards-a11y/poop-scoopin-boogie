# Poop Scoopin' Boogie

The route app for Poop Scoopin' Boogie, a pet waste removal business in Tyler, Texas.

- **Today:** the yards due today in route order, a "Next house" button that opens Google Maps, and a call list of paused clients.
- **Job:** address, gate code, dogs, and instructions, an SOP checklist, and required yard and latched-gate photos. Completing the job emails the customer both photos.
- **Clients:** contact info, yard access, dogs, plan, payment status, notes, and visit history.
- **SOPs:** safety and cleaning steps.

Setup: see [SETUP.md](SETUP.md).

## Stack

React + Vite on GitHub Pages, Supabase (login, Postgres, photo storage, edge function), Gmail SMTP for customer emails.

```sh
npm install
npm test
npm run dev   # needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
```

## Coming next

- Route optimization with the Google Maps Routes API
- Stripe monthly autopay, with automatic pause after 7 days unpaid
