# Environment Setup Guide

This guide maps each environment variable in your `.env` file to the specific steps required to retrieve it.

## Azure AD B2C

| Variable | Where to find it |
| :--- | :--- |
| `AZURE_AD_B2C_TENANT_NAME` | **Azure Portal > Azure AD B2C > Overview**. <br> Use the first part of your domain name (e.g., `contoso` from `contoso.onmicrosoft.com`). |
| `AZURE_AD_B2C_CLIENT_ID` | **Azure AD B2C > App registrations > [Your App] > Overview**. <br> Copy the **Application (client) ID**. |
| `AZURE_AD_B2C_CLIENT_SECRET` | **Azure AD B2C > App registrations > [Your App] > Certificates & secrets**. <br> You must create a new client secret. Copy the **Value** immediately (you won't see it again). |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | **Azure AD B2C > User flows**. <br> Copy the name of your flow, usually `B2C_1_sign_up_sign_in`. |

## Google Auth (Optional)

| Variable | Where to find it |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` | **Google Cloud Console > APIs & Services > Credentials**. <br> Create OAuth 2.0 Client ID. set **Authorized redirect URIs** to `http://localhost:3000/api/auth/callback/google`. |
| `GOOGLE_CLIENT_SECRET` | **Google Cloud Console**. <br> Copy the secret from the creation dialog. |

## GitHub Auth (Optional)

| Variable | Where to find it |
| :--- | :--- |
| `GITHUB_ID` | **GitHub Developer Settings > OAuth Apps > New OAuth App**. <br> **Homepage URL**: `http://localhost:3000`. <br> **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`. <br> Copy **Client ID**. |
| `GITHUB_SECRET` | **GitHub OAuth App**. <br> Generate a new **Client Secret**. |

### Important Steps for Azure
1.  **Redirect URI**: Ensure you added `http://localhost:3000/api/auth/callback/azure-ad-b2c` in **App registrations > Authentication**.
2.  **Implicit Grant**: Ensure "ID tokens" seems unchecked (NextAuth uses Authorization Code flow with PKCE by default), but sometimes "Access tokens" and "ID tokens" are needed depending on configuration. For this setup, standard defaults usually work, but check **Authentication > Implicit grant and hybrid flows** if you have issues.

---

## Stripe

| Variable | Where to find it |
| :--- | :--- |
| `STRIPE_SECRET_KEY` | **Stripe Dashboard > Developers > API keys**. <br> Reveal the **Secret key** (starts with `sk_test_...`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Stripe Dashboard > Developers > API keys**. <br> Copy the **Publishable key** (starts with `pk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | **Stripe CLI** (Local) or **Dashboard** (Prod). <br> **Local**: Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copy `whsec_...` from the output. <br> **Prod**: **Developers > Webhooks > Add endpoint**. Reveal the signing secret. |
| `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` | **Stripe Dashboard > Product Catalog > [Monthly Product]**. <br> Copy the `price_...` ID. |
| `NEXT_PUBLIC_STRIPE_PRICE_YEARLY` | **Stripe Dashboard > Product Catalog > [Yearly Product]**. <br> Copy the `price_...` ID. |

---

## Database

| Variable | Instruction |
| :--- | :--- |
| `DATABASE_URL` | Connection string for your database. <br> **MySQL**: `mysql://<user>:<password>@<host>:<port>/<db_name>` <br> **PostgreSQL**: `postgresql://<user>:<password>@<host>:<port>/<db_name>` |

---

## App

| Variable | Value |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (Local) or `https://your-domain.com` (Prod) |
| `NEXTAUTH_URL` | `http://localhost:3000` (Local) or `https://your-domain.com` (Prod) |
| `NEXTAUTH_SECRET` | Generate a random string. Run in terminal: `openssl rand -base64 32` or just smash your keyboard (for dev). |
