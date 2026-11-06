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
- `ERP_MEDIA_URL`: the base URL the ERP serves product images from (the ERP's `PUBLIC_DISK_URL`), e.g. `https://media.zionankara.com`. These hosts are the only ones `next/image` accepts. Separate several with commas. If unset, it defaults to `https://media.zionankara.com`. It is read when the config loads, so a change needs a dev restart or a rebuild. Under `next dev` only, a `localhost` host is also allowed past Next's private-IP check.
- `CATALOGUE_SOURCE`: `local` (default, bundled data) or `erp`. Matching ignores case and surrounding spaces (`ERP ` works); any other value counts as `local`.
- `REVALIDATE_SECRET`: shared secret the ERP signs change notices with (see [Caching](#caching)). Optional: without it `/api/revalidate` answers `503` and changes appear within about 5 minutes.

With or without `CATALOGUE_SOURCE=erp`, these always come from the ERP when configured: the header contact strip, footer contact and follow links, the Contact page details, and the enquiry topics and form.

`CATALOGUE_SOURCE=erp` switches the home sections, collections, category, product pages and the category row to ERP data. Under `erp`, the bag and checkout show "Online ordering is coming soon".

### Category row under `erp`

The desktop category row below the header shows the category navigation set in the ERP dashboard.

- **The store has no categories:** the row is hidden, and the mobile menu leaves out its category list. The footer's Shop column shows a single **Collections** link, and the home page buttons still lead to the shop. The page may shift up by the row's height once the header finishes loading, because space is reserved for the row while it loads.
- **The ERP is unreachable:** the row shows a single **Collections** link, so shoppers can still browse.
- Changes in the dashboard show up within about 5 minutes (see Caching).

### Before switching CATALOGUE_SOURCE to erp

- [ ] The ERP env (`ERP_API_URL`, `STOREFRONT_SIGNING_SECRET`, `ERP_STOREFRONT_HOST`) is set in Vercel **Production**. `ERP_STOREFRONT_HOST` is the verified live domain. Send one real enquiry from a preview deployment that uses the Production env before promoting.
- [ ] `ERP_MEDIA_URL` in Vercel Production matches the ERP's `PUBLIC_DISK_URL` (e.g. `https://media.zionankara.com`). Product images from any other host are rejected.
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

ERP reads are cached for about 5 minutes. Without a change notice, a dashboard change appears after that window: the first visit after 5 minutes refreshes the data in the background and the visit after it shows the change. A deployment does not clear this either, because the build caches what the ERP returned.

#### Instant updates: `POST /api/revalidate`

The ERP can tell the site what changed, so the change shows on the next page load. Set the same random value as `REVALIDATE_SECRET` in Vercel Production and in the ERP (for example `openssl rand -hex 32`), then have the ERP send this after saving:

```
POST https://www.zionankara.com/api/revalidate
Content-Type: application/json
X-Revalidate-Timestamp: <unix seconds>
X-Revalidate-Signature: <hex HMAC-SHA256 of "<timestamp>.<raw body>" with REVALIDATE_SECRET>

{"type": "category", "slugs": ["gowns"]}
```

| `type` | Send when | Clears |
| --- | --- | --- |
| `store` | Contact details or social links change | Header strip, footer contact, Contact page |
| `category` | A category is created, renamed, reordered, hidden or deleted | Category row, collection tiles, and each category in `slugs` with its listing. After a rename, send the old and new slug |
| `product` | A product is created, edited, priced, restocked, hidden or deleted | Every product listing, and each product page in `slugs` |
| `all` | Bulk imports, or when unsure | Everything read from the ERP |

`slugs` is optional (up to 100). The timestamp must be within 5 minutes of the site's clock. Responses: `200 {"revalidated":[...]}`, `400` bad body, `401` bad or stale signature, `503` `REVALIDATE_SECRET` not set.

Laravel example:

```php
$body = json_encode(['type' => 'category', 'slugs' => [$category->slug]]);
$ts = (string) time();
Http::withHeaders([
    'X-Revalidate-Timestamp' => $ts,
    'X-Revalidate-Signature' => hash_hmac('sha256', "{$ts}.{$body}", config('services.storefront.revalidate_secret')),
])->withBody($body, 'application/json')->timeout(5)->post('https://www.zionankara.com/api/revalidate');
```

Send it after the database change commits (for example from a queued job), and don't fail the dashboard save if the call fails: the 5-minute cache still catches up.

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

In production it is `www.zionankara.com`. The bare `zionankara.com` redirects there, so `www.zionankara.com` is the domain to register and verify in the ERP.

| Value | Valid? |
| --- | --- |
| `shop.localhost` | yes |
| `www.zionankara.com` | yes |
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
   ERP_MEDIA_URL=http://localhost:8000   # where the local ERP serves /storage images
   CATALOGUE_SOURCE=local   # or erp
   ```

4. **Restart `npm run dev`** after any change to these variables. A failed ERP read is cached for about 5 minutes, so the running server keeps showing the old result until you restart it or the cache expires.
5. Check that the contact strip (phone, email, location, social links) appears above the header.

### Production (Vercel)

1. Register the live domain (e.g. `www.zionankara.com`) on the Zion Ankara store. The ERP dashboard has no screen for domains. `php artisan pilot:setup --domain=...` only sets one when it creates a new store. For the existing store, run this on the production ERP:

   ```bash
   php artisan tinker --execute='
   $store = App\Modules\Tenancy\Models\Store::where("slug", "zion-ankara")->firstOrFail();
   app(App\Modules\Tenancy\Actions\AddStoreDomain::class)->handle(
       $store, "www.zionankara.com", App\Modules\Tenancy\Enums\DomainType::Custom, false, true
   );'
   ```

   The last two arguments are `isPrimary` and `verifiedAndActive`. Passing `true` creates the domain active and verified. Run the domain-listing command from the Development steps to confirm it.
2. In Vercel, under Project → Settings → Environment Variables, scope **Production** and set:
   - `ERP_API_URL`: the public ERP origin, e.g. `https://erp.example.com`
   - `STOREFRONT_SIGNING_SECRET`: the same value as the production ERP
   - `ERP_STOREFRONT_HOST`: the live domain from step 1, as a bare hostname
   - `ERP_MEDIA_URL`: the ERP's public image URL, e.g. `https://media.zionankara.com`
   - `CATALOGUE_SOURCE`: `local` or `erp` (read the checklist above before choosing `erp`)
   - `REVALIDATE_SECRET`: the same value the ERP signs change notices with (optional, see [Caching](#caching))
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
