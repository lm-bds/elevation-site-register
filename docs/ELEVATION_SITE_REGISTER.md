# Elevation Built Site Register

URL: https://site-register.ascentlogic.xyz

## Administrator logon

Open `/login` and sign in as `elevation-admin` with the initial password held in the local protected deployment record. Change it immediately when prompted.

## Create and print a site QR

1. Sign in, then open `/site-register`.
2. Enter the site name and address, then choose **Create site QR**.
3. Open the resulting QR link on a phone to confirm it loads.
4. Print that URL as a QR code: use a trusted QR generator, set the QR target to the exact displayed URL, print at least 40 mm square, and include the readable URL below it.
5. Mount the sign at the site entry. Do not reuse a QR between sites.

## Worker sign-on / sign-off

1. Scan the site QR.
2. Enter full name, mobile number, and employing company.
3. Choose **Sign on** on arrival.
4. Scan the same code and choose **Sign off** when leaving.

The system rejects a duplicate open sign-on at the same site. An open session appears as `ON SITE` in the report.

## Attendance reports and invoices

Open `/site-register` while signed in. The table shows each attendance session, site, worker, company, timestamps, and calculated hours. Choose **Export CSV** for the invoice period.

For each invoice line, compare the contractor, worker, date/site, and invoiced hours against the exported hours. Flag an invoice line when the worker is absent from the export, is still marked `ON SITE`, or the invoiced hours do not equal the recorded hours. Keep the exported CSV with the invoice as the reconciliation record.

## Operations

- App user unit: `systemctl --user status elevation-site-register`
- Database: `docker compose --env-file .env -f deploy/postgres.compose.yml ps`
- App health: `curl http://127.0.0.1:4011/api/health`
- Backup: `docker compose --env-file .env -f deploy/postgres.compose.yml exec -T db pg_dump -U elevation elevation_site_register > backup.sql`

Secrets are in `.env` and must not be committed.
