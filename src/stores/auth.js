import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import axios, { getToken, setToken, clearToken } from '../utils/axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)

  const router = useRouter()

  const fetchUser = async () => {
    try {
      const { data } = await axios.get('/api/user')

      user.value = data
    } catch (error) {
      if (error.response.status === 409) {
        router.push({ name: 'verify-email' })
      }
    }
  }

  const login = async (processing, errors, { ...data }) => {
    processing.value = true
    errors.value = {}

    try {
      const response = await axios.post('/login', data)

      // Guardar token
      setToken(response.data.access_token)

      // Obtener datos del usuario
      user.value = response.data.user

      router.push({ name: 'dashboard' })
    } catch (error) {
      if (error.response.status === 422) {
        errors.value = error.response.data.errors
      }
    } finally {
      processing.value = false
    }
  }

  const register = async (processing, errors, { ...data }) => {
    processing.value = true
    errors.value = {}

    try {
      const response = await axios.post('/register', data)

      // Guardar token
      setToken(response.data.access_token)

      // Obtener datos del usuario
      user.value = response.data.user

      router.push({ name: 'dashboard' })
    } catch (error) {
      if (error.response.status === 422) {
        errors.value = error.response.data.errors
      }
    } finally {
      processing.value = false
    }
  }

  const forgotPassword = async (processing, errors, status, email) => {
    processing.value = true
    errors.value = {}
    status.value = null

    try {
      const { data } = await axios.post('/forgot-password', { email })

      status.value = data.status
    } catch (error) {
      if (error.response.status === 422) {
        errors.value = error.response.data.errors
      }
    } finally {
      processing.value = false
    }
  }

  const resetPassword = async (processing, errors, status, { ...data }) => {
    processing.value = true
    errors.value = {}
    status.value = null

    try {
      const response = await axios.post('/reset-password', data)

      router.push({
        name: 'login',
        query: { reset: btoa(response.data?.status) },
      })
    } catch (error) {
      if (error.response.status === 422) {
        errors.value = error.response.data.errors
      }
    } finally {
      processing.value = false
    }
  }

  const resendEmailVerification = async (processing, status) => {
    processing.value = true
    status.value = null

    const { data } = await axios.post('/email/verification-notification')

    status.value = data.status

    processing.value = false
  }

  const logout = async () => {
    await axios.post('/logout')

    user.value = null
    clearToken()

    router.push({ name: 'login' })
  }

  const initAuth = async () => {
    const token = getToken()
    if (token) {
      await fetchUser()
    }
  }

  return {
    user,
    isLoggedIn,
    fetchUser,
    initAuth,
    login,
    register,
    forgotPassword,
    resetPassword,
    resendEmailVerification,
    logout,
  }
})
