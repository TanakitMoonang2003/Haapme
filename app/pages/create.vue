<script setup lang="ts">
/**
 * /create — Birthday owner creates their page.
 */
useHead({ title: 'สร้างหน้าวันเกิด — A Little Wish' })
</script>

<template>
  <div class="birthday-background">
    <div class="mx-auto max-w-lg px-4 py-12">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="mb-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
          <span class="dot" />
          <span class="text-xs tracking-widest text-[#8C7868]">BIRTHDAY OWNER</span>
        </div>
        <h1 class="font-playfair text-4xl text-[#49382f]">สร้างหน้าวันเกิด</h1>
        <p class="mt-2 text-sm text-[#8C7868]">
          แค่ระบุวันเกิด — เพื่อนๆ จะส่งคำอวยพรมาให้คุณได้เลย
        </p>
      </div>

      <div class="rounded-xl border border-[#eee6dc] bg-white p-6 shadow-sm">
        <CreatePageForm />
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
