# Freeman Barbershop: Angular site (Phase 2)

Public website + online booking wizard. Talks to the Laravel API from Phase 1.

## Install
1. Extract this zip.
2. Copy everything over your Angular project (`freeman-barbershop-web`), choosing to replace files:
   `src/` (index.html, styles.scss, app/...) and `public/images/` (logos).
3. Start the Laravel API (`php artisan serve`) in the API folder.
4. In the Angular folder run `npm start` and open http://localhost:4200

API address is set in `src/app/core/config.ts` (default `http://localhost:8000/api`).

## Edit your content
`src/app/core/site-content.ts`: intro text, About story, skills, years of experience, achievements,
and **testimonials** (empty on purpose: add only real reviews). Empty fields are hidden.
Prices, services, hours, address, phone and home-service fee come from the database (admin dashboard in Phase 3).

## Pages
/ (home) · /about · /services · /portfolio · /certifications · /contact · /book · /confirmation · /find-booking

## Notes
- Photos/certificates appear automatically once uploaded through the admin (Phase 3). Until then the site shows tidy placeholders.
- Customer accounts (login, history, cancel/reschedule) and the admin dashboard come in the next phases.
- Fonts load from Google Fonts; the site still works offline with fallback fonts.
