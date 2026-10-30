<script setup lang="ts">
/**
 * BirthdayDateInput — ช่องวันเกิดแบบพิมพ์ช่องเดียว (วว/ดด/ปปปป)
 * - ใส่ / ให้อัตโนมัติ
 * - พิมพ์เป็น พ.ศ. หรือ ค.ศ. ก็ได้ (ปี ≥ 2400 ถือเป็น พ.ศ.)
 * - v-model เป็น ISO "YYYY-MM-DD" (ค่าเดียวกับ input type="date" เดิม) หรือ '' เมื่อยังไม่ถูกต้อง
 */
const props = defineProps<{
  modelValue: string
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

const text = ref('')
const hint = ref('')
const preview = ref('')
const nativePicker = ref<HTMLInputElement | null>(null)

const pad = (n: number) => String(n).padStart(2, '0')

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDigits(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  let out = d.slice(0, 2)
  if (d.length > 2) out += '/' + d.slice(2, 4)
  if (d.length > 4) out += '/' + d.slice(4)
  return out
}

/** แปลงข้อความ → { iso, hint, preview } */
function parse(value: string) {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return { iso: '', hint: '', preview: '' }

  const day = Number(m[1])
  const month = Number(m[2])
  let year = Number(m[3])
  const isBE = year >= 2400
  if (isBE) year -= 543

  const date = new Date(year, month - 1, day)
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  if (!valid || year < 1900) {
    return { iso: '', hint: 'วันที่นี้ไม่ถูกต้อง ลองตรวจสอบอีกครั้ง', preview: '' }
  }

  const iso = `${year}-${pad(month)}-${pad(day)}`
  if (iso > todayIso()) {
    return { iso: '', hint: 'วันเกิดต้องไม่เป็นวันในอนาคต', preview: '' }
  }

  return { iso, hint: '', preview: `${day} ${MONTHS[month - 1]} ${year + 543}` }
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  text.value = formatDigits(el.value)
  el.value = text.value

  const r = parse(text.value)
  hint.value = r.hint
  preview.value = r.preview
  emit('update:modelValue', r.iso)
}

function openPicker() {
  const el = nativePicker.value
  if (!el) return
  if (typeof el.showPicker === 'function') el.showPicker()
  else el.focus()
}

/** เลือกจากปฏิทินของระบบ (ค่าเป็น YYYY-MM-DD) */
function onNativePick(e: Event) {
  const iso = (e.target as HTMLInputElement).value
  if (iso) setFromIso(iso, true)
}

function setFromIso(iso: string, notify: boolean) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return
  text.value = `${pad(d)}/${pad(m)}/${y}`
  const r = parse(text.value)
  hint.value = r.hint
  preview.value = r.preview
  if (notify) emit('update:modelValue', r.iso)
}

// ค่าเริ่มต้น / รีเซ็ตจากภายนอก
onMounted(() => {
  if (props.modelValue) setFromIso(props.modelValue, false)
})
watch(
  () => props.modelValue,
  (v) => {
    if (!v) {
      // ถ้าถูกล้างจากภายนอกและผู้ใช้ไม่ได้กำลังพิมพ์ค้างไว้ ให้ล้างช่อง
      if (parse(text.value).iso) {
        text.value = ''
        hint.value = ''
        preview.value = ''
      }
    } else if (v !== parse(text.value).iso) {
      setFromIso(v, false)
    }
  },
)

const message = computed(() => hint.value || props.error || '')
const invalid = computed(() => !!message.value)
</script>

<template>
  <div>
    <div class="relative">
      <input
        id="dateOfBirth"
        :value="text"
        type="text"
        inputmode="numeric"
        autocomplete="bday"
        placeholder="วว/ดด/ปปปป"
        maxlength="10"
        class="w-full rounded border px-3 py-2 pr-10 text-sm tracking-wide text-[#49382f] outline-none placeholder:text-[#b9a999] focus:ring-2 focus:ring-[#795b43]/40"
        :class="invalid ? 'border-red-400 bg-red-50' : 'border-[#d4c4b0] bg-[#F6F3ED]'"
        :aria-describedby="invalid ? 'dob-error' : preview ? 'dob-preview' : undefined"
        :aria-invalid="invalid"
        @input="onInput"
      />

      <!-- ปุ่มปฏิทิน (ไม่บังคับใช้) -->
      <button
        type="button"
        class="flex items-center justify-center rounded text-[#8C7868] transition hover:bg-[#eee6dc] hover:text-[#49382f] focus:outline-none focus:ring-2 focus:ring-[#795b43]/40"
        style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px"
        aria-label="เปิดปฏิทิน"
        @click="openPicker"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>

      <input
        ref="nativePicker"
        type="date"
        :max="todayIso()"
        :value="modelValue"
        style="position: absolute; right: 0; bottom: 0; width: 1px; height: 1px; padding: 0; border: 0; opacity: 0; overflow: hidden; pointer-events: none"
        tabindex="-1"
        aria-hidden="true"
        @change="onNativePick"
      />
    </div>

    <p v-if="message" id="dob-error" class="mt-1 text-xs text-red-500" role="alert">
      {{ message }}
    </p>
    <p v-else-if="preview" id="dob-preview" class="mt-1 text-xs text-[#8C7868]">
      {{ preview }}
    </p>
    <p v-else class="mt-1 text-xs text-[#b9a999]">พิมพ์เป็น พ.ศ. หรือ ค.ศ. ก็ได้</p>
  </div>
</template>