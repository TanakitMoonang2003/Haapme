<script setup lang="ts">
/**
 * OwnerTokenInput — prompts the owner to enter their token.
 * Emits 'confirmed' when a non-empty token is entered.
 * This is the TEMPORARY auth UI until real login is implemented.
 */
const emit = defineEmits<{
  confirmed: [token: string]
}>()

const token = ref('')
const error = ref('')

function handleConfirm() {
  const t = token.value.trim()
  if (!t) {
    error.value = 'กรุณาใส่ owner token'
    return
  }
  error.value = ''
  emit('confirmed', t)
}
</script>

<template>
  <div class="rounded-lg border border-amber-200 bg-amber-50 p-5">
    <p class="mb-1 text-sm font-semibold text-[#49382f]">เข้าสู่ระบบเจ้าของหน้า</p>
    <p class="mb-3 text-xs text-amber-700">
      ใส่ Owner Token ที่ได้รับตอนสร้างหน้าวันเกิด
      (ระบบนี้เป็นแบบชั่วคราว — จะถูกแทนที่ด้วยระบบ login ในอนาคต)
    </p>
    <div class="flex gap-2">
      <input
        v-model="token"
        type="password"
        placeholder="วาง token ที่นี่..."
        class="flex-1 rounded border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/40"
        :aria-describedby="error ? 'token-error' : undefined"
        :aria-invalid="!!error"
        @keydown.enter="handleConfirm"
      />
      <button
        type="button"
        class="rounded bg-[#795b43] px-4 py-2 text-sm text-white transition hover:bg-[#5c4535]"
        @click="handleConfirm"
      >
        ยืนยัน
      </button>
    </div>
    <p v-if="error" id="token-error" class="mt-1 text-xs text-red-500" role="alert">{{ error }}</p>
  </div>
</template>
