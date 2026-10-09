# VSHN BUILDERS — ARCHITECTURE & DEPLOYMENT GUIDE

## 1. Project Overview & Architecture
VSHN BUILDERS is a full-stack, production-grade web application with a client-facing architectural website and an authenticated Admin Console for content management, image uploads, and customer lead handling.

- **Frontend**: React 19 + TypeScript, Tailwind CSS, Lucide icons, Framer Motion.
- **Backend**: Express API server with PBKDF2 authentication, cryptographic session tokens, persistent file/JSON database, and multipart file upload handling.
- **Brand Identity**: VSHN BUILDERS (Chennai, Tamil Nadu), Taglines: *"Building Dreams. Creating Trust."* & *"YOUR DREAM HOME. OUR RESPONSIBILITY."*
- **Contact Number**: 70925 07374
- **Address**: Near New Washermenpet Metro, Tondiarpet Depot, Chennai - 600081

---

## 2. Mandatory Features
1. **Global Light / Dark Theme**:
   - Compulsory toggle with Sun & Moon icons in the main header and footer.
   - Persists in `localStorage` (`vshn_theme`) and auto-detects system color preferences.
   - Consistently styles both the public website and every Admin Console management screen.

2. **Secure Admin Console**:
   - Direct "Admin" button in header & mobile navigation.
   - Authenticated through `POST /api/auth/login`.
   - Initial demo credentials:
     - **Username**: `harish`
     - **Password**: `vshn1996`
   - Complete content management for Home hero, Projects, Services, Packages (Super ₹2,250, Deluxe ₹2,450, Premium ₹2,650), Testimonials, Media library uploads, and Customer Consultation enquiries.

---

## 3. Environment Variables
Configure the following in `.env` (see `.env.example`):
```env
# Port for Express server
PORT=3000

# Node Environment
NODE_ENV=production

# Initial Admin Credentials (optional overrides)
ADMIN_USERNAME=harish
ADMIN_PASSWORD=vshn1996
```

---

## 4. Deployment to Vercel / Cloud Run / VPS

### Option A: Node.js / Docker / Cloud Run / VPS
```bash
# 1. Install dependencies
npm install

# 2. Build frontend assets
npm run build

# 3. Start production server
npm start
```

### Option B: Vercel Full-Stack Deployment
1. Set the Root Directory to `./`.
2. Build Command: `npm run build`.
3. Output Directory: `dist`.
4. If deploying API routes as Vercel serverless functions, point `/api/*` to the Express backend.

---

## 5. Security & Admin Management
- **Changing Admin Password**:
  1. Log into Admin Console.
  2. Navigate to **Account Security**.
  3. Enter current password and new password (min. 6 characters).
  4. The server creates a fresh 16-byte cryptographic salt and computes PBKDF2 with SHA-512 (10,000 iterations).

- **Backup & Content Restoration**:
  - All content is stored in `./data/content.json`.
  - Customer leads are in `./data/enquiries.json`.
  - Uploaded images are preserved in `./public/uploads/`.
  - To backup: copy `./data/` and `./public/uploads/`.
  - To reset to initial factory defaults: Click **"Reset Demo Defaults"** in the Admin Console.
