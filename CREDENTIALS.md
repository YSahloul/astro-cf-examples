# Credentials

## Payload CMS Admin

URL: https://astro-payload-ecom.agenticflows.workers.dev/admin

### Super Admin (access to all tenants)
- Email: `admin@example.com`
- Password: `Admin123!`

### Storefront Tenant User
- Email: `storefront@example.com`
- Password: `Store123!`
- Tenant: Storefront (ID: 1)

### Auto Shop Tenant User
- Email: `autoshop@example.com`
- Password: `Auto123!`
- Tenant: Auto Shop (ID: 2)

## Live URLs

| App | URL |
|-----|-----|
| Payload Admin | https://astro-payload-ecom.agenticflows.workers.dev/admin |
| Storefront | https://astro-storefront.agenticflows.workers.dev |
| Auto Shop | https://auto-shop-astro.agenticflows.workers.dev |

## Seed Endpoint

To re-seed data:
```bash
curl -X POST "https://astro-payload-ecom.agenticflows.workers.dev/api/seed" \
  -H "x-seed-secret: seed-my-store-2024"
```
