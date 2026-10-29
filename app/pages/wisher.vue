<script setup lang="ts">
// Legacy route — redirect to /wish
const router = useRouter()
onMounted(() => router.replace('/wish'))
</script>
<template>
  <div class="py-12 text-center text-sm text-[#8C7868]">กำลังเปลี่ยนหน้า...</div>
</template>
