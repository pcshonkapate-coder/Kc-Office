# Vercel Production Deployment Guide for Kapate OS

This guide provides the complete, production-ready process for deploying the **Kapate OS Next.js Frontend** to the **Vercel Global Edge Network**.

---

## 🏛️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Users / Clients               │
                      └──────────────────┬─────────────────────┘
                                         │
                    HTTPS (Custom Domain / *.vercel.app)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Vercel Edge Network           │
                      │  (Next.js App Router, SSR, Turbopack)  │
                      └──────────────────┬─────────────────────┘
                                         │
                        REST / JSON (NEXT_PUBLIC_API_URL)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │         FastAPI Backend Engine         │
                      │       (Docker / VPS / Cloud Host)      │
                      └────────────────────────────────────────┘
```

---

## 🚀 Deployment Methods

### Method 1: Git Integration (Recommended)

Connecting your repository directly to Vercel provides automatic CI/CD preview deployments for pull requests and instant production deployments on every merge to `main`.

1. **Import Repository**:
   - Navigate to [vercel.com/new](https://vercel.com/new).
   - Authorize your GitHub / GitLab account and select the **Kapate_Consultancy** repository.

2. **Configure Project Settings**:
   - **Framework Preset**: `Next.js` (automatically detected).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `pnpm build` or `next build` (default).
   - **Output Directory**: `.next` (default).
   - **Install Command**: `pnpm install` (default).

3. **Configure Environment Variables**:
   Under **Environment Variables**, add the following:

   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://api.kapateconsultancy.com` | Production FastAPI backend URL |
   | `NEXT_PUBLIC_APP_NAME` | `Kapate OS` | System title |
   | `NEXT_PUBLIC_COMPANY_NAME` | `Kapate Consultancy` | Corporate entity name |
   | `NEXT_PUBLIC_WEBSITE_URL` | `https://kapateconsultancy.com` | Marketing website URL |

4. **Deploy**:
   - Click **Deploy**.
   - Vercel will build and launch your application globally in seconds with a `*.vercel.app` URL.

---

### Method 2: Deploying via Vercel CLI

You can also deploy directly from your local terminal using the Vercel CLI without manual dashboard setup.

1. **Log in to Vercel**:
   ```bash
   pnpm dlx vercel login
   ```

2. **Preview Deployment (Staging / Verification)**:
   ```bash
   pnpm dlx vercel
   ```
   Follow the interactive prompts to link your project. Vercel will generate an instant preview URL.

3. **Production Deployment**:
   ```bash
   pnpm dlx vercel --prod
   ```

---

## 🔒 Security Headers (`vercel.json`)

The project includes a root [vercel.json](file:///c:/Users/shonk/Desktop/Kapate_Consultancy/vercel.json) that automatically applies enterprise-grade security headers to all responses served by Vercel:

- **`X-Content-Type-Options: nosniff`**: Prevents MIME type sniffing.
- **`X-Frame-Options: SAMEORIGIN`**: Protects against clickjacking.
- **`X-XSS-Protection: 1; mode=block`**: Enables cross-site scripting filter.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Protects sensitive path information in referrers.
- **`Strict-Transport-Security`**: Enforces HTTPS connections across all subdomains.
- **`Permissions-Policy`**: Restricts sensitive browser features (camera, microphone, geolocation).

---

## 🌐 Custom Domains & DNS Configuration

To link your official corporate domain (e.g. `os.kapateconsultancy.com`):

1. Go to your project dashboard on Vercel: **Settings** → **Domains**.
2. Add your domain: `os.kapateconsultancy.in`.
3. Configure your DNS provider with the records shown by Vercel:
   - **CNAME Record**:
     - **Name**: `os`
     - **Target**: `cname.vercel-dns.com`
4. Vercel will automatically provision and renew a free SSL/TLS certificate with zero downtime.

---

## 🔗 Backend CORS Configuration

Ensure your FastAPI backend allows requests from your Vercel domains. In your backend `.env` or `docker-compose.yml`:

```env
BACKEND_CORS_ORIGINS=["https://os.kapateconsultancy.in","https://kapateconsultancy.in","https://kapate-os.vercel.app","http://localhost:3000"]
```
