# Django Backend Setup Guide

If you prefer to use **Django** (Python) for your backend instead of Next.js Server Actions/API Routes, follow this guide.

## 1. Prerequisites
-   Python 3.10+ installed.
-   `pip` package manager.

## 2. Project Initialization

1.  **Create a Virtual Environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  **Install Dependencies**:
    We recommend `django`, `djangorestframework`, `stripe`, `django-environ`, `mysqlclient` (or `psycopg2` for Postgres), and `pyjwt` for auth verification.
    ```bash
    pip install django djangorestframework stripe django-environ mysqlclient pyjwt requests cryptography
    ```

3.  **Start Project**:
    ```bash
    django-admin startproject core .
    python manage.py startapp api
    ```

---

## 3. Configuration

### Settings (`core/settings.py`)

1.  **Environment Variables**:
    Use `django-environ` to read keys.
    ```python
    import environ
    import os

    env = environ.Env()
    environ.Env.read_env()

    SECRET_KEY = env('DJANGO_SECRET_KEY')
    DEBUG = env.bool('DEBUG', default=False)
    # ...
    ```

2.  **CORS**:
    Install `django-cors-headers` and allow your Next.js frontend.
    ```bash
    pip install django-cors-headers
    ```
    In `settings.py`:
    ```python
    INSTALLED_APPS = [..., 'corsheaders']
    MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]
    CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
    ```

3.  **Database**:
    ```python
    DATABASES = {
        'default': env.db('DATABASE_URL') # mysql://user:pass@host:port/db
    }
    ```

---

## 4. Sample .env (Django)

Create a `.env` file in your Django root directory.

```env
# Django
DEBUG=True
DJANGO_SECRET_KEY=django-insecure-change-me-in-prod-!@#$
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Same as Next.js if sharing, but ensure driver compatibility)
# Format: mysql://USER:PASSWORD@HOST:PORT/NAME
DATABASE_URL=mysql://root:secret@localhost:3306/saas

# Azure AD B2C (For Token Verification)
AZURE_TENANT_ID=<your-tenant-id>
AZURE_APP_ID=<your-client-id>
AZURE_B2C_POLICY=B2C_1_sign_up_sign_in

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 5. Implementation Tips

### Authentication (Azure AD B2C)
Since NextAuth handles the frontend login, your Django API just needs to **verify the JWT** sent in the `Authorization: Bearer <token>` header.

1.  User logs in on Next.js.
2.  Next.js calls Django API with Access Token.
3.  Django Middleware/Authentication Class verifies token signature using Azure's JWKS (JSON Web Key Set).
    -   Endpoint: `https://<tenant-name>.b2clogin.com/<tenant-name>.onmicrosoft.com/<policy>/discovery/v2.0/keys`

### Stripe Webhooks
Create a view to handle webhooks, similar to the Next.js route.

```python
import stripe
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, env('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError as e:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        # Handle subscription creation logic
        pass
        
    return HttpResponse(status=200)
```
