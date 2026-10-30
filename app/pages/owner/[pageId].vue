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

// อนุภาคลอยในพื้นหลัง (ค่าคงที่ เพื่อเลี่ยง hydration mismatch)
const particles = [
  { left: 8, size: 14, delay: 0, dur: 14, char: '♡' },
  { left: 18, size: 10, delay: 3, dur: 11, char: '✦' },
  { left: 28, size: 16, delay: 6, dur: 16, char: '♡' },
  { left: 39, size: 9, delay: 1, dur: 12, char: '✦' },
  { left: 50, size: 13, delay: 8, dur: 15, char: '♡' },
  { left: 61, size: 11, delay: 4, dur: 13, char: '✦' },
  { left: 71, size: 17, delay: 9, dur: 17, char: '♡' },
  { left: 81, size: 10, delay: 2, dur: 11, char: '✦' },
  { left: 91, size: 15, delay: 7, dur: 14, char: '♡' },
]

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

    <!-- อนุภาคลอยขึ้นในพื้นหลัง -->
    <div class="particles" aria-hidden="true">
      <span
        v-for="(p, i) in particles"
        :key="i"
        class="particle"
        :style="{
          left: p.left + '%',
          fontSize: p.size + 'px',
          animationDelay: p.delay + 's',
          animationDuration: p.dur + 's',
        }"
      >
        {{ p.char }}
      </span>
    </div>

    <div class="content mx-auto max-w-lg px-4 py-12">
      <!-- Loading -->
      <div v-if="pageLoading" class="flex flex-col items-center gap-4 py-16 text-sm text-[#8C7868]" aria-busy="true">
        <div class="relative flex h-14 w-14 items-center justify-center rounded-xl bg-[#f8d6bd]">
          <span class="ring" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" class="heartbeat h-6 w-6 fill-[#795b43]" aria-hidden="true">
            <path d="M12 21s-9-5.8-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.2-9 12-9 12Z" />
          </svg>
        </div>
        <span class="flex items-center gap-1">
          กำลังโหลด
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </span>
      </div>

      <div
        v-else-if="pageError"
        class="error-card rounded-lg border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600"
        role="alert"
      >
        {{ pageError }}
      </div>

      <template v-else-if="page">
        <!-- Header -->
        <div class="mb-6 text-center">
          <div
            class="reveal badge mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2"
            style="--d: 0.1s"
          >
            <span class="dot" />
            <span class="text-xs tracking-widest text-[#8C7868]">OWNER VIEW</span>
          </div>
          <h1 class="reveal title-shimmer font-playfair text-4xl text-[#49382f]" style="--d: 0.25s">
            {{ page.displayName }}
          </h1>
          <p
            v-if="page.daysUntilBirthday === 0"
            class="reveal mt-1 text-xs text-emerald-600 font-semibold"
            style="--d: 0.4s"
          >
            <span class="cake">🎂</span> วันนี้คือวันเกิดของคุณ!
          </p>
          <p v-else class="reveal mt-1 text-xs text-[#b8a697]" style="--d: 0.4s">
            อีก <span class="countdown">{{ page.daysUntilBirthday }}</span> วันถึงวันเกิด
          </p>
        </div>

        <!-- ยังไม่ authed -->
        <div v-if="!tokenConfirmed" class="reveal" style="--d: 0.55s">
          <OwnerTokenInput @confirmed="handleTokenConfirmed" />
          <div
            v-if="error"
            class="error-card mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            role="alert"
          >
            ❌ {{ error }}
          </div>
        </div>

        <!-- Authed -->
        <template v-else>

          <!-- ====== ส่วนพร้อมเพย์ ====== -->
          <div
            class="reveal card mb-6 rounded-lg border border-[#eee6dc] bg-white p-4 shadow-sm"
            style="--d: 0.5s"
          >
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
                class="pp-btn shrink-0 rounded border border-[#d4c4b0] px-3 py-1.5 text-xs text-[#795b43] transition hover:bg-[#fdf9f4]"
                @click="showPromptpayForm = !showPromptpayForm"
              >
                {{ hasPromptpay ? 'เปลี่ยน' : 'กรอก' }}
              </button>
            </div>

            <!-- ฟอร์มกรอกพร้อมเพย์ -->
            <Transition name="expand">
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
                    class="field flex-1 rounded border border-[#d4c4b0] bg-[#F6F3ED] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
                    @keydown.enter="savePromptpay"
                  />
                  <button
                    :disabled="promptpayLoading"
                    class="go-btn rounded bg-[#795b43] px-3 py-2 text-sm text-white transition hover:bg-[#5c4535] disabled:opacity-50"
                    @click="savePromptpay"
                  >
                    {{ promptpayLoading ? '...' : 'บันทึก' }}
                  </button>
                </div>
                <p class="mt-1 text-xs text-[#b8a697]">
                  จะถูกเข้ารหัสก่อนบันทึก — ใช้สร้าง QR เท่านั้น ไม่แสดงให้ใครเห็น
                </p>
                <p v-if="promptpayError" class="error-text mt-1 text-xs text-red-500">{{ promptpayError }}</p>
                <p v-if="promptpaySaved" class="pop-in mt-1 text-xs text-emerald-600">✅ บันทึกแล้ว</p>
              </div>
            </Transition>
          </div>
          <!-- ====== จบส่วนพร้อมเพย์ ====== -->

          <!-- Advance wish notice -->
          <div v-if="drawResult && drawResult.advanceWishCount > 0"
            class="reveal mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
            style="--d: 0.65s">
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
            class="reveal rounded-xl border border-[#eee6dc] bg-white p-8 text-center shadow-sm"
            style="--d: 0.1s">
            <div class="empty-icon text-4xl">💌</div>
            <p class="mt-3 text-sm text-[#8C7868]">ยังไม่มีคำอวยพรสำหรับปีนี้</p>
            <p class="mt-1 text-xs text-[#b8a697]">แชร์ลิงก์ให้เพื่อนๆ ส่งมาให้คุณ</p>
            <NuxtLink :to="`/wish/${pageId}`" class="link-underline mt-3 inline-block text-xs text-[#795b43] hover:text-[#49382f]">
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
                <p class="text-sm font-semibold text-[#49382f]">
                  <span class="gift-icon">🎁</span> ผู้ส่งแนบของขวัญมา
                </p>
                <button
                  type="button"
                  class="pp-btn shrink-0 rounded-full border border-[#d4c4b0] bg-white px-3 py-1.5 text-xs text-[#795b43] transition hover:bg-[#fdf9f4]"
                  :aria-expanded="showGiftDetails"
                  @click="showGiftDetails = !showGiftDetails"
                >
                  {{ showGiftDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด' }}
                </button>
              </div>
              <Transition name="expand">
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
              </Transition>
            </div>
          </div>

          <div v-else-if="loading" class="py-8 text-center text-sm text-[#8C7868]">
            กำลังสุ่มการ์ด<span class="dots ml-1" aria-hidden="true"><i></i><i></i><i></i></span>
          </div>

          <div v-else-if="error" class="error-card rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600" role="alert">
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
          <div
            class="reveal card mt-8 rounded-lg border border-[#eee6dc] bg-[#fdf9f4] p-4"
            style="--d: 0.8s"
          >
            <p class="mb-1 text-xs tracking-widest text-[#b8a697]">ลิงก์สำหรับเพื่อน</p>
            <NuxtLink :to="`/wish/${pageId}`"
              class="link-underline block break-all text-sm text-[#795b43] hover:text-[#49382f]">
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
  background-size: 140% 140%, 100% 100%;
  animation: glow-drift 12s ease-in-out infinite alternate;
}
.content {
  position: relative;
  z-index: 1;
}
.dot {
  display: block;
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #8b6b4a;
  animation: pulse-dot 2s ease-in-out infinite;
}

/* ================= อนุภาคพื้นหลัง ================= */
.particles {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.particle {
  position: absolute;
  bottom: -30px;
  color: #d9a679;
  opacity: 0;
  animation-name: float-up;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* ================= Entrance ================= */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  animation: fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0s);
}
.badge {
  box-shadow: 0 2px 10px rgba(139, 107, 74, 0.12);
}
.title-shimmer {
  background: linear-gradient(100deg, #49382f 0%, #49382f 40%, #b98a5e 50%, #49382f 60%, #49382f 100%);
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation:
    fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.25s forwards,
    shimmer 5s ease-in-out 1.5s infinite;
}
.countdown {
  display: inline-block;
  font-weight: 600;
  color: #8b6b4a;
  animation: soft-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both;
}
.cake {
  display: inline-block;
  animation: party 1.4s ease-in-out infinite;
  transform-origin: bottom center;
}

/* ================= การ์ด / ปุ่ม / ฟอร์ม ================= */
.card {
  transition: box-shadow 0.3s ease;
}
.card:focus-within {
  box-shadow: 0 10px 30px rgba(121, 91, 67, 0.15);
}
.field {
  transition: box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
}
.field:focus {
  border-color: #795b43;
  background-color: #fff;
}
.pp-btn,
.go-btn {
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}
.pp-btn:hover,
.go-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(121, 91, 67, 0.22);
}
.pp-btn:active,
.go-btn:not(:disabled):active {
  transform: translateY(0) scale(0.97);
}
.pop-in {
  animation: soft-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.error-text {
  animation: fade-in 0.3s ease-out both;
}
.error-card {
  animation: shake 0.5s ease-in-out, fade-in 0.3s ease-out;
}
.gift-icon {
  display: inline-block;
  animation: wiggle 2.4s ease-in-out infinite;
  transform-origin: bottom center;
}
.empty-icon {
  display: inline-block;
  animation: bob 3s ease-in-out infinite;
}

/* กางออก / พับเก็บ */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ลิงก์ */
.link-underline {
  text-decoration: none;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 100% 1px;
  transition: background-size 0.3s ease;
}
.link-underline:hover {
  background-size: 100% 2px;
}

/* ================= Loading ================= */
.ring {
  position: absolute;
  inset: 0;
  border-radius: 0.75rem;
  border: 2px solid #f0b48a;
  animation: ripple 1.8s ease-out infinite;
}
.heartbeat {
  animation: heartbeat 1.2s ease-in-out infinite;
  transform-origin: center;
}
.dots {
  display: inline-flex;
  gap: 3px;
}
.dots i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #8b6b4a;
  animation: hop 1s ease-in-out infinite;
}
.dots i:nth-child(2) { animation-delay: 0.15s; }
.dots i:nth-child(3) { animation-delay: 0.3s; }

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

/* ================= แสงวาบ ================= */
.screen-flash {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  background: radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.95), rgba(255, 233, 190, 0.5) 55%, transparent 80%);
  animation: flash-out 0.7s ease-out both;
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

/* ปุ่มสุ่ม */
.draw-btn:not(:disabled):hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 8px 22px rgba(121, 91, 67, 0.25);
}
.draw-btn:not(:disabled):active {
  transform: scale(0.97);
}

/* ================= Keyframes ================= */
@keyframes fade-up {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 107, 74, 0.5); }
  50% { box-shadow: 0 0 0 6px rgba(139, 107, 74, 0); }
}
@keyframes shimmer {
  0% { background-position: 120% 0; }
  100% { background-position: -120% 0; }
}
@keyframes glow-drift {
  from { background-position: 40% 45%, 0 0; }
  to { background-position: 60% 55%, 0 0; }
}
@keyframes float-up {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.55; }
  90% { opacity: 0.35; }
  100% { transform: translateY(-110vh) rotate(25deg); opacity: 0; }
}
@keyframes soft-pop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes party {
  0%, 100% { transform: rotate(-8deg) scale(1); }
  50% { transform: rotate(8deg) scale(1.2); }
}
@keyframes wiggle {
  0%, 60%, 100% { transform: rotate(0deg); }
  70% { transform: rotate(-12deg); }
  80% { transform: rotate(10deg); }
  90% { transform: rotate(-6deg); }
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes ripple {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.9); opacity: 0; }
}
@keyframes heartbeat {
  0%, 40%, 100% { transform: scale(1); }
  10% { transform: scale(1.25); }
  25% { transform: scale(1.1); }
}
@keyframes hop {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-4px); opacity: 1; }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(3px); }
}

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
@keyframes flash-out {
  from { opacity: 1; }
  to   { opacity: 0; }
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
  .stage-text,
  .particle,
  .cake,
  .gift-icon,
  .empty-icon,
  .heartbeat,
  .ring,
  .dots i,
  .error-card,
  .birthday-background,
  .dot {
    animation: none !important;
  }
  .reveal,
  .title-shimmer {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
  .title-shimmer {
    color: #49382f;
    -webkit-text-fill-color: #49382f;
  }
  .countdown,
  .pop-in {
    animation: none !important;
  }
  .deck-card:not(:first-child) {
    display: none;
  }
}
</style>