<script setup lang="ts">
/**
 * /my-cards — Visitor views their own submitted cards.
 * Card IDs and visitor tokens are read from localStorage.
 * No cross-visitor cards are accessible.
 */
import { useGreetingCard } from '../composables/useGreetingCard'
import type { GreetingCardPublic } from '../../shared/types'

useHead({ title: 'การ์ดของฉัน — A Little Wish' })

const { loadMyCard, getMyCardIds } = useGreetingCard()

interface CardEntry {
  id: string
  card: GreetingCardPublic | null
  loading: boolean
  error: boolean
}

const cards = ref<CardEntry[]>([])
const initialised = ref(false)

// แสดงเฉพาะการ์ดที่กำลังโหลด หรือโหลดสำเร็จ — การ์ดที่ไม่มีใน database จะไม่ถูกนำมาแสดง
const visibleCards = computed(() => cards.value.filter(e => e.loading || (e.card && !e.error)))
const allLoaded = computed(() => cards.value.every(e => !e.loading))
const isEmpty = computed(() => initialised.value && allLoaded.value && visibleCards.value.length === 0)

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

onMounted(async () => {
  const ids = getMyCardIds()
  cards.value = ids.map(id => ({ id, card: null, loading: true, error: false }))
  initialised.value = true

  await Promise.all(
    cards.value.map(async (entry, i) => {
      try {
        const res = await loadMyCard(entry.id)
        if (res) {
          cards.value[i]!.card = res.card
        } else {
          cards.value[i]!.error = true
        }
      } catch {
        cards.value[i]!.error = true
      }
      cards.value[i]!.loading = false
    })
  )
})
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
      <div class="mb-8 text-center">
        <div
          class="reveal badge mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2"
          style="--d: 0.1s"
        >
          <span class="dot" />
          <span class="text-xs tracking-widest text-[#8C7868]">MY CARDS</span>
        </div>
        <h1 class="reveal title-shimmer font-playfair text-4xl text-[#49382f]" style="--d: 0.25s">
          การ์ดของฉัน
        </h1>
        <p class="reveal mt-2 text-sm text-[#8C7868]" style="--d: 0.4s">คำอวยพรที่คุณเคยส่งไป</p>
      </div>

      <!-- No cards (ไม่มีการ์ดเลย หรือการ์ดทั้งหมดไม่มีใน database) -->
      <div v-if="isEmpty" class="reveal py-12 text-center" style="--d: 0.1s">
        <div class="empty-icon text-4xl">📭</div>
        <p class="mt-3 text-sm text-[#8C7868]">คุณยังไม่ได้ส่งการ์ดใดๆ</p>
        <NuxtLink to="/wish" class="link-underline mt-3 inline-block text-sm text-[#795b43] hover:text-[#49382f]">
          ส่งคำอวยพรแรก <span class="arrow">→</span>
        </NuxtLink>
      </div>

      <!-- Card list -->
      <TransitionGroup v-else name="card" tag="div" class="space-y-4">
        <div v-for="entry in visibleCards" :key="entry.id" class="card-item">
          <!-- Skeleton ระหว่างโหลด -->
          <div
            v-if="entry.loading"
            class="skeleton rounded-lg border border-[#eee6dc] bg-white p-5"
            aria-busy="true"
            aria-label="กำลังโหลด"
          >
            <span class="line w-1/3"></span>
            <span class="line mt-3 w-full"></span>
            <span class="line mt-2 w-4/5"></span>
          </div>
          <GreetingCardDisplay v-else-if="entry.card" :card="entry.card" />
        </div>
      </TransitionGroup>
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

/* ---------- Card list ---------- */
.card-item {
  transition: transform 0.3s ease;
}
.card-item:hover {
  transform: translateY(-3px);
}

.card-enter-active {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.card-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}
.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.card-move {
  transition: transform 0.4s ease;
}

/* ---------- Skeleton ---------- */
.skeleton .line {
  display: block;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f1e9de 25%, #faf5ee 50%, #f1e9de 75%);
  background-size: 200% 100%;
  animation: skeleton 1.4s ease-in-out infinite;
}

/* ---------- Empty state ---------- */
.empty-icon {
  display: inline-block;
  animation: bob 3s ease-in-out infinite;
}

.arrow {
  display: inline-block;
  transition: transform 0.25s ease;
}
.link-underline:hover .arrow {
  transform: translateX(4px);
}

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
@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
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