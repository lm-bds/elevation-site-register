# Elevation Built Site Register

URL: https://site-register.ascentlogic.xyz

## Administrator logon

Open `/login` and sign in as `elevation-admin` with the initial password held in the local protected deployment record. Change it immediately when prompted.

## Create and print a site QR

1. Sign in, then open `/site-register`.
2. Enter the site name and address, then choose **Create site QR**.
3. Click **Open branded A4 QR sign** for that site.
4. Confirm the live QR renders, then choose **Print this A4 sign**. The print page is single-page, carries Elevation Built styling, the site/address, the actual QR image, readable fallback URL, sign-on instructions, and its invoice-audit purpose.
5. Mount the sign at the site entry. Do not reuse a QR between sites.

## Worker sign-on / sign-off

1. Scan the site QR.
2. Enter full name, mobile number, and employing company.
3. Choose **Sign on** on arrival.
4. Scan the same code and choose **Sign off** when leaving.

The system rejects a duplicate open sign-on at the same site. An open session appears as `ON SITE` in the report.

## Attendance reports and invoices

Open `/site-register` while signed in. The table shows each attendance session, site, worker, company, timestamps, and calculated hours. Choose **Export CSV** for the invoice period.

For an automatic line-by-line comparison, open `/site-register/invoice` while signed in and paste invoice CSV using this exact header and one line per billed worker/day/site:

```text
company,worker,site,date,hours
Acme Interiors,Jane Smith,North Terrace Fitout,2026-11-05,7.5
```

The result reports `MATCH`, `VARIANCE`, `NO_ATTENDANCE`, or `OPEN_SESSION`, along with recorded hours and the invoice-hour variance. Keep the exported attendance CSV and comparison output with the invoice as the reconciliation record.

## Operations

- App user unit: `systemctl --user status elevation-site-register`
- Database: `docker compose --env-file .env -f deploy/postgres.compose.yml ps`
- App health: `curl http://127.0.0.1:4011/api/health`
- Backup: `docker compose --env-file .env -f deploy/postgres.compose.yml exec -T db pg_dump -U elevation elevation_site_register > backup.sql`

Secrets are in `.env` and must not be committed.
