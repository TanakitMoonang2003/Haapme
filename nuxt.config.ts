import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  modules: ['@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      Kanit: true
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  runtimeConfig: {
    // Server-only secrets (never sent to browser)
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hbdtome',
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'dev-secret-change-in-production',
    paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
    promptpayId: process.env.PROMPTPAY_ID || '',
    // AES-256-GCM key สำหรับเข้ารหัสเบอร์พร้อมเพย์ (32 bytes = 64 hex chars)
    // สร้างด้วย: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    promptpayEncryptionKey: process.env.PROMPTPAY_ENCRYPTION_KEY || '',
    // Public config (exposed to browser)
    public: {
      appName: 'A Little Wish',
      maxMessageLength: 500,
      paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
    }
  }
})
