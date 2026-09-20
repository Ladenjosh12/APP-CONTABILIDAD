# App móvil — Contabilidad Facturas (React Native + Expo)

## 1. Instalar dependencias

```powershell
cd mobile
npm install
npx expo install --fix
```

`expo install --fix` ajusta automáticamente las versiones de las librerías
nativas a las que espera tu SDK de Expo instalado (los números de versión de
`package.json` son orientativos).

## 2. Configurar la URL del backend

Edita [`src/api/client.ts`](src/api/client.ts) y pon la IP local de la máquina
donde corre el backend (ver `backend/README.md`, paso 3):

```ts
export const API_BASE_URL = "http://TU_IP_LOCAL:8000";
```

- Desde un móvil físico (con Expo Go), usa la IP de tu PC en la red WiFi (ej. `192.168.1.35`). `localhost` no funciona.
- Desde el emulador de Android, usa `http://10.0.2.2:8000`.
- El móvil y el backend deben estar en la misma red.

## 3. Arrancar la app

```powershell
npx expo start
```

Escanea el código QR con la app **Expo Go** (Android/iOS) o pulsa `a` para
abrir un emulador Android si lo tienes configurado.

## Estructura

```
src/
  api/client.ts              # axios + URL del backend
  types/invoice.ts           # tipos compartidos con el backend
  navigation/AppNavigator.tsx
  screens/
    HomeScreen.tsx            # menú principal
    CaptureScreen.tsx         # cámara / selector de archivo
    ReviewScreen.tsx          # formulario editable con los datos extraídos
    HistoryScreen.tsx         # listado filtrado por año/trimestre
    InvoiceDetailScreen.tsx   # detalle de una factura + enlace al PDF
  components/
    InvoiceForm.tsx           # formulario reutilizado en Review y Detail
    QuarterBadge.tsx
```

## Generar un APK instalable (build local con Gradle)

Se generaron dos APKs compilando el proyecto nativo Android localmente:

- **`build-output/ContabilidadFacturas-release.apk`** (~86 MB) — **usa esta**.
  Lleva el código JS empaquetado dentro del propio APK, así que funciona de
  forma completamente independiente: no necesita tu PC encendido ni Metro
  corriendo. Solo necesita que el backend (`API_BASE_URL`) esté accesible en
  la red cuando proceses una factura.
- `build-output/ContabilidadFacturas-debug.apk` (~164 MB) — build de
  desarrollo. **No funciona instalada sola**: al abrirla muestra el error
  "Unable to load script..." porque, a diferencia del release, no incluye el
  JS empaquetado y espera conectarse a un servidor Metro (`npx expo start`)
  corriendo en tu PC y accesible desde el móvil. Solo es útil si vas a
  desarrollar con recarga en caliente.

Para instalar: copia el `.apk` al teléfono y ábrelo (Android pedirá activar
"Instalar apps de origen desconocido" la primera vez). Recuerda configurar
`API_BASE_URL` (paso 2) **antes** de compilar si cambia la IP del backend —
en un release, esa URL queda fija dentro del APK.

Para volver a generarlos tú mismo:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
# APK resultante en android\app\build\outputs\apk\release\app-release.apk
# (o assembleDebug para la variante de desarrollo con Metro)
```

Requiere JDK 17 y Android SDK (`platform-tools`, `platforms;android-34`,
`build-tools;34.0.0`) instalados, con `ANDROID_HOME`/`local.properties`
apuntando a ellos. El release usa por defecto el keystore de debug para
firmar (`android/app/build.gradle`, ver comentario "In production, you need
to generate your own keystore") — válido para instalar y probar, pero antes
de publicar en Google Play habría que generar un keystore propio.

### Dos problemas que probablemente te encontrarás (y cómo se resolvieron aquí)

1. **Ruta de proyecto demasiado larga (Windows MAX_PATH)**. Si compilas
   dentro de una carpeta muy anidada, CMake/NDK (usado por
   `expo-modules-core`) falla con errores como
   `CreateProcess error=2, El sistema no puede encontrar el archivo especificado`.
   Solución: compila desde una ruta corta, p. ej. `C:\mobileapp`, no desde
   `Documentos\proyectos\muy\anidado\...`.

2. **`expo-image-picker` depende de `com.github.CanHub:Android-Image-Cropper`,
   publicado solo en jitpack.io**. Si tu red bloquea jitpack.io, el build se
   queda colgado o falla al resolver esa dependencia. Solución aplicada aquí:
   se compiló esa librería desde su código fuente
   (github.com/CanHub/Android-Image-Cropper, tag `4.3.1`) con
   `./gradlew :cropper:publishToMavenLocal`, y se añadió `mavenLocal()` como
   repositorio en `android/build.gradle` (bloque `allprojects.repositories`,
   antes de la línea de jitpack) para que Gradle la encuentre en local sin
   tocar jitpack. El artifact ya queda cacheado en `~/.m2/repository` de esta
   máquina. **Importante:** si vuelves a ejecutar `expo prebuild --clean`,
   `android/build.gradle` se regenera desde cero y pierdes la línea
   `mavenLocal()` — tendrás que volver a añadirla manualmente (o evitar
   `--clean`).

3. **Falta el color `splashscreen_background`**. El prebuild base referencia
   `@color/splashscreen_background` en `drawable/splashscreen.xml` pero no lo
   define porque no se configuró el plugin `expo-splash-screen`. Se añadió
   manualmente en `android/app/src/main/res/values/colors.xml`. Igual que el
   punto anterior, esto se pierde si regeneras `android/` desde cero — la
   solución permanente sería instalar y configurar `expo-splash-screen` en
   `app.json`.

## Nota

Este proyecto se ha desarrollado y verificado a nivel de backend (API, OCR,
generación de PDF/Excel) en este entorno, y además se compiló y verificó un
APK debug real de la app móvil (ver arriba). No se pudo probar la app
*ejecutándose* en un emulador o dispositivo real desde aquí (no hay ninguno
conectado a este entorno) — instala el APK en tu propio teléfono para
probarla end-to-end.
