<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# UGC Genius AI 🚀

AI-powered platform untuk membuat UGC (User Generated Content) scripts dari URL produk.

## ✨ Features

- 🔗 **Product Analysis** - Analyze produk dari URL (Tokopedia, Shopee, Amazon)
- 📝 **UGC Script Generator** - Auto-generate script dengan Hook, Body, CTA, dan Scenes
- 🎨 **Cover Image Prompt** - Generate prompt untuk AI image generation
- 🔒 **Secure API Key** - User input API Key, tersimpan lokal di browser
- 🎯 **Multi-Platform** - Optimized untuk TikTok, Reels, Shorts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Gemini API Key dari https://aistudio.google.com/app/apikey

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

4. **Input your Gemini API Key** di halaman app

## 📖 Usage

1. **Input Product URL** - Paste URL produk (Tokopedia, Shopee, Amazon)
2. **Generate AI Insight** - AI akan analyze produk dan identify viral angle
3. **Customize Settings** - Pilih platform, duration, voice style, language
4. **Generate Final Script** - Dapatkan complete UGC script dengan scenes detail
5. **Generate Cover Prompt** - AI generate prompt untuk thumbnail/image
6. **Create Content** - Gunakan script untuk filming!

## 🔒 Security

- ✅ API Key disimpan di **localStorage** browser user
- ✅ **Tidak ada API Key di code** atau environment variables
- ✅ **Tidak ter-commit** ke git
- ✅ Setiap user pakai API Key mereka sendiri

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **AI:** Google Gemini API (@google/generative-ai)
- **Styling:** Tailwind CSS + Custom CSS
- **Deployment:** Vercel

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel

1. Push code ke GitHub
2. Buka https://vercel.com/new
3. Import repository
4. Deploy (tidak perlu environment variables!)

## 📁 Project Structure

```
UGCGenius/
├── App.tsx              # Main React component
├── types.ts             # TypeScript type definitions
├── index.tsx            # Entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
├── vercel.json          # Vercel deployment config
└── services/
    └── geminiService.ts # Gemini AI service functions
```

## 🔑 Getting API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Login dengan Google account
3. Click **"Get API Key"**
4. Copy API Key
5. Paste di app UGC Genius

## ⚠️ Important Notes

- **API Key Quota:** Free tier memiliki limit 15 requests/minute
- **API Key Security:** Jangan share API Key kamu ke orang lain
- **Rotate Key:** Revoke dan buat API Key baru secara berkala

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

---

Made with ❤️ using React + Gemini AI
