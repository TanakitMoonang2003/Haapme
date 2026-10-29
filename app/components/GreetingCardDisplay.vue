<script setup lang="ts">
/**
 * GreetingCardDisplay — renders a single greeting card in an envelope style.
 */
import type { GreetingCardPublic } from '../../shared/types'

defineProps<{
  card: GreetingCardPublic
  isAdvance?: boolean
}>()
</script>

<template>
  <div
    class="relative overflow-hidden rounded-lg border border-[#eee6dc] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
    :class="isAdvance ? 'opacity-60' : ''"
  >
    <!-- Envelope decoration lines -->
    <svg
      class="pointer-events-none absolute inset-0 h-full w-full opacity-30"
      viewBox="0 0 400 300"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 0 L200 80 L400 0" stroke="#d4c4b0" stroke-width="1" />
      <path d="M0 300 L200 220 L400 300" stroke="#d4c4b0" stroke-width="1" />
    </svg>

    <div class="relative z-10">
      <!-- Header -->
      <div class="mb-4 flex items-start justify-between">
        <div>
          <p class="text-xs tracking-widest text-[#b8a697]">จาก</p>
          <p class="font-playfair text-lg text-[#49382f]">{{ card.senderName }}</p>
        </div>
        <div class="text-right">
          <p v-if="isAdvance" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
            ล่วงหน้าปี {{ card.targetYear }}
          </p>
          <p v-else class="text-xs text-[#b8a697]">{{ new Date(card.createdAt).toLocaleDateString('th-TH') }}</p>
        </div>
      </div>

      <!-- Message -->
      <p class="whitespace-pre-wrap text-sm leading-relaxed text-[#5c4535]">{{ card.message }}</p>
    </div>
  </div>
</template>
