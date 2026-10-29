<script setup lang="ts">
/**
 * CreatePageForm — ฟอร์มสร้างหน้าวันเกิด
 * ต้องการแค่วันเกิด (+ ชื่อเล่นไม่บังคับ)
 */
import { useBirthdayPage } from '../composables/useBirthdayPage'
import type { CreateBirthdayPageResponse } from '../../shared/types'

const emit = defineEmits<{
  created: [result: CreateBirthdayPageResponse]
}>()

const { loading, error, createPage } = useBirthdayPage()

const displayName = ref('')
const dateOfBirth = ref('')
const fieldErrors = ref<Record<string, string>>({})
const result = ref<CreateBirthdayPageResponse | null>(null)
const copied = ref(false)
const copiedLink = ref(false)
const copiedOwner = ref(false)

const today = new Date().toISOString().split('T')[0]!

// สร้าง base URL
const requestUrl = useRequestURL()
const baseUrl = computed(() => {
  if (typeof window !== 'undefined') return window.location.origin
  return requestUrl.origin
})

function validate(): boolean {
  fieldErrors.value = {}
  if (!dateOfBirth.value) {
    fieldErrors.value.dob = 'กรุณาเลือกวันเกิด'
  }
  if (displayName.value.length > 60) {
    fieldErrors.value.name = 'ชื่อยาวเกินไป (สูงสุด 60 ตัวอักษร)'
  }
  return Object.keys(fieldErrors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  const res = await createPage({
    displayName: displayName.value.trim() || undefined,
    dateOfBirth: dateOfBirth.value,
  })
  if (res) {
    result.value = res
    emit('created', res)
  }
}

function copyToken() {
  if (result.value?.ownerToken && typeof navigator !== 'undefined') {
    navigator.clipboard.writeText(result.value.ownerToken).then(() => {
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    })
  }
}

function copyPageLink() {
  if (result.value?.page.id && typeof navigator !== 'undefined') {
    const url = `${window.location.origin}/wish/${result.value.page.id}`
    navigator.clipboard.writeText(url).then(() => {
      copiedLink.value = true
      setTimeout(() => (copiedLink.value = false), 2000)
    })
  }
}

function copyOwnerLink() {
  if (result.value?.page.id && typeof navigator !== 'undefined') {
    const url = `${window.location.origin}/owner/${result.value.page.id}`
    navigator.clipboard.writeText(url).then(() => {
      copiedOwner.value = true
      setTimeout(() => (copiedOwner.value = false), 2000)
    })
  }
}
</script>

<template>
  <!-- หลังสร้างเสร็จ -->
  <div v-if="result" class="space-y-4">
    <div class="rounded-lg border border-[#d4c4b0] bg-[#fdf9f4] p-6 text-center">
      <div class="text-3xl">🎂</div>
      <h2 class="mt-2 font-playfair text-2xl text-[#49382f]">สร้างหน้าวันเกิดแล้ว!</h2>
      <p class="mt-1 text-sm text-[#8C7868]">{{ result.page.displayName }}</p>
    </div>

    <!-- ลิงก์สาธารณะ (แชร์ให้เพื่อน) -->
    <div class="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4">
      <p class="mb-2 text-sm font-semibold text-emerald-900">
        📤 ลิงก์สำหรับแชร์ให้เพื่อน
      </p>
      <p class="mb-3 text-xs text-emerald-700">
        ส่งลิงก์นี้ให้เพื่อนเพื่อให้เขามาเขียนการ์ดอวยพร
      </p>
      <div class="flex items-center gap-2">
        <div class="flex-1 break-all rounded bg-white px-3 py-2 text-sm text-emerald-700 border border-emerald-300 font-mono">
          {{ baseUrl }}/wish/{{ result.page.id }}
        </div>
        <button
          type="button"
          class="shrink-0 rounded bg-emerald-600 px-3 py-2 text-xs text-white transition hover:bg-emerald-700"
          @click="copyPageLink"
        >
          {{ copiedLink ? '✓ คัดลอก' : 'คัดลอก' }}
        </button>
      </div>
    </div>

    <!-- ลิงก์ส่วนตัว (เจ้าของเท่านั้น) -->
    <div class="rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
      <p class="mb-2 text-sm font-semibold text-amber-900">
        🔐 ลิงก์ส่วนตัวของคุณ
      </p>
      <p class="mb-3 text-xs text-amber-700">
        เก็บลิงก์นี้ไว้เพื่อกลับมาดูการ์ดได้ทุกเมื่อ — อย่าแชร์ให้ใครเด็ดขาด!
      </p>
      <div class="flex items-center gap-2 mb-3">
        <div class="flex-1 break-all rounded bg-white px-3 py-2 text-sm text-amber-700 border border-amber-300 font-mono">
          {{ baseUrl }}/owner/{{ result.page.id }}
        </div>
        <button
          type="button"
          class="shrink-0 rounded bg-amber-600 px-3 py-2 text-xs text-white transition hover:bg-amber-700"
          @click="copyOwnerLink"
        >
          {{ copiedOwner ? '✓' : 'คัดลอก' }}
        </button>
      </div>
      <details class="text-xs">
        <summary class="cursor-pointer text-amber-700 hover:text-amber-900 select-none">
          หรือเก็บ Token แทน (สำหรับคนที่เข้าใจเทคนิค)
        </summary>
        <div class="mt-2 flex items-center gap-2">
          <code class="flex-1 break-all rounded bg-amber-100 px-2 py-1 text-amber-800 text-xs">
            {{ result.ownerToken }}
          </code>
          <button
            type="button"
            class="shrink-0 rounded bg-amber-600 px-2 py-1 text-xs text-white transition hover:bg-amber-700"
            @click="copyToken"
          >
            {{ copied ? '✓' : 'Copy' }}
          </button>
        </div>
      </details>
    </div>
  </div>

  <!-- ฟอร์มสร้างหน้า -->
  <form v-else class="space-y-5" novalidate @submit.prevent="handleSubmit">
    <div>
      <label for="displayName" class="mb-1 block text-sm text-[#49382f]">
        ชื่อที่แสดงในหน้าวันเกิด (ไม่บังคับ)
      </label>
      <input
        id="displayName"
        v-model="displayName"
        type="text"
        maxlength="60"
        placeholder="เช่น วันเกิดของน้องมิ้ว"
        class="w-full rounded border border-[#d4c4b0] bg-[#F6F3ED] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
        :aria-describedby="fieldErrors.name ? 'name-error' : undefined"
      />
      <p v-if="fieldErrors.name" id="name-error" class="mt-1 text-xs text-red-500" role="alert">
        {{ fieldErrors.name }}
      </p>
    </div>

    <div>
      <label for="dateOfBirth" class="mb-1 block text-sm text-[#49382f]">
        วันเกิด <span class="text-red-400" aria-hidden="true">*</span>
      </label>
      <input
        id="dateOfBirth"
        v-model="dateOfBirth"
        type="date"
        :max="today"
        class="w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
        :class="fieldErrors.dob ? 'border-red-400 bg-red-50' : 'border-[#d4c4b0] bg-[#F6F3ED]'"
        :aria-describedby="fieldErrors.dob ? 'dob-error' : undefined"
        :aria-invalid="!!fieldErrors.dob"
      />
      <p v-if="fieldErrors.dob" id="dob-error" class="mt-1 text-xs text-red-500" role="alert">
        {{ fieldErrors.dob }}
      </p>
    </div>

    <p v-if="error" class="rounded bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
      {{ error }}
    </p>

    <button
      type="submit"
      :disabled="loading"
      class="w-full rounded bg-[#795b43] py-3 text-sm font-medium text-white transition hover:bg-[#5c4535] focus:outline-none focus:ring-2 focus:ring-[#795b43] focus:ring-offset-2 disabled:opacity-50"
    >
      {{ loading ? 'กำลังสร้าง...' : 'สร้างหน้าวันเกิด 🎂' }}
    </button>
  </form>
</template>
