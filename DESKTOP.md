# Claqueta de escritorio (Tauri)

Claqueta se empaqueta como app de escritorio nativa con **Tauri 2**. El resultado
es un **instalable** (`.msi`/`.exe` en Windows, `.dmg`/`.app` en macOS,
`.AppImage`/`.deb` en Linux) que corre sin navegador y **sin conexión** —todo
local-first, igual que la versión web.

> El binario se compila **en tu máquina** (cada sistema operativo genera su
> propio instalable). No se puede compilar Windows desde Mac ni viceversa.

## 1. Requisitos (una sola vez)

**Todos los sistemas:**
- **Node.js 18+** — https://nodejs.org
- **Rust** (incluye `cargo`) — https://rustup.rs
  - Windows/macOS/Linux: pega el comando de rustup y sigue los pasos.

**Según el sistema, además:**

- **Windows**: *Microsoft C++ Build Tools* (o Visual Studio con "Desktop
  development with C++") y *WebView2* (ya viene en Windows 10/11 actualizados).
- **macOS**: *Xcode Command Line Tools* → `xcode-select --install`.
- **Linux (Debian/Ubuntu)**:
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```
  (En Fedora/Arch los paquetes equivalentes: `webkit2gtk4.1-devel`, etc.)

## 2. Instalar dependencias del proyecto

Dentro de la carpeta `claqueta/`:

```bash
npm install
```

## 3. Desarrollo (ventana nativa con recarga en vivo)

```bash
npm run desktop
```

Abre Claqueta en una ventana de escritorio; al guardar cambios en el código, se
recarga sola. La primera vez tarda unos minutos (compila Rust); luego es rápido.

## 4. Generar el instalable

```bash
npm run desktop:build
```

Cuando termina, el instalable queda en:

```
src-tauri/target/release/bundle/
```

- **Windows** → `msi/Claqueta_0.13.0_x64_en-US.msi` y `nsis/Claqueta_0.13.0_x64-setup.exe`
- **macOS** → `dmg/Claqueta_0.13.0_aarch64.dmg` y `macos/Claqueta.app`
- **Linux** → `appimage/Claqueta_0.13.0_amd64.AppImage` y `deb/Claqueta_0.13.0_amd64.deb`

## Dónde se guardan los guiones

En escritorio, los datos (guiones, personajes, desglose, etc.) viven en el
almacenamiento local del webview de la app, **en tu equipo**. No salen de ahí.
Para respaldos, usa **Exportar** (FDX/Fountain/PDF) y el **control de versiones**.

## Notas sobre la IA (trae tu propia clave)

- **Anthropic**, **OpenRouter** y **Ollama local** funcionan directamente desde
  la app (la configuración de seguridad ya permite esas conexiones).
- **OpenAI directo** puede bloquear la llamada por su política CORS, igual que en
  web. Si lo necesitas, lo ideal es enrutar la IA por el proceso Rust con
  `tauri-plugin-http` (mejora pendiente, elimina CORS por completo).
- Para añadir otro endpoint propio, edita `connect-src` en
  `src-tauri/tauri.conf.json` → `app.security.csp`.

## Personalizar

- **Icono**: reemplaza `app-icon.png` (1024×1024) y ejecuta
  `npm run tauri icon app-icon.png` para regenerar todos los tamaños.
- **Nombre / versión / identificador**: `src-tauri/tauri.conf.json`
  (`productName`, `version`, `identifier`) y `src-tauri/Cargo.toml`.
- **Tamaño de ventana**: `app.windows` en `tauri.conf.json`.

## Firma y notarización (opcional, para distribuir)

Para que Windows/macOS no muestren avisos de "app no verificada" al instalar,
hace falta firmar (y en macOS, notarizar) con un certificado de desarrollador.
Es opcional para uso personal. Ver: https://v2.tauri.app/distribute/
