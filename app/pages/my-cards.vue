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

onMounted(async () => {
  const ids = getMyCardIds()
  cards.value = ids.map(id => ({ id, card: null, loading: true, error: false }))
  initialised.value = true

  await Promise.all(
    cards.value.map(async (entry, i) => {
      const res = await loadMyCard(entry.id)
      if (res) {
        cards.value[i]!.card = res.card
      } else {
        cards.value[i]!.error = true
      }
      cards.value[i]!.loading = false
    })
  )
})
</script>

<template>
  <div class="birthday-background">
    <div class="mx-auto max-w-lg px-4 py-12">
      <div class="mb-8 text-center">
        <div class="mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
          <span class="dot" />
          <span class="text-xs tracking-widest text-[#8C7868]">MY CARDS</span>
        </div>
        <h1 class="font-playfair text-4xl text-[#49382f]">การ์ดของฉัน</h1>
        <p class="mt-2 text-sm text-[#8C7868]">คำอวยพรที่คุณเคยส่งไป</p>
      </div>

      <!-- No cards yet -->
      <div v-if="initialised && cards.length === 0" class="text-center py-12">
        <div class="text-4xl">📭</div>
        <p class="mt-3 text-sm text-[#8C7868]">คุณยังไม่ได้ส่งการ์ดใดๆ</p>
        <NuxtLink to="/wish" class="mt-3 block text-sm text-[#795b43] underline">
          ส่งคำอวยพรแรก →
        </NuxtLink>
      </div>

      <!-- Card list -->
      <div v-else class="space-y-4">
        <div v-for="entry in cards" :key="entry.id">
          <div v-if="entry.loading" class="rounded-lg border border-[#eee6dc] bg-white p-5 text-center text-sm text-[#b8a697]">
            กำลังโหลด...
          </div>
          <div v-else-if="entry.error" class="rounded-lg border border-red-100 bg-red-50 p-5 text-center text-sm text-red-500">
            ไม่สามารถโหลดการ์ดได้ (อาจถูกลบหรือ token หมดอายุ)
          </div>
          <GreetingCardDisplay v-else-if="entry.card" :card="entry.card" />
        </div>
      </div>
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
