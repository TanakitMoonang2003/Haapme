<template>
  <div
    class="birthday-background text-center justify-center items-center flex flex-col gap-4"
  >
    
<div class="inline-flex items-center justify-center gap-2 bg-amber-50 px-3 py-2 rounded-2xl m-10">
  <span class="dot"></span>
  <span>Birthday Keepsake Journal</span>
</div>
<div class="text-6xl gap-2 mt-10 font-playfair">
 Alittle Wish for You
</div>
<div class="text-lg italic">
  "คำอวยพรเล็กๆ สำหรับเธอ"
</div>
<div class="text-base">
  Make a wish and send it to your loved ones. Your wishes will be kept safe and cherished forever.
</div>
<div class="text-base">
  ทำให้ความปรารถนาของคุณเป็นจริงและส่งไปยังคนที่คุณรัก คำอวยพรของคุณจะถูกเก็บไว้อย่างปลอดภัยและมีค่าไปตลอดกาล
</div>
<!-- card -->
<NuxtLink
    to="/create"
    class="group block w-85 max-w-full mx-auto"
  >
    <!-- Envelope Card -->
    <div
      class="relative h-52.5 overflow-hidden
             bg-white border border-[#eee6dc]
             rounded-sm shadow-md
             transition-all duration-300
             group-hover:-translate-y-2
             group-hover:shadow-xl"
    >
      <!-- ข้อมูลด้านบน -->
      <div class="absolute top-5 left-5 z-10">
        <p
          class="text-[10px] tracking-[0.15em]
                 text-[#b8a697]"
        >
          NO. 2026 · ARCHIVE
        </p>
      </div>

      <!-- เส้นพับซองจดหมาย -->
      <svg
        class="absolute inset-0 w-full h-full"
        viewBox="0 0 340 210"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 0 L170 115 L340 0"
          stroke="#eee8e0"
          stroke-width="1"
        />

        <path
          d="M0 210 L125 95"
          stroke="#f0eae3"
          stroke-width="1"
        />

        <path
          d="M340 210 L215 95"
          stroke="#f0eae3"
          stroke-width="1"
        />

        <path
          d="M0 210 L170 105 L340 210"
          stroke="#eee8e0"
          stroke-width="1"
        />
      </svg>

      <!-- หัวใจตรงกลาง -->
      <div
        class="absolute top-1/2 left-1/2 z-10
               -translate-x-1/2 -translate-y-1/2
               flex items-center justify-center
               w-14 h-14 rounded-xl
               bg-[#f8d6bd]
               transition-transform duration-300
               group-hover:scale-110"
      >
        <div
          class="flex items-center justify-center
                 w-10 h-10 rounded-lg bg-[#795b43]"
        >
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-white"
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
        ♡ SEALED WITH WARMTH ♡
      </div>
    </div>

    <!-- ข้อความเมื่อ Hover -->
     
    <p
      class="mt-4 text-center text-sm
             text-[#92745e] opacity-70
             transition-opacity
             group-hover:opacity-100"
    >
      สร้างหน้าวันเกิดของฉัน →
    </p>
  </NuxtLink>

  <!-- Sender CTA -->
  <div class="mt-2 text-sm text-[#8C7868]">
    หรือ
    <NuxtLink to="/wish" class="font-medium text-[#795b43] underline hover:text-[#49382f]">
      ส่งคำอวยพร
    </NuxtLink>
    ให้ใครสักคน
  </div>
</div>
</template>
<style>
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
}

.birthday-background {
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
}
</style>
