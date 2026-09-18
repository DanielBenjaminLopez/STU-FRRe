# Modo Kiosco

Esta guía explica paso a paso cómo configurar una **computadora** conectada al monitor del tótem universitario para que funcione de forma autónoma, bloqueada y en pantalla completa, garantizando que los usuarios no puedan acceder al sistema operativo subyacente.

---

## 1. Configuración en Computadoras con Windows (10 / 11)

### 1.1. Flags y Parámetros del Navegador
El Modo Kiosco de Google Chrome o Microsoft Edge bloquea la barra de direcciones, pestañas, menús contextuales y combinaciones habituales de teclas.

**Explicación de los modificadores principales:**
- `--kiosk`: Fuerza la ventana en pantalla completa sin barra de títulos, URL ni botones de cierre.
- `--edge-kiosk-type=fullscreen`: Obligatorio en Microsoft Edge para pantalla completa estricta.
- `--user-data-dir="<ruta>"`: *(Recomendado para pruebas)* Crea un perfil temporal aislado para que no interfiera ni comparta sesión con tus ventanas abiertas del navegador habitual.
- `--disable-pinch`: Deshabilita el zoom por pellizco en pantallas táctiles.
- `--overscroll-history-navigation=0`: Evita que gestos táctiles de deslizamiento hacia los bordes naveguen adelante o atrás en el historial.
- `--noerrdialogs`: Suprime ventanas modales de error si la conexión titubea momentáneamente.
- `--disable-infobars`: Oculta carteles informativos.
- `--disable-notifications`: Bloquea cualquier solicitud de notificaciones emergentes.

---

### 1.2. Pruebas Rápidas en Desarrollo (PowerShell / CMD)

Dado que en Windows los ejecutables de navegadores no suelen estar en el `PATH` de PowerShell, se debe especificar la ruta completa entre comillas utilizando el operador de ejecución `&`:

#### Desde PowerShell:

- **Con Microsoft Edge:**
  ```powershell
  & "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "http://localhost:5173" --edge-kiosk-type=fullscreen --user-data-dir="$env:TEMP\kiosk_test"
  ```
- **Con Google Chrome:**
  ```powershell
  & "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:5173" --user-data-dir="$env:TEMP\kiosk_test" --disable-pinch --overscroll-history-navigation=0 --noerrdialogs --disable-infobars
  ```

#### Desde CMD o el diálogo Ejecutar (`Win + R`):

- **Con Microsoft Edge:**
  ```cmd
  msedge.exe --kiosk "http://localhost:5173" --edge-kiosk-type=fullscreen --user-data-dir="%TEMP%\kiosk_test"
  ```
- **Con Google Chrome:**
  ```cmd
  chrome.exe --kiosk "http://localhost:5173" --user-data-dir="%TEMP%\kiosk_test" --disable-pinch --overscroll-history-navigation=0 --noerrdialogs --disable-infobars
  ```

---

### 1.3. Script de Arranque Automático para el Tótem (.bat)

Para que el tótem inicie automáticamente de forma desatendida al encender el equipo:

1. Crear una carpeta en `C:\Totem\`.
2. Crear un archivo llamado `iniciar_totem.bat` con el siguiente contenido (detecta automáticamente Chrome o Edge):

```bat
@echo off
timeout /t 5 /nobreak >nul

:: URL del Tótem (ajustar IP o dominio si el servidor está en otra máquina)
set URL="http://localhost:5173"

:: Detectar ejecutable (Chrome o Edge)
set BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %BROWSER% set BROWSER="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %BROWSER% set BROWSER="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist %BROWSER% set BROWSER="C:\Program Files\Microsoft\Edge\Application\msedge.exe"

:: Flags comunes
set FLAGS=--kiosk --disable-pinch --overscroll-history-navigation=0 --noerrdialogs --disable-infobars --disable-features=TranslateUI --disable-notifications --check-for-update-interval=31536000

:: Añadir flag especial si es Microsoft Edge
echo %BROWSER% | findstr /i "msedge.exe" >nul
if %errorlevel% equ 0 (
    set FLAGS=%FLAGS% --edge-kiosk-type=fullscreen
)

start "" %BROWSER% %FLAGS% %URL%
```

3. Presionar las teclas `Win + R`, escribir `shell:startup` y presionar Enter.
4. Crear un acceso directo a `C:\Totem\iniciar_totem.bat` dentro de esa carpeta de Inicio de Windows.

---

### 1.4. Configuración de Energía y Pantalla en Windows

Para asegurar que la pantalla del tótem permanezca encendida permanentemente:

1. **Plan de Energía:**
   - Ir a *Configuración > Sistema > Inicio/apagado y suspensión*.
   - **Pantalla:** Configurar en **Nunca**.
   - **Suspender equipo:** Configurar en **Nunca**.
2. **Protector de Pantalla:**
   - Buscar *Cambiar protector de pantalla* y asegurarse de que esté en **(Ninguno)**.
3. **Notificaciones y Actualizaciones:**
   - Activar el *Asistente de concentración* (Modo "No molestar") para silenciar alertas de Windows.
   - En *Windows Update*, pausar actualizaciones automáticas o configurar horas activas que abarquen el horario de funcionamiento de la facultad.

---

### 1.5. Inicio de Sesión Automático (Auto-Login en Windows)
Ante un corte de energía o reinicio de la PC, el equipo debe iniciar sesión automáticamente sin solicitar contraseña:

1. Presionar `Win + R`, escribir `netplwiz` y presionar Enter.
2. Seleccionar la cuenta de usuario de la PC.
3. Desmarcar la casilla *"Los usuarios deben escribir su nombre de usuario y contraseña para usar el equipo"*.
4. Hacer clic en *Aplicar*, introducir la contraseña del usuario y confirmar.

---

## 2. Configuración en Computadoras con Linux Desktop (Ubuntu / Debian)

### 2.1. Inicio Automático del Navegador (Chromium Kiosk)

1. Crear el archivo de inicio de sesión de escritorio:
   ```bash
   mkdir -p ~/.config/autostart
   nano ~/.config/autostart/totem.desktop
   ```
2. Añadir el siguiente contenido:
   ```ini
   [Desktop Entry]
   Type=Application
   Name=Totem Universitario
   Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-pinch --overscroll-history-navigation=0 "http://localhost:5173"
   X-GNOME-Autostart-enabled=true
   ```

---

### 2.2. Desactivar Suspensión y Apagado de Pantalla (DPMS)

En el entorno gráfico, evitar que el monitor entre en reposo:

1. Si se utiliza X11, agregar en `~/.xsessionrc` o `~/.bashrc`:
   ```bash
   xset -dpms
   xset s off
   xset s noblank
   ```
2. Si se utiliza el entorno GNOME (Ubuntu por defecto), ejecutar en la terminal:
   ```bash
   gsettings set org.gnome.desktop.session idle-delay 0
   gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
   ```

---

### 2.3. Ocultar el Cursor del Mouse tras Inactividad
Si la pantalla es táctil o no se desea ver el puntero sobre la interfaz:

1. Instalar la utilidad `unclutter`:
   ```bash
   sudo apt-get install -y unclutter
   ```
2. Configurar para que inicie automáticamente ocultando el cursor tras 1 segundo de inactividad:
   ```bash
   unclutter -idle 1 -root &
   ```

---

## 3. Procedimiento de Salida o Mantenimiento

Para salir del Modo Kiosco o acceder al sistema operativo:

- **Cerrar el kiosco inmediatamente:** Presionar `Alt + F4` o `Ctrl + W`.
- **Cambiar de ventana sin cerrar:** Presionar `Alt + Tab` o pulsar la tecla `Windows` para abrir la barra de tareas.
- **Forzar cierre / Abrir Administrador de Tareas:** Presionar `Ctrl + Shift + Esc`.
- **Si se utilizó pantalla completa manual (`F11`):** Presionar `F11` o `Esc` para salir del modo fullscreen.
- **En Linux:** Presionar `Alt + F4` o cambiar a una terminal virtual con `Ctrl + Alt + F3`.

