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
- `CATALOGUE_SOURCE`: `local` (default, bundled data) or `erp`. Any other value counts as `local`.

With or without `CATALOGUE_SOURCE=erp`, these always come from the ERP when configured: the header contact strip, footer contact and follow links, the Contact page details, and the enquiry topics and form.

`CATALOGUE_SOURCE=erp` switches the home sections, collections, category, product pages and the category row to ERP data. Under `erp`, the bag and checkout show "Online ordering is coming soon".

### Cutover to the ERP catalogue

1. In the ERP, run `php artisan catalogue:seed-starter <store>` and `php artisan pilot:seed-contact-topics <store>` for the existing store.
2. Staff load the catalogue, set the category navigation and enter the contact details in the dashboard.
3. In Vercel, set `CATALOGUE_SOURCE=erp`.
4. Redeploy.

### Caching

ERP reads are cached for about 5 minutes. Dashboard changes appear on the site within about 5 minutes. There is no on-demand revalidation yet.

### Without ERP configuration

The site still builds and runs. The contact strip and contact details are hidden.

### Enquiry form and proxies

The enquiry form uses the first `x-forwarded-for` entry as the shopper IP. Vercel sets this header correctly. Behind any other proxy, make sure it overwrites `x-forwarded-for` rather than appending to it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
