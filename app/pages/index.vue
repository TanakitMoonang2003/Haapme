<script setup lang="ts">
// อนุภาคลอยในพื้นหลัง (ค่าคงที่ ไม่ใช้ random เพื่อเลี่ยง hydration mismatch ใน Nuxt)
const particles = [
  { left: 6, size: 14, delay: 0, dur: 14, char: '♡' },
  { left: 14, size: 10, delay: 3, dur: 11, char: '✦' },
  { left: 22, size: 18, delay: 6, dur: 16, char: '♡' },
  { left: 31, size: 9, delay: 1, dur: 12, char: '✦' },
  { left: 40, size: 13, delay: 8, dur: 15, char: '♡' },
  { left: 49, size: 11, delay: 4, dur: 13, char: '✦' },
  { left: 58, size: 16, delay: 9, dur: 17, char: '♡' },
  { left: 66, size: 9, delay: 2, dur: 11, char: '✦' },
  { left: 74, size: 15, delay: 7, dur: 14, char: '♡' },
  { left: 82, size: 11, delay: 5, dur: 12, char: '✦' },
  { left: 90, size: 17, delay: 10, dur: 16, char: '♡' },
  { left: 96, size: 10, delay: 3, dur: 13, char: '✦' },
]
</script>

<template>
  <div
    class="birthday-background text-center justify-center items-center flex flex-col gap-4"
  >
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

    <div
      class="reveal inline-flex items-center justify-center gap-2 bg-amber-50 px-3 py-2 rounded-2xl m-10 badge"
      style="--d: 0.1s"
    >
      <span class="dot"></span>
      <span>Birthday Keepsake Journal</span>
    </div>

    <div
      class="reveal title-shimmer text-6xl gap-2 mt-10 font-playfair"
      style="--d: 0.3s"
    >
      A little Wish for You
    </div>

    <div class="reveal text-lg italic" style="--d: 0.5s">
      "คำอวยพรเล็กๆ สำหรับเธอ"
    </div>

    <div class="reveal text-base" style="--d: 0.7s">
      Make a wish and send it to your loved ones. Your wishes will be kept safe and cherished forever.
    </div>

    <div class="reveal text-base" style="--d: 0.85s">
      ทำให้ความปรารถนาของคุณเป็นจริงและส่งไปยังคนที่คุณรัก คำอวยพรของคุณจะถูกเก็บไว้อย่างปลอดภัยและมีค่าไปตลอดกาล
    </div>

    <!-- card -->
    <NuxtLink
      to="/create"
      class="reveal group block w-85 max-w-full mx-auto"
      style="--d: 1.05s"
    >
      <div class="envelope-float">
        <!-- Envelope Card -->
        <div
          class="envelope relative h-52.5 overflow-hidden
                 bg-white border border-[#eee6dc]
                 rounded-sm shadow-md
                 transition-all duration-300
                 group-hover:-translate-y-2
                 group-hover:rotate-1
                 group-hover:shadow-xl"
        >
          <!-- แสงวิ่งผ่านการ์ด -->
          <div class="shine" aria-hidden="true"></div>

          <!-- ข้อมูลด้านบน -->
          <div class="absolute top-5 left-5 z-10">
            <p class="text-[10px] tracking-[0.15em] text-[#b8a697]">
              NO. 2026 · ARCHIVE
            </p>
          </div>

          <!-- เส้นพับซองจดหมาย (วาดเส้นขึ้นมา) -->
          <svg
            class="absolute inset-0 w-full h-full"
            viewBox="0 0 340 210"
            preserveAspectRatio="none"
            fill="none"
          >
            <path class="draw" pathLength="1" d="M0 0 L170 115 L340 0" stroke="#e3d9cc" stroke-width="1" />
            <path class="draw d2" pathLength="1" d="M0 210 L125 95" stroke="#e8dfd3" stroke-width="1" />
            <path class="draw d2" pathLength="1" d="M340 210 L215 95" stroke="#e8dfd3" stroke-width="1" />
            <path class="draw d3" pathLength="1" d="M0 210 L170 105 L340 210" stroke="#e3d9cc" stroke-width="1" />
          </svg>

          <!-- หัวใจตรงกลาง -->
          <div
            class="seal absolute top-1/2 left-1/2 z-10
                   -translate-x-1/2 -translate-y-1/2
                   flex items-center justify-center
                   w-14 h-14 rounded-xl
                   bg-[#f8d6bd]
                   transition-transform duration-300
                   group-hover:scale-110"
          >
            <span class="ring" aria-hidden="true"></span>
            <div
              class="flex items-center justify-center
                     w-10 h-10 rounded-lg bg-[#795b43]"
            >
              <svg
                viewBox="0 0 24 24"
                class="heartbeat w-5 h-5 fill-white"
                aria-hidden="true"
              >
                <path
                  d="M12 21s-9-5.8-9-12a5 5 0 0 1 9-3
                     5 5 0 0 1 9 3c0 6.2-9 12-9 12Z"
                />
              </svg>
            </div>
          </div>

          <!-- ข้อความด้านล่าง -->
          <div
            class="absolute bottom-5 left-0 right-0
                   text-center text-[10px]
                   tracking-[0.12em] text-[#92745e]"
          >
            <span class="warmth">♡ SEALED WITH WARMTH ♡</span>
          </div>
        </div>
      </div>

      <!-- ข้อความเมื่อ Hover -->
      <p
        class="cta-text mt-4 text-center text-sm
               text-[#92745e] opacity-70
               transition-all duration-300
               group-hover:opacity-100"
      >
        สร้างหน้าวันเกิดของฉัน <span class="arrow">→</span>
      </p>
    </NuxtLink>

    <!-- Sender CTA -->
    <div class="reveal mt-2 text-sm text-[#8C7868]" style="--d: 1.25s">
      หรือ
      <NuxtLink
        to="/wish"
        class="link-underline font-medium text-[#795b43] hover:text-[#49382f]"
      >
        ส่งคำอวยพร
      </NuxtLink>
      ให้ใครสักคน
    </div>
  </div>
</template>

<style scoped>
div {
  color: #49382f;
  font-family: plus-jakarta-sans, sans-serif;
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

.birthday-background {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  background-color: #f7f2ea;
  background-image:
    radial-gradient(
      ellipse at 50% 45%,
      rgba(245, 222, 198, 0.45) 20%,
      rgba(250, 243, 233, 0.3) 60%,
      transparent 100%
    ),
    linear-gradient(180deg, #f7f2ea 0%, #f7f2ea 100%);
  background-size: 140% 140%, 100% 100%;
  animation: glow-drift 12s ease-in-out infinite alternate;
}

/* ให้เนื้อหาอยู่เหนืออนุภาค */
.birthday-background > *:not(.particles) {
  position: relative;
  z-index: 1;
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

/* ---------- Title shimmer ---------- */
.title-shimmer {
  background: linear-gradient(
    100deg,
    #49382f 0%,
    #49382f 40%,
    #b98a5e 50%,
    #49382f 60%,
    #49382f 100%
  );
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation:
    fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards,
    shimmer 5s ease-in-out 1.5s infinite;
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

/* ---------- Envelope ---------- */
.envelope-float {
  animation: bob 4s ease-in-out infinite;
}

.shine {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(
    115deg,
    transparent 35%,
    rgba(255, 255, 255, 0.85) 50%,
    transparent 65%
  );
  transform: translateX(-120%);
  animation: sweep 5s ease-in-out 2s infinite;
}

.draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw-line 1.4s ease-out 1.4s forwards;
}
.draw.d2 {
  animation-delay: 1.7s;
}
.draw.d3 {
  animation-delay: 2s;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 0.75rem;
  border: 2px solid #f0b48a;
  animation: ripple 2.4s ease-out infinite;
}

.heartbeat {
  animation: heartbeat 1.6s ease-in-out infinite;
  transform-origin: center;
}

.warmth {
  display: inline-block;
  animation: breathe 3s ease-in-out infinite;
}

/* ---------- CTA ---------- */
.arrow {
  display: inline-block;
  transition: transform 0.3s ease;
}
.cta-text .arrow {
  animation: nudge 1.8s ease-in-out infinite;
}
.group:hover .arrow {
  transform: translateX(6px);
  animation: none;
}

.link-underline {
  position: relative;
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

/* ---------- Keyframes ---------- */
@keyframes fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes sweep {
  0% { transform: translateX(-120%); }
  35%, 100% { transform: translateX(120%); }
}

@keyframes draw-line {
  to { stroke-dashoffset: 0; }
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

@keyframes breathe {
  0%, 100% { opacity: 0.65; letter-spacing: 0.12em; }
  50% { opacity: 1; letter-spacing: 0.16em; }
}

@keyframes nudge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

/* เคารพผู้ใช้ที่ปิดการเคลื่อนไหวในระบบ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
  .draw { stroke-dashoffset: 0; }
}
</style>