<script setup lang="ts">
/**
 * /wish — Landing for senders.
 * ถ้ามี pageId ในมือ กรอกตรงนี้แล้วกดไป
 */
useHead({ title: 'ส่งคำอวยพร — A Little Wish' })

const router = useRouter()
const pageIdInput = ref('')
const inputError = ref('')

function handleGo() {
  const id = pageIdInput.value.trim()

  // ตรวจสอบว่ามันเป็น owner token (64 ตัว) หรือเปล่า
  if (id.length === 64) {
    inputError.value = '❌ นี่คือ Owner Token ไม่ใช่ Page ID — ดูลิงก์สีเขียวที่ได้ตอนสร้างหน้าแทน'
    return
  }

  if (!id.match(/^[a-f\d]{24}$/i)) {
    inputError.value = 'กรุณาระบุรหัสหน้าวันเกิดที่ถูกต้อง (24 ตัวอักษร)'
    return
  }
  inputError.value = ''
  router.push(`/wish/${id}`)
}
</script>

<template>
  <div class="birthday-background">
    <div class="mx-auto max-w-lg px-4 py-12 text-center">
      <div class="mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
        <span class="dot" />
        <span class="text-xs tracking-widest text-[#8C7868]">SEND A WISH</span>
      </div>
      <h1 class="font-playfair text-4xl text-[#49382f]">ส่งคำอวยพร</h1>
      <p class="mt-2 text-sm text-[#8C7868]">
        ใส่รหัสหน้าวันเกิดที่ได้รับจากเจ้าของ
      </p>

      <div class="mt-8 rounded-xl border border-[#eee6dc] bg-white p-6 shadow-sm">
        <label for="pageId" class="mb-2 block text-sm text-[#49382f]">
          รหัสหน้าวันเกิด (Page ID)
        </label>
        <div class="flex gap-2">
          <input
            id="pageId"
            v-model="pageIdInput"
            type="text"
            placeholder="วางรหัสที่นี่..."
            class="flex-1 rounded border border-[#d4c4b0] bg-[#F6F3ED] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
            :aria-describedby="inputError ? 'pageid-error' : undefined"
            :aria-invalid="!!inputError"
            @keydown.enter="handleGo"
          />
          <button
            type="button"
            class="rounded bg-[#795b43] px-4 py-2 text-sm text-white transition hover:bg-[#5c4535]"
            @click="handleGo"
          >
            ไป →
          </button>
        </div>
        <p v-if="inputError" id="pageid-error" class="mt-1 text-left text-xs text-red-500" role="alert">
          {{ inputError }}
        </p>
      </div>

      <p class="mt-6 text-sm text-[#b8a697]">
        ยังไม่มีหน้าวันเกิด?
        <NuxtLink to="/create" class="text-[#795b43] underline hover:text-[#49382f]">สร้างเลย</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.birthday-background {
  min-height: 100vh;
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
</style>
