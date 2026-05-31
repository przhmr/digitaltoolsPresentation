# Guía de Despliegue en GitHub Pages para la Presentación RevealJS

Esta guía detalla de forma clara y paso a paso cómo alojar la presentación académica interactiva `index.html` en **GitHub Pages**. Esto generará un enlace público en vivo que se podrá compartir directamente con el facilitador de la universidad o compañeros de postgrado para la defensa síncrona en Zoom.

---

## 🛠️ Requisitos Previos

1. Una cuenta activa en [GitHub](https://github.com).
2. Tener instalado [Git](https://git-scm.com/) localmente en tu computador (o puedes utilizar la interfaz web de GitHub).

---

## 🚀 Paso 1: Configurar el Espacio de Trabajo en tu IDE

Para trabajar de manera cómoda en este proyecto, te recomendamos configurar esta subcarpeta como tu **espacio de trabajo activo** en tu IDE/editor (por ejemplo, VS Code o Cursor):

1. Abre tu IDE.
2. Selecciona **Archivo > Abrir carpeta...** (File > Open Folder...).
3. Navega hacia la ruta del proyecto y selecciónala:
   `/Users/homerperozo/.gemini/antigravity/scratch/revealjs-presentation`

---

## 📦 Paso 2: Crear el Repositorio en GitHub

1. Inicia sesión en tu cuenta de **GitHub**.
2. En la esquina superior derecha, haz clic en el botón **+** y selecciona **New repository** (Nuevo repositorio).
3. Configura los siguientes parámetros:
   - **Repository name:** `revealjs-engineering-presentation` (o el nombre de tu preferencia).
   - **Description:** `Presentación académica sobre innovación digital en ingeniería de procesos.`
   - **Public/Private:** Selecciona obligatoriamente **Public** (Público) para que GitHub Pages pueda servir el archivo de manera gratuita.
   - **Initialize this repository with:** Deja todas las casillas desmarcadas (no agregues README ni .gitignore por ahora).
4. Haz clic en **Create repository** (Crear repositorio).

---

## 💻 Paso 3: Inicializar Git y Subir el Código (Vía Consola/Terminal)

Abre la terminal de tu sistema operativo o la terminal integrada de tu IDE, asegúrate de estar en el directorio correcto `/Users/homerperozo/.gemini/antigravity/scratch/revealjs-presentation` y ejecuta los siguientes comandos:

```bash
# 1. Inicializar el repositorio Git local
git init

# 2. Agregar los archivos index.html y DEPLOYMENT.md al área de preparación
git add index.html DEPLOYMENT.md

# 3. Registrar el primer commit con un mensaje descriptivo
git commit -m "feat: estructura inicial con 12 diapositivas académicas en RevealJS"

# 4. Cambiar el nombre de la rama principal a 'main'
git branch -M main

# 5. Vincular el repositorio local con el repositorio remoto de GitHub
# (REMPLAZA la URL con el enlace de tu repositorio creado en el Paso 2)
git remote add origin https://github.com/TU_USUARIO_GITHUB/revealjs-engineering-presentation.git

# 6. Empujar el código a la rama principal en GitHub
git push -u origin main
```

> **Alternativa (Sin Consola):** Si no deseas usar la terminal, puedes ir a la página de tu repositorio vacío en GitHub, hacer clic en el enlace **"uploading an existing file"** (subir un archivo existente), arrastrar y soltar el archivo `index.html`, y hacer clic en **Commit changes**.

---

## 🌐 Paso 4: Activar y Configurar GitHub Pages

Una vez que tu archivo `index.html` se encuentre arriba en tu repositorio de GitHub, activa el alojamiento web automático siguiendo estos sencillos pasos:

1. Dentro de tu repositorio en GitHub, haz clic en la pestaña **Settings** (Configuración) ubicada en el menú horizontal superior.
2. En la barra lateral izquierda, navega hasta la sección **Code and automation** y haz clic en **Pages**.
3. En la sección **Build and deployment**:
   - **Source:** Selecciona **Deploy from a branch** (Desplegar desde una rama).
   - **Branch:** En el primer menú desplegable, cambia `None` por **`main`**.
   - En el segundo desplegable, deja la carpeta raíz **`/ (root)`** seleccionada.
4. Haz clic en el botón **Save** (Guardar).

---

## 🔗 Paso 5: Generar y Compartir la URL en Vivo

1. Espera entre 30 y 60 segundos para que los servidores de GitHub terminen de compilar y desplegar la presentación.
2. Recarga la página de **Settings > Pages**.
3. Verás un recuadro destacado en la parte superior con un texto similar a:
   > **Your site is live at:** `https://TU_USUARIO_GITHUB.github.io/revealjs-engineering-presentation/`
4. Haz clic en el botón **Visit site** para abrir la presentación RevealJS interactiva en una nueva pestaña del navegador.
5. Copia esa URL completa y envíasela al facilitador de la universidad o compártela por el chat de Zoom durante la defensa oral de tu postgrado.

---

## 💡 Consejos de Uso para la Defensa en Zoom

- **Control por teclado:** Puedes navegar por las diapositivas utilizando las **flechas del teclado** (izquierda/derecha o arriba/abajo) o haciendo clic en las flechas de la esquina inferior derecha.
- **Teclas rápidas de RevealJS:**
  - Presiona la tecla `F` para activar el modo de **pantalla completa** directamente en tu navegador.
  - Presiona la tecla `O` (de *Overview*) para abrir la vista de cuadrícula de todas las diapositivas, lo cual es de gran utilidad si el jurado hace una pregunta sobre una lámina específica.
  - Presiona la tecla `B` o `.` para suspender temporalmente la pantalla y ponerla en negro, ideal si deseas captar la atención del público en tu explicación oral.
