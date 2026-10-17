# HudumaLink — Public Service Request System

A responsive mini eCitizen-style public service request portal prototype.

## Included features
- Citizen registration and sign-in
- Submit a request with category, location, description and optional photo
- Tracking number generation and status tracking
- Admin dashboard with search, status filter and status updates
- Analytics for total, pending/open, in-progress and resolved requests
- Responsive mobile and desktop layout
- Help centre and demonstration admin account

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser, or use VS Code's Live Server extension.
3. Register a citizen account to submit a request.
4. Demo administrator:
   - Email: `admin@hudumalink.test`
   - Password: `Admin123!`
5. Sign in as admin and open Dashboard to update statuses.

## Important limitations
This is a front-end demonstration prototype. It stores accounts and requests in browser `localStorage`; it does not use a server or MySQL database. Passwords in this demo are not securely stored. Do not use real citizen data or deploy this prototype as a production service.

For production and assessment of a full-stack PHP/MySQL version:
- Host PHP API endpoints on a PHP-compatible server.
- Use MySQL for users and requests.
- Store passwords with PHP `password_hash()` and verify with `password_verify()`.
- Enforce admin permissions on the server, validate all inputs, limit and validate uploads, and configure CORS/CSRF protection as appropriate.
- Update frontend API calls to point to the hosted backend.
- Add a `.env`/server environment configuration for database secrets; never commit credentials.
