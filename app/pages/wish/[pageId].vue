<script setup lang="ts">
/**
 * /wish/[pageId] — Visitor sends a greeting card to a specific birthday page.
 */
import { useBirthdayPage } from '../../composables/useBirthdayPage'
import type { CreateGreetingCardResponse } from '../../../shared/types'

const route = useRoute()
const pageId = computed(() => route.params.pageId as string)

useHead({ title: 'ส่งคำอวยพร — A Little Wish' })

const { loading, error, page, loadPage } = useBirthdayPage()

await loadPage(pageId.value)

function handleSubmitted(_result: CreateGreetingCardResponse) {
  // result is handled inside WishForm; nothing extra needed here
}
</script>

<template>
  <div class="birthday-background">
    <div class="mx-auto max-w-lg px-4 py-12">
      <!-- Loading -->
      <div v-if="loading" class="text-center text-sm text-[#8C7868]">กำลังโหลด...</div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600">
        {{ error }}
      </div>

      <!-- Page found -->
      <template v-else-if="page">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
            <span class="dot" />
            <span class="text-xs tracking-widest text-[#8C7868]">LETTERPRESS ATELIER · เขียนการ์ด</span>
          </div>
          <h1 class="font-playfair text-4xl text-[#49382f]">เขียนคำอวยพรวันเกิด</h1>
          <p class="mt-1 text-sm text-[#8C7868]">
            ส่งให้ <span class="font-semibold text-[#49382f]">{{ page.displayName }}</span>
          </p>
          <p v-if="page.daysUntilBirthday === 0" class="mt-1 text-xs text-emerald-600 font-semibold">
            🎂 วันนี้คือวันเกิด!
          </p>
          <p v-else class="mt-1 text-xs text-[#b8a697]">
            อีก {{ page.daysUntilBirthday }} วัน
          </p>
        </div>

        <div class="rounded-xl border border-[#eee6dc] bg-white p-6 shadow-sm">
          <p class="mb-4 text-xs text-[#b8a697]">
            จดจารความรู้สึกดีๆ ลงบนแผ่นกระดาษ เลือกกำหนดเวลาเปิดอ่าน และมอบของขวัญอันทรงคุณค่าแด่ผู้รับ
          </p>
          <WishForm :birthday-page-id="pageId" :display-name="page.displayName" @submitted="handleSubmitted" />
        </div>
      </template>
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
