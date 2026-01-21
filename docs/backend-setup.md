# Backend Setup Guide

This guide covers the necessary steps to configure the backend services for your SaaS starter.

## 1. Environment Variables

Ensure your `.env` file is created based on `.env.example`. You will need to fill in the values obtained from the steps below.

```bash
cp .env.example .env
```

---

## 2. Azure AD B2C (Authentication)

We use **NextAuth.js** with the **Azure AD B2C Provider**.

### Step 1: Create a B2C Tenant
1.  Log in to the [Azure Portal](https://portal.azure.com/).
2.  Create a resource > Search for **Azure Active Directory B2C**.
3.  Click **Create** and follow the instructions to create a new tenant (or link an existing one).
4.  **Tenant Name**: This will be the `AZURE_AD_B2C_TENANT_NAME` in your `.env`. (e.g., if your domain is `mycoolsaas.onmicrosoft.com`, the tenant name is `mycoolsaas`).

### Step 2: Register an Application
1.  Switch to your B2C Tenant directory.
2.  Go to **App registrations** > **New registration**.
3.  **Name**: Enter a name (e.g., "SaaS Starter").
4.  **Supported account types**: Select "Accounts in any identity provider or organizational directory (for authenticating users with user flows)".
5.  **Redirect URI**:
    -   Select **Web**.
    -   URL: `http://localhost:3000/api/auth/callback/azure-ad-b2c` (for local development).
    -   *Note: Add your production URL here later (e.g., `https://your-domain.com/api/auth/callback/azure-ad-b2c`).*
6.  Click **Register**.
7.  **Client ID**: Copy the **Application (client) ID** from the Overview page. This is `AZURE_AD_B2C_CLIENT_ID`.

### Step 3: Create Client Secret
1.  In the App Registration menu, go to **Certificates & secrets**.
2.  Click **New client secret**.
3.  Add a description and set expiry.
4.  **Client Secret**: Copy the **Value** (not the ID) immediately. This is `AZURE_AD_B2C_CLIENT_SECRET`.

### Step 4: Create User Flows
1.  Go back to the B2C Tenant "Overview" or search for **Azure AD B2C**.
2.  Go to **User flows** > **New user flow**.
3.  Select **Sign up and sign in**.
4.  **Version**: Recommended (Standard).
5.  **Name**: `sign_up_sign_in` (The full name will be `B2C_1_sign_up_sign_in`). This is `AZURE_AD_B2C_PRIMARY_USER_FLOW`.
6.  **Identity providers**: Select "Email signup".
7.  **User attributes**: Select the attributes you want to collect (e.g., "Display Name", "Email Address").
8.  Click **Create**.

---

## 3. Stripe (Payments)

### Step 1: Account & Keys
> [!NOTE]
> **Test Mode vs Live Mode**:
> - **Test Mode**: Use this for development. Keys start with `pk_test_` and `sk_test_`. Features an orange "Test Mode" toggle in the dashboard. Use [Test Cards](https://stripe.com/docs/testing) (e.g., `4242 4242 4242 4242`) for payments.
> - **Live Mode**: Real payments. Keys start with `pk_live_` and `sk_live_`. Toggle "Test Mode" **OFF** to view these.

1.  Log in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2.  **Enable Test Mode**: Toggle the "Test mode" switch (usually top right) to **ON**.
3.  Go to **Developers** > **API keys**.
4.  **Publishable Key**: Copy to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`).
5.  **Secret Key**: Copy to `STRIPE_SECRET_KEY` (starts with `sk_test_`).

### Context: Frontend Verification
> [!NOTE]
> **CHECKOUT_SESSION_ID**: You might see `{CHECKOUT_SESSION_ID}` in `src/app/actions/stripe.ts`.
> - **Purpose**: This is a template string that Stripe replaces with the real ID upon redirect.
> - **Frontend Use**: This allows your **Frontend** (Success Page) to know which session was just completed. No extra backend implementation is required for this to work.

### Step 2: Create Products
> [!IMPORTANT]
> **Data Isolation**: Products created in Test Mode **do not exist** in Live Mode. When you go to production, you must toggle to Live Mode, recreate your products, and update the Price IDs in your code (or env vars).

1.  Go to **Product catalog**.
2.  Create two products (or two prices for one product):
    -   **Monthly Plan**: $9.00 / Month.
    -   **Yearly Plan**: $99.00 / Year.
3.  Copy the **API ID** for each price (starts with `price_...`).
4.  Update `src/app/page.tsx` with these IDs.

### Step 3: Webhooks
1.  **Local Development**:
    -   Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
    -   Login: `stripe login`.
    -   Listen: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
    -   **Webhook Secret**: Copy the "whsec_..." secret shown in the terminal to `STRIPE_WEBHOOK_SECRET`.

2.  **Production**:
    -   Go to **Developers** > **Webhooks** > **Add endpoint**.
    -   Endpoint URL: `https://your-domain.com/api/webhooks/stripe`.
    -   Events to listen for:
        -   `checkout.session.completed`
        -   `customer.subscription.updated`
        -   `customer.subscription.deleted`
        -   `invoice.payment_succeeded`

---

## 4. Database (MySQL / PostgreSQL)

This project uses **Prisma ORM**.

### Option A: MySQL (Default)
1.  **Install MySQL**: Use [Docker](https://hub.docker.com/_/mysql) or a local installer.
    ```bash
    # Example Docker command
    docker run --name my-saas-db -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=saas -p 3306:3306 -d mysql:8
    ```
2.  **Configure Env**:
    ```env
    DATABASE_URL="mysql://root:secret@localhost:3306/saas"
    ```
3.  **Push Schema**:
    ```bash
    npx prisma db push
    ```

### Option B: PostgreSQL
If you prefer PostgreSQL, follow these steps:

1.  **Update Env**:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/saas"
    ```
2.  **Update Schema**:
    Open `prisma/schema.prisma` and change the provider:
    ```prisma
    datasource db {
      provider = "postgresql" // Changed from "mysql"
      url      = env("DATABASE_URL")
    }
    ```
3.  **Push Schema**:
    ```bash
    npx prisma db push
    ```

---

## 5. Finalize
Once all variables are set:
1.  Generate the Prisma Client: `npx prisma generate`
2.  Start the app: `npm run dev`
