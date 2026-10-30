<script setup lang="ts">
/**
 * /wish/[pageId] — Visitor sends a greeting card to a specific birthday page.
 */
import { useBirthdayPage } from '../../composables/useBirthdayPage'
import type { CreateGreetingCardResponse } from '../../../shared/types'

const route = useRoute()
const pageId = computed(() => route.params.pageId as string)

useHead({ title: 'ส่งคำอวยพร — A Little Wish' })

const { loading, error, page, loadPage } = useBirthdayPage()

await loadPage(pageId.value)

function handleSubmitted(_result: CreateGreetingCardResponse) {
  // result is handled inside WishForm; nothing extra needed here
}

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
</script>

<template>
  <div class="birthday-background">
    <!-- อนุภาคลอยขึ้น -->
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
      <div v-if="loading" class="flex flex-col items-center gap-4 py-16 text-sm text-[#8C7868]" aria-busy="true">
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

      <!-- Error -->
      <div
        v-else-if="error"
        class="error-card rounded-lg border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600"
        role="alert"
      >
        {{ error }}
      </div>

      <!-- Page found -->
      <template v-else-if="page">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div
            class="reveal badge mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2"
            style="--d: 0.1s"
          >
            <span class="dot" />
            <span class="text-xs tracking-widest text-[#8C7868]">LETTERPRESS ATELIER · เขียนการ์ด</span>
          </div>

          <h1 class="reveal title-shimmer font-playfair text-4xl text-[#49382f]" style="--d: 0.25s">
            เขียนคำอวยพรวันเกิด
          </h1>

          <p class="reveal mt-1 text-sm text-[#8C7868]" style="--d: 0.4s">
            ส่งให้ <span class="name font-semibold text-[#49382f]">{{ page.displayName }}</span>
          </p>

          <p
            v-if="page.daysUntilBirthday === 0"
            class="reveal mt-1 text-xs font-semibold text-emerald-600"
            style="--d: 0.55s"
          >
            <span class="cake">🎂</span> วันนี้คือวันเกิด!
          </p>
          <p v-else class="reveal mt-1 text-xs text-[#b8a697]" style="--d: 0.55s">
            อีก <span class="countdown">{{ page.daysUntilBirthday }}</span> วัน
          </p>
        </div>

        <div
          class="reveal card rounded-xl border border-[#eee6dc] bg-white p-6 shadow-sm"
          style="--d: 0.7s"
        >
          <p class="mb-4 text-xs text-[#b8a697]">
            จดจารความรู้สึกดีๆ ลงบนแผ่นกระดาษ เลือกกำหนดเวลาเปิดอ่าน และมอบของขวัญอันทรงคุณค่าแด่ผู้รับ
          </p>
          <WishForm :birthday-page-id="pageId" :display-name="page.displayName" @submitted="handleSubmitted" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.birthday-background {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
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

/* ---------- Entrance ---------- */
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

/* ---------- Details ---------- */
.name {
  display: inline-block;
  animation: soft-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both;
}

.countdown {
  display: inline-block;
  font-weight: 600;
  color: #8b6b4a;
  animation: soft-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s both;
}

.cake {
  display: inline-block;
  animation: party 1.4s ease-in-out infinite;
  transform-origin: bottom center;
}

/* ---------- Card ---------- */
.card {
  transition: box-shadow 0.3s ease;
}
.card:focus-within {
  box-shadow: 0 10px 30px rgba(121, 91, 67, 0.15);
}

/* ---------- Loading ---------- */
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

/* ---------- Error ---------- */
.error-card {
  animation: shake 0.5s ease-in-out, fade-in 0.3s ease-out;
}

/* ---------- Particles ---------- */
.particles {
  position: absolute;
  inset: 0;
  z-index: 0;
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

/* ---------- Keyframes ---------- */
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

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
</style>