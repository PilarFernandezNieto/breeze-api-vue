# Laravel API Breeze - Vite + Vue 3 Edition 🏝️

## Introducción

Este repositorio es una implementación del kit de inicio [Laravel API Breeze](https://laravel.com/docs/starter-kits) en [Vue](https://vuejs.org). Todo el sistema de autenticación ya está escrito para ti - potenciado por [Laravel Sanctum](https://laravel.com/docs/sanctum) con **autenticación Bearer token**, permitiéndote comenzar rápidamente a emparejar tu hermoso frontend Vue con un poderoso backend Laravel.

## Setup Recomendado del IDE

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (y desactiva Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Documentación Oficial

### Instalación

#### Backend Laravel

Primero, crea un backend Laravel instalando Laravel API Breeze en una [aplicación Laravel nueva](https://laravel.com/docs/installation) e instalando el scaffolding API de Breeze:

    # Crear la aplicación Laravel...
    laravel new vue-backend

    cd vue-backend

    # Instalar Breeze y dependencias...
    composer require laravel/breeze --dev

    php artisan breeze:install api

    # Ejecutar migraciones de base de datos...
    php artisan migrate

Asegúrate de que las variables de entorno `APP_URL` y `FRONTEND_URL` de tu aplicación estén configuradas en `http://localhost:8000` y `http://localhost:3000`, respectivamente.

Después de definir las variables de entorno apropiadas, puedes servir la aplicación Laravel usando el comando `serve` de Artisan:

    # Servir la aplicación...
    php artisan serve

#### Configuración del Backend para Bearer Tokens

Este frontend espera que tu backend devuelva tokens en formato Bearer. Asegúrate de que tus endpoints devuelvan la estructura correcta:

**Endpoint `/login` (POST)**

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

**Endpoint `/register` (POST)**

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

**Endpoint `/logout` (POST)**

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente'
        ]);
    }

**Endpoint `/api/user` (GET)**

    public function show(Request $request)
    {
        return $request->user();
    }

#### Frontend Vue

A continuación, clona este repositorio e instala sus dependencias:

    # Clonar el repositorio...
    git clone <tu-repositorio>

    cd breeze-api-vue

    # Instalar dependencias con npm (o yarn)...
    npm install
    # o
    yarn install

Copia el archivo .env.example a .env y proporciona la URL de tu backend:

    # Copiar archivo de configuración...
    cp .env.example .env

Modifica el archivo .env con la URL correcta:

    VITE_APP_NAME="Laravel Breeze"
    VITE_APP_BACKEND_URL=http://localhost:8000

Finalmente, ejecuta la aplicación:

    # Ejecutar modo desarrollo...
    npm run dev
    # o
    yarn dev

La aplicación estará disponible en `http://localhost:5173` o en el puerto que Vite indique en la terminal.

> Nota: Se recomienda usar `localhost` durante el desarrollo local de tu backend y frontend para evitar problemas CORS de "Same-Origin".

### Flujo de Autenticación

#### Cómo funciona la autenticación Bearer token

1. **Login/Registro**: Las credenciales del usuario se envían al endpoint `/login` o `/register`. El backend devuelve un `access_token` que se almacena automáticamente en `localStorage`.

2. **Peticiones Autenticadas**: Cada petición a la API incluye automáticamente el token en el header `Authorization: Bearer {token}` a través de un interceptor de axios configurado en axios.js.

3. **Recuperación de Sesión**: Cuando la app carga (o se recarga la página), ejecuta automáticamente `auth.initAuth()` en App.vue, que recupera la sesión del usuario desde el token almacenado en localStorage.

4. **Logout**: Cuando el usuario cierra sesión, se envía una petición a `/logout` que invalida el token en el backend, y se limpia el token de localStorage en el frontend.

5. **Tokens Expirados o Inválidos**: Si el servidor devuelve un error 401, el interceptor de axios limpia el token y redirige automáticamente a la página de login.

#### Integración con el código

Los cambios realizados para soportar Bearer tokens están en:

- **axios.js** - Configuración de axios con interceptores que añaden el token Bearer y manejan errores 401
- **auth.js** - Store de Pinia con métodos de login, register, logout e initAuth
- **App.vue** - Componente raíz que recupera la sesión al cargar la app
- **index.js** - Router con guardías de autenticación

### Middleware de Autenticación

Esta aplicación Vue contiene un middleware de autenticación personalizado, diseñado para abstraer toda la lógica de autenticación de tus vistas. El middleware puede usarse para acceder al usuario actualmente autenticado:

#### Crear una ruta protegida

    // router/index.js
    {
        path: '/pagina-ejemplo',
        name: 'pagina-ejemplo',
        meta: { title: 'Página Ejemplo', middleware: ['auth'] },
        component: () => import('../views/PaginaEjemplo.vue'),
    },

Los valores posibles en `middleware` son:
- `'auth'` - Requiere que el usuario esté autenticado
- `'guest'` - Requiere que el usuario NO esté autenticado (para login/register)
- `'verified'` - Requiere que el email esté verificado

#### Usar el store de autenticación en una vista

    <!-- views/PaginaEjemplo.vue -->
    <script setup>
    import AuthenticatedLayout from '../layouts/AuthenticatedLayout.vue'
    import { useAuthStore } from '../stores/auth'

    const { user, logout } = useAuthStore()
    </script>

    <template>
      <AuthenticatedLayout>
        <div class="py-12">
          <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 flex gap-10">
            <p>Bienvenido, {{ user?.name }}</p>

            <button @click="logout()">Cerrar sesión</button>
          </div>
        </div>
      </AuthenticatedLayout>
    </template>

    <style scoped></style>

> Nota: Deberás usar [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) (`user?.name` en lugar de `user.name`) al acceder a propiedades del objeto usuario.

### Gestión de Autenticación

#### Helpers de Token

Puedes gestionar manualmente los tokens usando los helpers expuestos desde `utils/axios.js`:

    import { getToken, setToken, clearToken } from '../utils/axios'

    // Obtener token actual
    const token = getToken()

    // Configurar token manualmente
    setToken('1|abc123...')

    // Limpiar token
    clearToken()

#### Store de Autenticación

    import { useAuthStore } from '../stores/auth'

    const auth = useAuthStore()

    // Propiedades
    auth.user              // Objeto del usuario actual o null
    auth.isLoggedIn        // Boolean (true si user !== null)

    // Métodos
    await auth.login({ email, password })           // Iniciar sesión
    await auth.register({ name, email, password })  // Registrar usuario
    await auth.logout()                             // Cerrar sesión
    await auth.fetchUser()                          // Refrescar datos del usuario
    await auth.initAuth()                           // Recuperar sesión desde token almacenado
    await auth.forgotPassword(email)                // Solicitar reset de contraseña
    await auth.resetPassword({ ...data })           // Resetear contraseña
    await auth.resendEmailVerification()            // Reenviar verificación de email

## Scripts Disponibles

    # Modo desarrollo con hot reload
    npm run dev

    # Build para producción
    npm run build

    # Previsualizar build
    npm run preview

    # Lint y arreglar código
    npm run lint

## Estructura del Proyecto

    src/
    ├── assets/              # Estilos globales y assets estáticos
    ├── components/          # Componentes reutilizables
    ├── layouts/             # Layouts principales
    ├── router/              # Configuración del router con middlewares
    ├── stores/              # Stores de Pinia (autenticación)
    ├── utils/               # Utilidades (axios, helpers)
    ├── views/               # Vistas/páinas de la aplicación
    │   ├── auth/            # Vistas de autenticación (login, register, etc)
    │   ├── Dashboard.vue    # Página de dashboard autenticada
    │   └── Home.vue         # Página de inicio
    ├── App.vue              # Componente raíz
    └── main.js              # Punto de entrada de la app

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Laravel API Breeze Vite + Vue 3 es software de código abierto licenciado bajo la licencia MIT.

