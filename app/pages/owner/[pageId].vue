<script setup lang="ts">
import { useBirthdayPage } from '../../composables/useBirthdayPage'
import { useOwnerDraw } from '../../composables/useOwnerDraw'

const route = useRoute()
const pageId = computed(() => route.params.pageId as string)

useHead({ title: 'หน้าเจ้าของวันเกิด — A Little Wish' })

const { loading: pageLoading, error: pageError, page, loadPage, getOwnerToken } = useBirthdayPage()

const ownerToken = ref<string | null>(null)
const tokenConfirmed = ref(false)
const { loading, error, drawResult, draw } = useOwnerDraw(pageId, ownerToken)
const showGiftDetails = ref(false)

watch(
  () => drawResult.value?.card?.id,
  () => {
    showGiftDetails.value = false
  }
)

// =====================================================
// ✨ ระบบสุ่มแบบอลังการ: สับไพ่ → นับถอยหลัง → เปิดการ์ด + confetti
// =====================================================
interface ConfettiPiece {
  id: number
  dx: number
  dy: number
  rot: number
  size: number
  delay: number
  duration: number
  color: string
  round: boolean
}

const drawing = ref(false)
const revealKey = ref(0)
const stageTextIndex = ref(0)
const confetti = ref<ConfettiPiece[]>([])
const flash = ref(false)

const stageTexts = [
  'กำลังสับไพ่...',
  'คำอวยพรกำลังเต้นรำกันอยู่ 💃',
  'จักรวาลกำลังเลือกใบที่ใช่...',
  'ใกล้แล้ว ใจเย็นๆ...',
  'พร้อมหรือยัง? 🎉',
]

const stageText = computed(() => stageTexts[stageTextIndex.value % stageTexts.length])

const CONFETTI_COLORS = ['#f5b942', '#f28fa8', '#ffd9a0', '#7fd1c1', '#ffffff', '#c79a6b', '#ff7a59']

let textTimer: ReturnType<typeof setInterval> | null = null
let confettiTimer: ReturnType<typeof setTimeout> | null = null
let flashTimer: ReturnType<typeof setTimeout> | null = null

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function burstConfetti() {
  if (prefersReducedMotion()) return
  const pieces: ConfettiPiece[] = []
  for (let i = 0; i < 110; i++) {
    const angle = Math.random() * Math.PI * 2
    const power = 25 + Math.random() * 55 // หน่วย vmin
    pieces.push({
      id: Date.now() + i,
      dx: Math.cos(angle) * power,
      dy: Math.sin(angle) * power - 18,
      rot: (Math.random() - 0.5) * 1440,
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.15,
      duration: 2.2 + Math.random() * 1.6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      round: Math.random() > 0.65,
    })
  }
  confetti.value = pieces
  if (confettiTimer) clearTimeout(confettiTimer)
  confettiTimer = setTimeout(() => {
    confetti.value = []
  }, 4800)
}

async function spectacularDraw() {
  if (drawing.value) return
  const reduced = prefersReducedMotion()
  drawing.value = true
  showGiftDetails.value = false
  stageTextIndex.value = 0

  if (textTimer) clearInterval(textTimer)
  textTimer = setInterval(() => {
    stageTextIndex.value++
  }, 650)

  // รอให้ครบเวลาอย่างน้อย ~2.8 วิ เพื่อให้ความตื่นเต้นได้เต็มที่
  // (ถ้า API ช้ากว่านั้นก็รอตาม API)
  const minWait = new Promise<void>((resolve) => setTimeout(resolve, reduced ? 300 : 2800))
  await Promise.all([draw(), minWait])

  if (textTimer) {
    clearInterval(textTimer)
    textTimer = null
  }
  drawing.value = false

  if (drawResult.value?.card && !error.value) {
    revealKey.value++
    flash.value = true
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => {
      flash.value = false
    }, 700)
    burstConfetti()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 40, 70])
    }
  }
}

onBeforeUnmount(() => {
  if (textTimer) clearInterval(textTimer)
  if (confettiTimer) clearTimeout(confettiTimer)
  if (flashTimer) clearTimeout(flashTimer)
})

// --- ส่วนกรอกพร้อมเพย์ ---
const hasPromptpay = ref(false)
const showPromptpayForm = ref(false)
const promptpayPhone = ref('')
const promptpayLoading = ref(false)
const promptpayError = ref('')
const promptpaySaved = ref(false)

async function checkPromptpay() {
  try {
    const res = await $fetch<{ hasPromptpay: boolean }>(
      `/api/pages/${pageId.value}/has-promptpay`
    )
    hasPromptpay.value = res.hasPromptpay
  } catch {
    hasPromptpay.value = false
  }
}

async function savePromptpay() {
  if (!ownerToken.value) return
  promptpayError.value = ''
  promptpayLoading.value = true
  try {
    await $fetch(`/api/pages/${pageId.value}/promptpay`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken.value}` },
      body: { promptpayId: promptpayPhone.value },
    })
    hasPromptpay.value = true
    showPromptpayForm.value = false
    promptpaySaved.value = true
    promptpayPhone.value = ''
  } catch (e: unknown) {
    promptpayError.value =
      (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาด'
  } finally {
    promptpayLoading.value = false
  }
}

// --- init ---
async function init() {
  await loadPage(pageId.value)
  const stored = getOwnerToken(pageId.value)
  if (stored) {
    ownerToken.value = stored
    tokenConfirmed.value = true
    await Promise.all([spectacularDraw(), checkPromptpay()])
  }
}

onMounted(init)

async function handleTokenConfirmed(token: string) {
  ownerToken.value = token
  tokenConfirmed.value = true
  if (typeof window !== 'undefined') {
    localStorage.setItem(`hbdtome:owner:${pageId.value}`, token)
  }
  await Promise.all([spectacularDraw(), checkPromptpay()])
  if (error.value && error.value.includes('token')) {
    tokenConfirmed.value = false
    ownerToken.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`hbdtome:owner:${pageId.value}`)
    }
  }
}
</script>

<template>
  <div class="birthday-background">
    <!-- แสงวาบตอนเปิดการ์ด -->
    <div v-if="flash" class="screen-flash" aria-hidden="true" />

    <!-- Confetti -->
    <div class="confetti-layer" aria-hidden="true">
      <span
        v-for="p in confetti"
        :key="p.id"
        class="confetti-piece"
        :class="{ round: p.round }"
        :style="{
          '--dx': p.dx + 'vmin',
          '--dy': p.dy + 'vmin',
          '--rot': p.rot + 'deg',
          width: p.size + 'px',
          height: (p.round ? p.size : p.size * 0.5) + 'px',
          backgroundColor: p.color,
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
        }"
      />
    </div>

    <div class="mx-auto max-w-lg px-4 py-12">
      <div v-if="pageLoading" class="text-center text-sm text-[#8C7868]">กำลังโหลด...</div>
      <div v-else-if="pageError" class="rounded-lg border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600">
        {{ pageError }}
      </div>

      <template v-else-if="page">
        <!-- Header -->
        <div class="mb-6 text-center">
          <div class="mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
            <span class="dot" />
            <span class="text-xs tracking-widest text-[#8C7868]">OWNER VIEW</span>
          </div>
          <h1 class="font-playfair text-4xl text-[#49382f]">{{ page.displayName }}</h1>
          <p v-if="page.daysUntilBirthday === 0" class="mt-1 text-xs text-emerald-600 font-semibold">
            🎂 วันนี้คือวันเกิดของคุณ!
          </p>
          <p v-else class="mt-1 text-xs text-[#b8a697]">อีก {{ page.daysUntilBirthday }} วันถึงวันเกิด</p>
        </div>

        <!-- ยังไม่ authed -->
        <div v-if="!tokenConfirmed">
          <OwnerTokenInput @confirmed="handleTokenConfirmed" />
          <div v-if="error" class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            ❌ {{ error }}
          </div>
        </div>

        <!-- Authed -->
        <template v-else>

          <!-- ====== ส่วนพร้อมเพย์ ====== -->
          <div class="mb-6 rounded-lg border border-[#eee6dc] bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-[#49382f]">💳 รับกำลังใจเป็นเงิน</p>
                <p v-if="hasPromptpay" class="mt-0.5 text-xs text-emerald-600">
                  ✅ ตั้งค่าพร้อมเพย์แล้ว — เพื่อนๆ เห็นตัวเลือกจ่ายเงินในฟอร์ม
                </p>
                <p v-else class="mt-0.5 text-xs text-[#b8a697]">
                  ยังไม่ได้กรอกพร้อมเพย์ — ตัวเลือกจ่ายเงินจะถูกซ่อนจากเพื่อน
                </p>
              </div>
              <button
                class="shrink-0 rounded border border-[#d4c4b0] px-3 py-1.5 text-xs text-[#795b43] transition hover:bg-[#fdf9f4]"
                @click="showPromptpayForm = !showPromptpayForm"
              >
                {{ hasPromptpay ? 'เปลี่ยน' : 'กรอก' }}
              </button>
            </div>

            <!-- ฟอร์มกรอกพร้อมเพย์ -->
            <div v-if="showPromptpayForm" class="mt-4">
              <label for="ppId" class="mb-1 block text-xs text-[#8C7868]">
                พร้อมเพย์ (เบอร์โทร 10 หลัก หรือ เลขบัตรประชาชน 13 หลัก)
              </label>
              <div class="flex gap-2">
                <input
                  id="ppId"
                  v-model="promptpayPhone"
                  type="text"
                  maxlength="13"
                  placeholder="0812345678 หรือ 1234567890123"
                  class="flex-1 rounded border border-[#d4c4b0] bg-[#F6F3ED] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
                  @keydown.enter="savePromptpay"
                />
                <button
                  :disabled="promptpayLoading"
                  class="rounded bg-[#795b43] px-3 py-2 text-sm text-white transition hover:bg-[#5c4535] disabled:opacity-50"
                  @click="savePromptpay"
                >
                  {{ promptpayLoading ? '...' : 'บันทึก' }}
                </button>
              </div>
              <p class="mt-1 text-xs text-[#b8a697]">
                จะถูกเข้ารหัสก่อนบันทึก — ใช้สร้าง QR เท่านั้น ไม่แสดงให้ใครเห็น
              </p>
              <p v-if="promptpayError" class="mt-1 text-xs text-red-500">{{ promptpayError }}</p>
              <p v-if="promptpaySaved" class="mt-1 text-xs text-emerald-600">✅ บันทึกแล้ว</p>
            </div>
          </div>
          <!-- ====== จบส่วนพร้อมเพย์ ====== -->

          <!-- Advance wish notice -->
          <div v-if="drawResult && drawResult.advanceWishCount > 0"
            class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            ⏰ มีคำอวยพรล่วงหน้า {{ drawResult.advanceWishCount }} ใบ รอเปิดในปีหน้า
          </div>

          <!-- ====== ✨ เวทีสุ่มการ์ด ====== -->
          <div v-if="drawing" class="stage" role="status" aria-live="polite">
            <div class="stage-glow" />
            <div class="stage-ring" />
            <div class="deck">
              <div v-for="n in 7" :key="n" class="deck-card" :style="{ '--i': n - 1 }">
                <span class="deck-card-emoji">💌</span>
              </div>
            </div>
            <span class="sparkle s1">✨</span>
            <span class="sparkle s2">⭐</span>
            <span class="sparkle s3">✨</span>
            <span class="sparkle s4">🎉</span>
            <p :key="stageTextIndex" class="stage-text">{{ stageText }}</p>
          </div>

          <!-- ไม่มีการ์ด -->
          <div v-else-if="drawResult && drawResult.totalEligible === 0 && !loading"
            class="rounded-xl border border-[#eee6dc] bg-white p-8 text-center shadow-sm">
            <div class="text-4xl">💌</div>
            <p class="mt-3 text-sm text-[#8C7868]">ยังไม่มีคำอวยพรสำหรับปีนี้</p>
            <p class="mt-1 text-xs text-[#b8a697]">แชร์ลิงก์ให้เพื่อนๆ ส่งมาให้คุณ</p>
            <NuxtLink :to="`/wish/${pageId}`" class="mt-3 block text-xs text-[#795b43] underline">
              /wish/{{ pageId }}
            </NuxtLink>
          </div>

          <!-- การ์ด -->
          <div v-else-if="drawResult?.card">
            <p class="mb-3 text-center text-xs text-[#b8a697]">
              {{ drawResult.totalEligible }} ใบที่อ่านได้ตอนนี้
            </p>

            <div :key="revealKey" class="reveal-wrap">
              <div class="reveal-aura" aria-hidden="true" />
              <div class="reveal-card">
                <GreetingCardDisplay :card="drawResult.card" />
              </div>
            </div>

            <div
              v-if="drawResult.contribution"
              :key="'gift-' + revealKey"
              class="gift-in mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-[#49382f]">🎁 ผู้ส่งแนบของขวัญมา</p>
                <button
                  type="button"
                  class="shrink-0 rounded-full border border-[#d4c4b0] bg-white px-3 py-1.5 text-xs text-[#795b43] transition hover:bg-[#fdf9f4]"
                  :aria-expanded="showGiftDetails"
                  @click="showGiftDetails = !showGiftDetails"
                >
                  {{ showGiftDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด' }}
                </button>
              </div>
              <div v-if="showGiftDetails" class="mt-3 border-t border-amber-200 pt-3">
                <p class="text-sm font-semibold text-[#49382f]">
                  ฿{{ drawResult.contribution.amount }} {{ drawResult.contribution.currency }}
                </p>
                <p class="mt-1 text-xs text-[#8C7868]">
                  {{ drawResult.contribution.statusLabel }}
                </p>
                <p class="mt-1 text-xs text-[#8C7868]">
                  สถานะนี้อ้างอิงจากการแจ้งของผู้ส่ง ระบบไม่ได้ตรวจสอบสลิปหรือยืนยันยอดเงินจริง
                </p>
              </div>
            </div>
          </div>

          <div v-else-if="loading" class="py-8 text-center text-sm text-[#8C7868]">กำลังสุ่มการ์ด...</div>

          <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {{ error }}
            <button class="mt-2 block text-xs underline"
              @click="tokenConfirmed = false; ownerToken = null">
              ลอง token ใหม่
            </button>
          </div>

          <!-- ปุ่มสุ่ม (แสดงเมื่อมีการ์ดให้เปิด) -->
          <div v-if="drawResult?.card || drawing" class="mt-6 flex justify-center">
            <button
              :disabled="drawing || loading"
              class="draw-btn rounded-full border border-[#d4c4b0] bg-white px-7 py-2.5 text-sm text-[#795b43] shadow-sm transition hover:bg-[#fdf9f4] disabled:opacity-50"
              @click="spectacularDraw"
            >
              {{ drawing ? '✨ กำลังสุ่ม...' : '🎴 เปิดการ์ดใบถัดไป' }}
            </button>
          </div>

          <!-- Share link -->
          <div class="mt-8 rounded-lg border border-[#eee6dc] bg-[#fdf9f4] p-4">
            <p class="mb-1 text-xs tracking-widest text-[#b8a697]">ลิงก์สำหรับเพื่อน</p>
            <NuxtLink :to="`/wish/${pageId}`"
              class="block break-all text-sm text-[#795b43] underline hover:text-[#49382f]">
              /wish/{{ pageId }}
            </NuxtLink>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.birthday-background {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background-color: #f7f2ea;
  background-image:
    radial-gradient(ellipse at 50% 45%, rgba(245, 222, 198, 0.45) 20%, rgba(250, 243, 233, 0.3) 60%, transparent 100%),
    linear-gradient(180deg, #f7f2ea 0%, #f7f2ea 100%);
}
.dot {
  display: block;
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #8b6b4a;
}

/* ================= เวทีสุ่ม ================= */
.stage {
  position: relative;
  height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.stage-glow {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 214, 140, 0.85) 0%, rgba(255, 190, 120, 0.35) 45%, transparent 70%);
  animation: glow-pulse 1.1s ease-in-out infinite;
}
.stage-ring {
  position: absolute;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  border: 2px dashed rgba(121, 91, 67, 0.35);
  animation: ring-spin 2.4s linear infinite;
}
.deck {
  position: relative;
  width: 140px;
  height: 200px;
  animation: deck-float 1.4s ease-in-out infinite;
}
.deck-card {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 2px solid #e6cfa8;
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.22) 0 6px, transparent 6px 12px),
    linear-gradient(145deg, #c9a074 0%, #8b6b4a 100%);
  box-shadow: 0 8px 20px rgba(73, 56, 47, 0.28), inset 0 0 0 4px rgba(255, 255, 255, 0.18);
  transform-origin: 50% 90%;
  animation: shuffle 0.9s cubic-bezier(0.45, 0, 0.25, 1) infinite;
  animation-delay: calc(var(--i) * 0.08s);
  z-index: calc(10 - var(--i));
}
.deck-card-emoji {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}
.stage-text {
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 15px;
  letter-spacing: 0.04em;
  color: #795b43;
  animation: text-pop 0.5s ease-out both;
}
.sparkle {
  position: absolute;
  font-size: 22px;
  animation: twinkle 1.3s ease-in-out infinite;
  pointer-events: none;
}
.s1 { top: 14%; left: 14%; animation-delay: 0s; }
.s2 { top: 22%; right: 12%; animation-delay: 0.35s; }
.s3 { bottom: 26%; left: 10%; animation-delay: 0.7s; }
.s4 { bottom: 20%; right: 14%; animation-delay: 1s; }

@keyframes shuffle {
  0%   { transform: translate(0, 0) rotate(0deg); }
  25%  { transform: translate(calc(70px + var(--i) * 6px), -18px) rotate(calc(12deg + var(--i) * 3deg)); }
  50%  { transform: translate(0, 0) rotate(0deg); }
  75%  { transform: translate(calc(-70px - var(--i) * 6px), -18px) rotate(calc(-12deg - var(--i) * 3deg)); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes deck-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.04); }
}
@keyframes glow-pulse {
  0%, 100% { transform: scale(0.85); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}
@keyframes ring-spin {
  to { transform: rotate(360deg); }
}
@keyframes twinkle {
  0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.3) rotate(25deg); opacity: 1; }
}
@keyframes text-pop {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ================= เปิดการ์ด ================= */
.reveal-wrap {
  position: relative;
  perspective: 1200px;
}
.reveal-aura {
  position: absolute;
  inset: -24px;
  border-radius: 28px;
  background: radial-gradient(circle, rgba(255, 210, 130, 0.9) 0%, rgba(255, 190, 120, 0.4) 50%, transparent 75%);
  filter: blur(18px);
  opacity: 0;
  animation: aura-burst 1.8s ease-out both;
  pointer-events: none;
}
.reveal-card {
  position: relative;
  transform-style: preserve-3d;
  animation: card-flip 1.05s cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
}
.gift-in {
  animation: gift-slide 0.7s 0.9s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}

@keyframes card-flip {
  0%   { transform: rotateY(-100deg) scale(0.4) translateY(40px); opacity: 0; filter: brightness(1.8); }
  55%  { transform: rotateY(12deg) scale(1.1) translateY(-8px); opacity: 1; filter: brightness(1.25); }
  80%  { transform: rotateY(-4deg) scale(0.99); filter: brightness(1.05); }
  100% { transform: rotateY(0deg) scale(1) translateY(0); opacity: 1; filter: brightness(1); }
}
@keyframes aura-burst {
  0%   { opacity: 0; transform: scale(0.5); }
  35%  { opacity: 1; transform: scale(1.15); }
  100% { opacity: 0; transform: scale(1.5); }
}
@keyframes gift-slide {
  from { transform: translateY(24px) scale(0.92); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}

/* ================= แสงวาบ ================= */
.screen-flash {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  background: radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.95), rgba(255, 233, 190, 0.5) 55%, transparent 80%);
  animation: flash-out 0.7s ease-out both;
}
@keyframes flash-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

/* ================= Confetti ================= */
.confetti-layer {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  top: 42%;
  left: 50%;
  border-radius: 2px;
  opacity: 0;
  animation-name: confetti-fly;
  animation-timing-function: cubic-bezier(0.1, 0.75, 0.35, 1);
  animation-fill-mode: both;
}
.confetti-piece.round {
  border-radius: 50%;
}
@keyframes confetti-fly {
  0%   { transform: translate(-50%, -50%) rotate(0deg) scale(0); opacity: 1; }
  12%  { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
  70%  { opacity: 1; }
  100% {
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 70vh)) rotate(var(--rot)) scale(0.8);
    opacity: 0;
  }
}

/* ปุ่มสุ่ม */
.draw-btn:not(:disabled):hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 8px 22px rgba(121, 91, 67, 0.25);
}
.draw-btn:not(:disabled):active {
  transform: scale(0.97);
}

/* เคารพผู้ใช้ที่ปิดแอนิเมชัน */
@media (prefers-reduced-motion: reduce) {
  .stage-glow,
  .stage-ring,
  .deck,
  .deck-card,
  .sparkle,
  .reveal-aura,
  .reveal-card,
  .gift-in,
  .screen-flash,
  .stage-text {
    animation: none !important;
  }
  .deck-card:not(:first-child) {
    display: none;
  }
}
</style>