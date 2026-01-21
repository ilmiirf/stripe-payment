# Walkthrough

## Key Features

### 1. Authentication
- Integrated **NextAuth.js** with **Azure AD B2C**.
- Users are automatically synced to the MySQL database on sign-in.
- Session includes `subscriptionStatus` and `planInterval`.
- Source: [route.ts]

### 2. Database
- **Prisma** schema defined with `User` and `Subscription` models.
- Pre-configured for MySQL.
- Source: [schema.prisma]

### 3. Stripe Integration
- **Pricing Page**: Toggle between Monthly/Yearly plans in [Landing Page]
- **Checkout**: Server Action `createCheckoutSession` handles the redirect.
- **Webhooks**: [Webhook Handler] syncs subscriptions to DB.
- **Portal**: "Manage Billing" button in Dashboard redirects to Stripe Customer Portal.

### 4. Middleware & Protection
- Routes under `/dashboard` are protected by `middleware.ts`.
- Dashboard checks for active subscription.

## Setup Instructions

1.  **Environment Variables**:
    -   Rename `.env.example` to `.env`.
    -   Fill in your Azure AD B2C credentials, Stripe keys, and Database URL.

2.  **Database**:
    -   **Important**: Create your database manually first (e.g., using MySQL Workbench, `mysql -u root -p`, or pgAdmin).
        ```sql
        CREATE DATABASE saas;
        ```
    -   Run `npx prisma generate` (to create the client).
    -   Run `npx prisma db push` (to create the tables).

3.  **Stripe**:
    -   Create products in Stripe Dashboard.
    -   Update `monthlyPriceId` and `yearlyPriceId` in `src/app/page.tsx`.
    -   Set up the webhook endpoint (e.g., using Stripe CLI for local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`).

4.  **Run**:
    -   `npm run dev`

## Verification
-   **Sign In**: Verify user is created in DB.
-   **Subscribe**: Complete a test payment and verify `Subscription` record in DB.
-   **Dashboard**: Verify access is granted after payment.
