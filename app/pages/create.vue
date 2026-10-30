<script setup lang="ts">
/**
 * /create — Birthday owner creates their page.
 */
useHead({ title: 'สร้างหน้าวันเกิด — A Little Wish' })

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
      <!-- Header -->
      <div class="mb-8 text-center">
        <div
          class="reveal badge mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2"
          style="--d: 0.1s"
        >
          <span class="dot" />
          <span class="text-xs tracking-widest text-[#8C7868]">BIRTHDAY OWNER</span>
        </div>

        <h1 class="reveal title-shimmer font-playfair text-4xl text-[#49382f]" style="--d: 0.25s">
          สร้างหน้าวันเกิด
        </h1>

        <p class="reveal mt-2 text-sm text-[#8C7868]" style="--d: 0.4s">
          แค่ระบุวันเกิด — เพื่อนๆ จะส่งคำอวยพรมาให้คุณได้เลย
        </p>
      </div>

      <div
        class="reveal card rounded-xl border border-[#eee6dc] bg-white p-6 shadow-sm"
        style="--d: 0.6s"
      >
        <CreatePageForm />
      </div>
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

/* ---------- Card ---------- */
.card {
  transition: box-shadow 0.3s ease;
}
.card:focus-within {
  box-shadow: 0 10px 30px rgba(121, 91, 67, 0.15);
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

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
</style>