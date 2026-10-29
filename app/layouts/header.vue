
<template>
  <div class="min-h-screen bg-[#F7F2EA]">
    <nav
      class="sticky top-0 z-50 border-b border-[#49382f]/10
             bg-[#F7F2EA]/95 backdrop-blur-sm"
    >
      <div
        class="mx-auto flex max-w-7xl items-center
               justify-between px-6 py-5 md:px-10"
      >
        <NuxtLink to="/" class="group shrink-0">
          <h1
            class="font-playfair text-2xl font-semibold
                   tracking-wide text-[#49382f]
                   transition-opacity group-hover:opacity-70"
          >
            A Little Wish
          </h1>
          <p class="mt-1 text-xs tracking-widest text-[#8C7868]">
            A LITTLE SPACE FOR YOUR WISHES
          </p>
        </NuxtLink>

        <div
          class="flex items-center gap-5 text-sm
                 text-[#49382f] sm:gap-8 md:text-base"
        >
          <NuxtLink
            to="/"
            exact-active-class="active"
            class="nav-link"
          >
            <span class="hidden sm:inline">หน้าแรก</span>
            <span class="sm:hidden">Home</span>
          </NuxtLink>

          <NuxtLink
            to="/wish"
            active-class="active"
            class="nav-link"
          >
            <span class="hidden sm:inline">ส่งคำอวยพร</span>
            <span class="sm:hidden">Send Wish</span>
          </NuxtLink>

          <NuxtLink
            to="/create"
            active-class="active"
            class="nav-link"
          >
            <span class="hidden sm:inline">สร้างหน้าวันเกิด</span>
            <span class="sm:hidden">Create</span>
          </NuxtLink>

          <NuxtLink
            to="/my-cards"
            active-class="active"
            class="nav-link"
          >
            <span class="hidden sm:inline">การ์ดของฉัน</span>
            <span class="sm:hidden">My Cards</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <main class="mx-auto max-w-7xl px-6 py-8 md:px-10">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.nav-link {
  position: relative;
  display: inline-block;
  white-space: nowrap;
  padding-top: 6px;
  padding-bottom: 6px;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #9b7862;
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1.5px;
  background-color: #49382f;
  transition: width 0.25s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.nav-link.active {
  font-weight: 600;
}
</style>
