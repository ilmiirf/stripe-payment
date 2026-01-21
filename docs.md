# Technical Integration: Secure Subscription Workflow

**Stack:** Azure AD B2C (Auth), Django (Backend), Next.js (Frontend), Stripe (Payments)

## 1. Executive Summary

The goal of this integration is to synchronize user identity (Azure) with payment status (Stripe) to ensure seamless access to premium features. To achieve 100% data integrity, the system utilizes a **Server-Side Handshake** rather than relying on browser redirects, which are prone to failure.

## 2. System Architecture

Azure AD B2C manages "Who the user is," while Stripe manages "The payment." Our custom API acts as the bridge connecting these two platforms to ensure that every payment is correctly attributed to the right user account.

---

## 3. Core API Components

### Phase 1: Pre-Payment (Checkout Session Handler)

When a user clicks "Subscribe" on the Frontend, the system initiates a secure session.

* **Request:** FE sends a payload `{ "priceID", "planType" }` along with the Azure JWT Token.
* **Logic:** The Backend validates the Azure token and communicates with Stripe to create a **Checkout Session**.
* **Response:** A secure **Stripe Checkout URL**. The FE redirects the user to this hosted page.

### Phase 2: Post-Payment (The Webhook Receiver)

This is the "Source of Truth." Instead of waiting for the user to return to the site, Stripe communicates directly with our server.

* **Logic:** Stripe sends an asynchronous notification (Webhook) to our API.
* **Verification:** The Backend verifies the payment signature to prevent fraud.
* **Database Update:** The API updates the following **Subscription Metadata**:
* **Status:** Changes from `inactive` to `active`.
* **Expiry Date:** Calculated based on the plan duration (e.g., +30 days).
* **Stripe Identifiers:** Saves `stripe_customer_id` for future renewals or refunds.



### Phase 3: Synchronization & Access Control

Once the database is updated, the Frontend must reflect the changes immediately without a re-login.

* **Backend (BE):** Provides a `/api/user/me/` endpoint that returns the latest subscription status directly from the database.
* **Frontend (FE):** Upon returning to the "Success Page," the FE triggers a **Re-fetch** of the user profile. This updates the global state and unlocks premium UI components instantly.

---

## 4. STRIPE ENV

### Frontend Credentials (Public)

| Variable | Where to find it |
| :--- | :--- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Stripe Dashboard > Developers > API keys**. <br> Copy the **Publishable key** (starts with `pk_test_...`). |
| `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` | **Stripe Dashboard > Product Catalog > [Monthly Product]**. <br> Copy the `price_...` ID. |
| `NEXT_PUBLIC_STRIPE_PRICE_YEARLY` | **Stripe Dashboard > Product Catalog > [Yearly Product]**. <br> Copy the `price_...` ID. |

### Backend Credentials (Secret)

| Variable | Where to find it |
| :--- | :--- |
| `STRIPE_SECRET_KEY` | **Stripe Dashboard > Developers > API keys**. <br> Reveal the **Secret key** (starts with `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | **Stripe CLI** (Local) or **Dashboard** (Prod). <br> **Local**: Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copy `whsec_...` from the output. <br> **Prod**: **Developers > Webhooks > Add endpoint**. Reveal the signing secret. |

---

## 5. Conclusion

By implementing this **Three-Way Handshake** (Azure-Django-Stripe), we have eliminated the risk of "lost transactions." The system is now:

1. **Automated:** No manual intervention required to activate features.
2. **Secure:** Uses signed webhooks and validated tokens.
3. **Reliable:** Works even if the user closes their browser mid-transaction.

---