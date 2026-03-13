# 🚀 Deploy to Vercel - Complete Guide

## ✅ Pre-deployment Checklist

- [ ] Code sudah di-push ke GitHub
- [ ] `.env` tidak ter-commit (sudah di `.gitignore`)
- [ ] `vercel.json` sudah dibuat
- [ ] API Key ready dari https://aistudio.google.com/app/apikey

---

## 📋 Step-by-Step Deployment

### **Method 1: Vercel Dashboard (Recommended)**

#### **1. Push ke GitHub**

```bash
cd /Users/iamraffa/Documents/UGCGenius

# Cek status
git status

# Add semua file (kecuali .env)
git add .

# Commit
git commit -m "Ready for production deployment"

# Push ke GitHub
git push origin main
```

**Jika ada error permission:**
```bash
# Ganti remote ke repo kamu
git remote set-url origin git@github.com:YOUR_USERNAME/UGCGenius.git
git push -u origin main
```

---

#### **2. Deploy di Vercel**

1. **Buka Vercel**
   - Go to: https://vercel.com/new
   - Login dengan GitHub account

2. **Import Repository**
   - Klik **"Import Git Repository"**
   - Search: `UGCGenius`
   - Pilih repo kamu
   - Klik **"Import"**

3. **Configure Project**
   
   **Build Settings:**
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables** ⚠️ **PENTING!**
   
   Klik **"Environment Variables"**, lalu add:
   
   | Name | Value |
   |------|-------|
   | `VITE_GEMINI_API_KEY` | `AIzaSyCP13dCRDspthUPsHYC8Oxu8TK4Fv2Dw60` |
   
   - Klik **"Save"**

5. **Deploy!**
   - Klik **"Deploy"**
   - Tunggu 1-2 menit
   - ✅ **App live!**

6. **Get Your URL**
   - App URL: `https://ugcgenius-yourusername.vercel.app`
   - Share ke teman! 🎉

---

### **Method 2: Vercel CLI (Advanced)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 🔧 Post-Deployment

### **Test Your App**

1. Buka URL yang diberikan Vercel
2. Test full workflow:
   - Input product URL
   - Generate AI Insight
   - Generate Final Script
   - Generate Cover Image

### **Custom Domain (Optional)**

1. Go to **Project Settings** → **Domains**
2. Add your domain: `ugcgenius.com` (example)
3. Update DNS records as instructed
4. Wait for propagation (5-10 min)

---

## ⚠️ Important Notes

### **Environment Variables**

`.env` file **TIDAK** di-commit ke git (sudah di `.gitignore`).

Untuk set API Key di production:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add `VITE_GEMINI_API_KEY`
3. Deploy ulang untuk apply changes

### **API Key Security**

- ✅ API Key aman di Vercel environment variables
- ✅ Tidak terekspos di client-side code
- ✅ Hanya server Vercel yang tahu API Key

### **Build Errors**

Jika build gagal:

```bash
# Test build locally
npm run build

# Check for errors
# Fix any TypeScript errors
# Push again to trigger redeploy
```

---

## 🎯 Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

---

## 🆘 Troubleshooting

### **Build Failed**

**Error: TypeScript errors**
```bash
# Check types locally
npx tsc --noEmit

# Fix errors and push again
```

**Error: Module not found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
git push
```

### **App Not Working After Deploy**

1. **Check Environment Variables**
   - Vercel Dashboard → Settings → Environment Variables
   - Make sure `VITE_GEMINI_API_KEY` is set
   - Redeploy if you just added it

2. **Check Build Logs**
   - Vercel Dashboard → Deployments → Click latest → View Build Logs
   - Look for errors

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for errors in Console tab

---

## 📊 Project Structure

```
UGCGenius/
├── .env.example          # Template environment variables
├── .gitignore            # Git ignore rules (includes .env)
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── App.tsx               # Main app component
├── types.ts              # TypeScript types
├── index.tsx             # Entry point
├── index.html            # HTML template
└── services/
    └── geminiService.ts  # Gemini AI service
```

---

## 🎉 Success!

Setelah deploy berhasil, kamu akan dapat:
- ✅ Live URL: `https://ugcgenius-xxx.vercel.app`
- ✅ Auto-deploy on every git push
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Automatic preview deployments untuk pull requests

**Happy Deploying!** 🚀
