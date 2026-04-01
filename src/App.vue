<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

// Recuperar usuario al cargar la app (si existe token en localStorage)
onMounted(() => {
  auth.initAuth()
})
</script>

<template>
  <Suspense>
    <RouterView />
  </Suspense>
</template>

<style scoped></style>
