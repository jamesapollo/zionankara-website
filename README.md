This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Connecting to the ERP

The storefront reads catalogue, navigation and contact data from the ERP when configured. Copy `.env.example` to `.env.local` for local development.

### Environment variables

All of these are server-only. Never prefix them with `NEXT_PUBLIC_`.

- `ERP_API_URL`: the ERP origin only, e.g. `https://erp.example.com`. Any path is dropped.
- `STOREFRONT_SIGNING_SECRET`: the same value as the ERP's `STOREFRONT_SIGNING_SECRET`.
- `ERP_STOREFRONT_HOST`: the customer-facing hostname the ERP uses to resolve the store. Required for cached catalogue reads. Production sets it to the live domain, which must be a verified store domain in the ERP. Local dev uses a domain registered in the ERP.
- `CATALOGUE_SOURCE`: `local` (default, bundled data) or `erp`. Matching ignores case and surrounding spaces (`ERP ` works); any other value counts as `local`.

With or without `CATALOGUE_SOURCE=erp`, these always come from the ERP when configured: the header contact strip, footer contact and follow links, the Contact page details, and the enquiry topics and form.

`CATALOGUE_SOURCE=erp` switches the home sections, collections, category, product pages and the category row to ERP data. Under `erp`, the bag and checkout show "Online ordering is coming soon".

### Before switching CATALOGUE_SOURCE to erp

- [ ] The ERP env (`ERP_API_URL`, `STOREFRONT_SIGNING_SECRET`, `ERP_STOREFRONT_HOST`) is set in Vercel **Production**. `ERP_STOREFRONT_HOST` is the verified live domain. Send one real enquiry from a preview deployment that uses the Production env before promoting.
- [ ] The ERP's `PUBLIC_DISK_URL` serves images from `media.zionankara.co.ke`, the only host in `images.remotePatterns`.
- [ ] Use a remote/shared cache handler (`'use cache: remote'`) for the ERP readers before high traffic. The default in-memory cache is per instance and ERP reads fan out per request.
- [ ] The ERP is reachable during deploys. A failed nav or strip read is cached for about 5 minutes.
- [ ] Legacy local slugs (e.g. `/collections/gowns`, `/products/<local-slug>`) are redirected to their ERP equivalents in `next.config` redirects, or the ERP slugs match them.
- [ ] ERP env is scoped so preview deployments do not post enquiries into the live inbox (or previews point at a test store).

### Cutover to the ERP catalogue

1. In the ERP, run `php artisan catalogue:seed-starter <store>` and `php artisan pilot:seed-contact-topics <store>` for the existing store.
2. Staff load the catalogue, set the category navigation and enter the contact details in the dashboard.
3. In Vercel, set `CATALOGUE_SOURCE=erp`.
4. Redeploy.

### Caching

ERP reads are cached for about 5 minutes. Dashboard changes appear on the site within about 5 minutes. There is no on-demand revalidation yet.

### Without ERP configuration

Under `CATALOGUE_SOURCE=local` (the default) the site still builds and runs without ERP configuration. The contact strip and contact details are hidden, and the Contact page shows "Our contact form is unavailable right now" in place of the form. Under `erp`, the ERP must be configured.

### Enquiry form and proxies

The enquiry form uses the first `x-forwarded-for` entry as the shopper IP. Vercel sets this header correctly. Behind any other proxy, make sure it overwrites `x-forwarded-for` rather than appending to it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The ERP finds the store from `ERP_STOREFRONT_HOST`. The value must exactly match a store domain in the ERP, and that domain must be **active** and **verified** and belong to an **active** store. If it doesn't match, every ERP call returns `404 {"message":"Store not found."}`. The site keeps working, but the header contact strip, the footer contact details and the Contact page form quietly disappear.

`ERP_STOREFRONT_HOST` is a **bare hostname**: no scheme, no port, no path.

| Value | Valid? |
| --- | --- |
| `shop.localhost` | yes |
| `zionankara.co.ke` | yes |
| `localhost` | only if the ERP has a `localhost` domain (it normally doesn't) |
| `http://localhost:8000` | no, this is a URL |

### Development

1. Start the ERP API (`commerce-erp-api`, served on `http://localhost:8000`).
2. List the store domains the ERP knows about. Run this from the ERP project:

   ```bash
   php artisan tinker --execute='foreach (App\Modules\Tenancy\Models\StoreDomain::with("store")->get() as $d) echo $d->hostname, " | ", $d->status->value, " | ", $d->verification_status->value, " | ", $d->store?->name, PHP_EOL;'
   ```

   Pick the Zion Ankara domain that is `active | verified`, e.g. `shop.localhost`.
3. Set `.env.local` (or `.env`):

   ```bash
   ERP_API_URL=http://localhost:8000
   STOREFRONT_SIGNING_SECRET=<same value as the ERP's STOREFRONT_SIGNING_SECRET>
   ERP_STOREFRONT_HOST=shop.localhost
   CATALOGUE_SOURCE=local   # or erp
   ```

4. **Restart `npm run dev`** after any change to these variables. A failed ERP read is cached for about 5 minutes, so the running server keeps showing the old result until you restart it or the cache expires.
5. Check that the contact strip (phone, email, location, social links) appears above the header.

### Production (Vercel)

1. Register the live domain (e.g. `zionankara.co.ke`) on the Zion Ankara store. The ERP dashboard has no screen for domains. `php artisan pilot:setup --domain=...` only sets one when it creates a new store. For the existing store, run this on the production ERP:

   ```bash
   php artisan tinker --execute='
   $store = App\Modules\Tenancy\Models\Store::where("slug", "zion-ankara")->firstOrFail();
   app(App\Modules\Tenancy\Actions\AddStoreDomain::class)->handle(
       $store, "zionankara.co.ke", App\Modules\Tenancy\Enums\DomainType::Custom, false, true
   );'
   ```

   The last two arguments are `isPrimary` and `verifiedAndActive`. Passing `true` creates the domain active and verified. Run the domain-listing command from the Development steps to confirm it.
2. In Vercel, under Project → Settings → Environment Variables, scope **Production** and set:
   - `ERP_API_URL`: the public ERP origin, e.g. `https://erp.example.com`
   - `STOREFRONT_SIGNING_SECRET`: the same value as the production ERP
   - `ERP_STOREFRONT_HOST`: the live domain from step 1, as a bare hostname
   - `CATALOGUE_SOURCE`: `local` or `erp` (read the checklist above before choosing `erp`)
3. Scope **Preview** to a test store, or leave the ERP vars unset there, so previews don't send enquiries to the live inbox.
4. Redeploy. Env changes only take effect on a new deployment.
5. On the live site, check the contact strip, the footer contact details and the Contact page form. Then send one test enquiry.

### Troubleshooting: contact strip or contact form missing

- Look in the server or Vercel function logs for `[header] store contact unavailable`. It is logged **once per server process**, so check the first request after start-up.
- `Store not found.` means `ERP_STOREFRONT_HOST` doesn't match an active, verified domain. Fix the value (bare hostname) or register the domain in the ERP.
- `401` means the request signature was rejected. Check that `STOREFRONT_SIGNING_SECRET` matches the ERP exactly.
- `ERP request failed` or `timed out` means the ERP isn't reachable at `ERP_API_URL`.
- The ERP store also needs contact details entered in the dashboard. If the phone, email, location and socials are all empty, the strip renders nothing.
- After fixing anything, restart the dev server or redeploy. Otherwise wait about 5 minutes for the cached failure to expire.
