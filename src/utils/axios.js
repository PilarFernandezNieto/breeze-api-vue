import Axios from 'axios'

// Helpers para gestionar el token
export const getToken = () => localStorage.getItem('access_token')
export const setToken = (token) => localStorage.setItem('access_token', token)
export const clearToken = () => localStorage.removeItem('access_token')

const axios = Axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_URL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Interceptor para añadir el token Bearer en cada petición
axios.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      // Redirigir a login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default axios
