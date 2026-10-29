<script setup lang="ts">
import { useGreetingCard } from '../composables/useGreetingCard'
import type { CreateGreetingCardResponse } from '../../shared/types'

const props = defineProps<{
  birthdayPageId: string
  displayName?: string
}>()

const emit = defineEmits<{
  submitted: [result: CreateGreetingCardResponse]
}>()

const config = useRuntimeConfig()
const MAX_MSG = (config.public.maxMessageLength as number) || 500
const { loading, error, submitCard, getVisitorToken } = useGreetingCard()

// ตรวจว่าหน้านี้มีพร้อมเพย์ไหม
const hasPromptpay = ref(false)
onMounted(async () => {
  try {
    const res = await $fetch<{ hasPromptpay: boolean }>(
      `/api/pages/${props.birthdayPageId}/has-promptpay`
    )
    hasPromptpay.value = res.hasPromptpay
  } catch { hasPromptpay.value = false }
})

// Form state
const senderName = ref('')
const message = ref('')
const currentYear = new Date().getFullYear()
const targetYear = ref(currentYear)
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + i)
const wantToContribute = ref(false)
const contributionAmountInput = ref<string>('')
const fieldErrors = ref<Record<string, string>>({})

// Result state
const result = ref<CreateGreetingCardResponse | null>(null)
const submitted = ref(false)

// Payment confirm state
const payStatus = ref<string>('pending')
const confirmLoading = ref(false)
const confirmError = ref('')
const showThankYouPopup = ref(false)

function validate(): boolean {
  fieldErrors.value = {}
  if (!senderName.value.trim()) fieldErrors.value.senderName = 'กรุณาระบุชื่อผู้ส่ง'
  if (!message.value.trim()) {
    fieldErrors.value.message = 'กรุณาเขียนข้อความ'
  } else if (message.value.length > MAX_MSG) {
    fieldErrors.value.message = `ข้อความยาวเกินไป (สูงสุด ${MAX_MSG} ตัวอักษร)`
  }
  if (wantToContribute.value) {
    const raw = String(contributionAmountInput.value).trim()
    const amt = Number(raw)
    if (!raw || isNaN(amt) || amt <= 0 || !Number.isInteger(amt)) {
      fieldErrors.value.contribution = 'กรุณาระบุจำนวนเงินเป็นจำนวนเต็มบวก (บาท)'
    }
  }
  return Object.keys(fieldErrors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  const res = await submitCard({
    birthdayPageId: props.birthdayPageId,
    senderName: senderName.value.trim(),
    message: message.value.trim(),
    targetYear: targetYear.value,
    ...(wantToContribute.value && String(contributionAmountInput.value).trim()
      ? { contributionAmount: Number(contributionAmountInput.value) }
      : {}),
  })
  if (res) {
    result.value = res
    submitted.value = true
    if (res.contribution) payStatus.value = res.contribution.status
    emit('submitted', res)
  }
}

// ผู้อวยพรกด "โอนแล้ว"
async function handleSelfConfirm() {
  if (!result.value?.contribution) return
  confirmLoading.value = true
  confirmError.value = ''
  try {
    const visitorToken = getVisitorToken(result.value.card.id)
    await $fetch(`/api/contributions/${result.value.contribution.id}/self-confirm`, {
      method: 'POST',
      headers: visitorToken ? { Authorization: `Bearer ${visitorToken}` } : {},
    })
    payStatus.value = 'paid_unverified'
    showThankYouPopup.value = true
  } catch (e: unknown) {
    confirmError.value =
      (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาด'
  } finally {
    confirmLoading.value = false
  }
}
</script>

<template>
  <!-- ===== Popup ขอบคุณ ===== -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showThankYouPopup"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        @click.self="showThankYouPopup = false"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div class="mb-3 text-5xl">🎁</div>
          <h3 class="font-playfair text-2xl text-[#49382f]">ขอบคุณมากเลย!</h3>
          <p class="mt-2 text-sm text-[#8C7868]">
            ของขวัญของคุณกำลังรอ<br>
            <span class="font-semibold text-[#49382f]">{{ props.displayName ?? 'เจ้าของ' }}</span>
            มารับอยู่นะ 🥰
          </p>
          <p class="mt-3 text-xs text-emerald-700">
            บันทึกการแจ้งโอนสำเร็จแล้ว เจ้าของจะเห็นว่าคุณแนบของขวัญมา
          </p>
          <button
            class="mt-5 w-full rounded-full bg-[#795b43] py-2.5 text-sm font-medium text-white transition hover:bg-[#5c4535]"
            @click="showThankYouPopup = false"
          >
            สำเร็จ
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ===== หลังส่งการ์ดสำเร็จ ===== -->
  <div v-if="submitted && result" class="space-y-5">
    <!-- การ์ดที่ส่ง -->
    <div class="rounded-lg border border-[#d4c4b0] bg-[#fdf9f4] p-6 text-center">
      <div class="mb-2 text-3xl">💌</div>
      <h2 class="font-playfair text-2xl text-[#49382f]">ส่งคำอวยพรแล้ว!</h2>
      <p class="mt-1 text-sm text-[#8C7868]">
        <span v-if="result.card.targetYear > currentYear">
          จะเปิดอ่านได้ในปี {{ result.card.targetYear }}
        </span>
        <span v-else>คำอวยพรถูกส่งเรียบร้อยแล้ว</span>
      </p>
    </div>

    <!-- Preview การ์ด -->
    <div class="rounded-lg border border-[#eee6dc] bg-white p-5 shadow-sm">
      <p class="mb-1 text-xs tracking-widest text-[#b8a697]">คำอวยพรของคุณ</p>
      <p class="font-playfair text-lg text-[#49382f]">{{ result.card.senderName }}</p>
      <p class="mt-2 whitespace-pre-wrap text-sm text-[#5c4535]">{{ result.card.message }}</p>
    </div>

    <!-- ส่วนของขวัญ -->
    <div v-if="result.contribution" class="rounded-lg border border-[#eee6dc] bg-white p-5 shadow-sm">
      <p class="mb-3 text-xs tracking-widest text-[#b8a697]">ของขวัญ</p>

      <!-- paid -->
      <div v-if="payStatus === 'paid'" class="text-center">
        <div class="text-2xl">✅</div>
        <p class="mt-1 text-sm font-semibold text-emerald-700">ได้รับเงินแล้ว</p>
        <p class="text-xs text-[#8C7868]">฿{{ result.contribution.amount }}</p>
      </div>

      <!-- paid_unverified — ผู้ส่งแจ้งว่าโอนแล้ว -->
      <div v-else-if="payStatus === 'paid_unverified'" class="text-center">
        <div class="text-2xl">✅</div>
        <p class="mt-1 text-sm font-semibold text-emerald-700">แจ้งโอนเงินสำเร็จแล้ว</p>
        <p class="mt-1 text-xs text-[#8C7868]">เจ้าของจะเห็นว่าคุณมีของขวัญแนบมา</p>
        <p class="text-xs text-[#8C7868]">฿{{ result.contribution.amount }}</p>
      </div>

      <!-- pending — แสดง QR + ปุ่มโอนแล้ว -->
      <div v-else>
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-semibold text-[#49382f]">฿{{ result.contribution.amount }}</span>
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
            รอชำระเงิน
          </span>
        </div>

        <!-- QR Code -->
        <div v-if="result.contribution.qrCodeData" class="flex flex-col items-center py-2">
          <img
            :src="result.contribution.qrCodeData"
            alt="QR Code PromptPay"
            class="h-56 w-56 rounded-lg border border-[#eee6dc] shadow-sm"
          />
          <p class="mt-2 text-xs text-[#b8a697]">สแกนด้วยแอปธนาคารแล้วกดปุ่มด้านล่าง</p>
          <p class="text-xs text-amber-600">
            หมดอายุ {{ new Date(result.contribution.qrExpiresAt).toLocaleTimeString('th-TH') }}
          </p>
        </div>

        <!-- ปุ่ม "โอนแล้ว" -->
        <button
          :disabled="confirmLoading"
          class="mt-4 w-full rounded-full bg-emerald-600 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          @click="handleSelfConfirm"
        >
          {{ confirmLoading ? 'กำลังบันทึก...' : '✅ โอนเงินสำเร็จแล้ว' }}
        </button>
        <p v-if="confirmError" class="mt-1 text-center text-xs text-red-500">{{ confirmError }}</p>
      </div>
    </div>
  </div>

  <!-- ===== ฟอร์มส่งการ์ด ===== -->
  <form v-else class="space-y-5" novalidate @submit.prevent="handleSubmit">
    <div>
      <label for="senderName" class="mb-1 block text-sm text-[#49382f]">
        ชื่อผู้ส่ง <span class="text-red-400">*</span>
      </label>
      <input
        id="senderName"
        v-model="senderName"
        type="text"
        maxlength="60"
        autocomplete="name"
        placeholder="ชื่อของคุณ..."
        class="w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
        :class="fieldErrors.senderName ? 'border-red-400 bg-red-50' : 'border-[#d4c4b0] bg-[#F6F3ED]'"
      />
      <p v-if="fieldErrors.senderName" class="mt-1 text-xs text-red-500" role="alert">
        {{ fieldErrors.senderName }}
      </p>
    </div>

    <div>
      <label for="message" class="mb-1 block text-sm text-[#49382f]">
        ข้อความคำอวยพร <span class="text-red-400">*</span>
      </label>
      <textarea
        id="message"
        v-model="message"
        rows="5"
        :maxlength="MAX_MSG"
        placeholder="เขียนคำอวยพรของคุณที่นี่..."
        class="w-full resize-y rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
        :class="fieldErrors.message ? 'border-red-400 bg-red-50' : 'border-[#d4c4b0] bg-[#F6F3ED]'"
      />
      <div class="mt-1 flex justify-end">
        <span class="text-xs" :class="message.length > MAX_MSG ? 'text-red-500' : 'text-[#b8a697]'">
          {{ message.length }}/{{ MAX_MSG }}
        </span>
      </div>
      <p v-if="fieldErrors.message" class="mt-1 text-xs text-red-500" role="alert">
        {{ fieldErrors.message }}
      </p>
    </div>

    <div>
      <label for="targetYear" class="mb-1 block text-sm text-[#49382f]">
        ปีที่ต้องการให้เปิดอ่าน
      </label>
      <select
        id="targetYear"
        v-model="targetYear"
        class="w-full rounded border border-[#d4c4b0] bg-[#F6F3ED] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
      >
        <option v-for="y in yearOptions" :key="y" :value="y">
          {{ y }}{{ y === currentYear ? ' (ปีนี้)' : ` (ล่วงหน้า ${y - currentYear} ปี)` }}
        </option>
      </select>
      <p v-if="targetYear > currentYear" class="mt-1 text-xs text-amber-600">
        ⏰ เจ้าของจะอ่านได้ในปี {{ targetYear }} เท่านั้น
      </p>
    </div>

    <!-- แนบของขวัญ — แสดงเฉพาะหน้าที่มีพร้อมเพย์ -->
    <div v-if="hasPromptpay" class="rounded-lg border border-[#eee6dc] bg-[#fdf9f4] p-4">
      <label class="flex cursor-pointer items-center gap-3">
        <input v-model="wantToContribute" type="checkbox" class="h-4 w-4 accent-[#795b43]" />
        <span class="text-sm text-[#49382f]">🎁 แนบของขวัญ (ไม่บังคับ)</span>
      </label>
      <div v-if="wantToContribute" class="mt-3">
        <label for="contributionAmount" class="mb-1 block text-xs text-[#8C7868]">
          จำนวนเงิน (บาท) <span class="text-red-400">*</span>
        </label>
        <input
          id="contributionAmount"
          v-model="contributionAmountInput"
          type="number"
          min="1"
          step="1"
          placeholder="เช่น 100"
          class="w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#795b43]/40"
          :class="fieldErrors.contribution ? 'border-red-400 bg-red-50' : 'border-[#d4c4b0] bg-white'"
        />
        <p v-if="fieldErrors.contribution" class="mt-1 text-xs text-red-500" role="alert">
          {{ fieldErrors.contribution }}
        </p>
        <p class="mt-1 text-xs text-[#b8a697]">QR สำหรับชำระเงินจะแสดงหลังส่งการ์ด</p>
      </div>
    </div>

    <p v-if="error" class="rounded bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
      {{ error }}
    </p>

    <button
      type="submit"
      :disabled="loading"
      class="w-full rounded bg-[#795b43] py-3 text-sm font-medium text-white transition hover:bg-[#5c4535] disabled:opacity-50"
    >
      {{ loading ? 'กำลังส่ง...' : 'ส่งคำอวยพร 💌' }}
    </button>
  </form>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
