

<div align="center">
        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fc/UPC_logo_transparente.png"><br>
</div>
<h3 align="center"> Universidad Peruana de Ciencias Aplicadas </h3>

<h3 align="center">Carrera de Ingeniería de Software </h3>

<h3 align="center">1ASI0730 </h3>
<h3 align="center">Aplicaciones Web </h3>
<h3 align="center"> NRC </h3>
<h3 align="center"> 20177 </h3>

<h3 align="center"> Informe de Trabajo Final</h3>


<h3 align="center"> Docente</h3>
<h3 align="center"> Jose Miguel, Flores Ingaruca </h3>


<h3 align="center"> Equipo </h3>
<h3 align="center"> Cryologic Systems </h3>

<h3 align="center"> Proyecto</h3>
<h3 align="center"> SafeFlow </h3>

<h3 align="center"> Integrantes </h3>

<div align = "center">
 
| Code       |      Member |
| :---:      |     :--- |
| U202218531 | Andy Alejandro Mio Mejia |
| U202116018 | Mel Andree Orellana Rodriguez |
| U202114701 | Angel Guillermo Berrospi Marin |
| U20221C803 | Anhelo Rodrigo Rocca Leon |
| U202316049 | Jefferson Bayron Morales Yapuchura |


</div>

<h3 align="center">Periodo 202610</h3>
<h3 align="center">Junio 2026</h3>


<div style="page-break-after: always;"></div>



# SafeFlow Web Application (Frontend)

**SafeFlow** es una aplicación web moderna diseñada para el **monitoreo y gestión de la cadena de frío**, proporcionando visibilidad integral de extremo a extremo de la cadena de suministro para productos altamente sensibles a la temperatura (como vacunas, medicamentos, alimentos frescos y reactivos de laboratorio).

La plataforma permite realizar un seguimiento en tiempo real de los envíos, controlar los niveles de stock en almacenes especializados, recibir alertas automáticas ante desviaciones de temperatura y generar reportes ejecutivos en PDF.

---

## 🛠️ Tecnologías y Arquitectura

El frontend de la aplicación está construido bajo las siguientes tecnologías:

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, Script Setup).
- **Herramienta de Construcción**: [Vite](https://vitejs.dev/) para un desarrollo ultrarrápido y empaquetado optimizado.
- **Librería de Componentes**: [PrimeVue v4](https://primevue.org/) con el preset de diseño **Material** para una interfaz moderna, limpia y accesible.
- **Diseño y Layout**: [PrimeFlex](https://primeflex.org/) y [PrimeIcons](https://primeicons.org/).
- **Gestión de Estado**: [Pinia](https://pinia.vuejs.org/) para almacenar el estado global (autenticación, envíos, alertas, simulación).
- **Enrutamiento**: [Vue Router](https://router.vuejs.org/).
- **Internacionalización (i18n)**: [Vue I18n](https://vue-i18n.intlify.dev/) con soporte completo para **Español (`es`)** e **Inglés (`en`)**.
- **Cliente HTTP**: [Axios](https://axios-http.com/) para solicitudes a la API.
- **Generación de Reportes**: [jsPDF](https://github.com/parallax/jsPDF) y [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable).
- **Iconografía**: [Lucide Vue Next](https://lucide.dev/).

---

## 📦 Módulos / Contextos Delimitados (Bounded Contexts)

SafeFlow se organiza en módulos modulares e independientes basados en principios de Domain-Driven Design (DDD):

1. **IAM (Gestión de Identidad y Accesos)**:
   - Control de inicio de sesión (`/login`), registro (`/register`) y cierre de sesión.
   - Perfil de usuario con detalles de cuenta, asignación de roles (Administrador, Operador, Visualizador/Consulta) y departamentos (Logística, Calidad cadena de frío, Operaciones).

2. **Analítica (Dashboard)**:
   - Panel de control principal con KPIs clave (Total de envíos, Entregas completadas, En tránsito, Retrasados).
   - Distribución gráfica del estado de entregas y lista de rendimiento de la flota y envíos recientes.

3. **Inventario**:
   - Seguimiento del stock en cadena de frío clasificado por categorías (Medicamento, Alimento).
   - Control de lotes, cantidad, ubicación (Almacén principal, Congelador, Cámara fría, etc.), fechas de ingreso y vencimiento.
   - Definición de rangos térmicos permitidos (Temperatura mínima y máxima) por cada producto.
   - Opciones para añadir nuevos productos y líneas de stock.

4. **Logística y Seguimiento**:
   - Creación y seguimiento de envíos activos.
   - Registro de destinos personalizados (distancia, tiempos de tránsito estimados).
   - Asignación de conductores y operarios responsables.

5. **Monitoreo Ambiental**:
   - Lecturas térmicas en tiempo real y visualización gráfica del estado de seguridad de los lotes.
   - **Simulación Térmica**: Un motor de simulación interno en tiempo real (esquina inferior derecha) que altera y varía dinámicamente las temperaturas de los productos y almacenes para probar el sistema de alertas.

6. **Alertas**:
   - Notificaciones inmediatas cuando un producto sale de su rango de temperatura óptimo (Temperatura alta o baja) o por vencimiento.
   - Opciones de mitigación: Poner la alerta "En observación" (pausa las alertas térmicas mientras se gestiona la contingencia con el contacto encargado) o marcar la alerta como "Solucionada".

7. **Reportes (Reporting)**:
   - Generación instantánea de archivos PDF con el estado actual del inventario, logística y monitoreo de la cadena de frío.

---

## 🔌 API y Servidor de Desarrollo (Mock Server)

SafeFlow cuenta con un servidor simulado (Mock API) que funciona de dos formas:

1. **Local (Recomendado para Desarrollo)**:
   - Vite incluye middlewares configurados en `vite.config.js` (`createDevInventoryApi` y `createDevLogisticsApi`) que interceptan las peticiones `/api/*`.
   - Lee y escribe directamente sobre el archivo local [server/db.json](file:///C:/Users/Andy%20Mio/Documents/safeflow-webapp/server/db.json).
   - Ideal para desarrollo local sin dependencias externas.

2. **MockAPI en la nube**:
   - Permite conectar la aplicación a un servicio MockAPI real (por ejemplo, mockapi.io).
   - Configurado en el archivo `.env.mockapi` (para modo de desarrollo simulado) y `.env.production` (para entornos de producción).
   - Apunta a la URL base configurada en `VITE_API_BASE_URL`.

---

## 🚀 Instrucciones de Inicio Rápido

### Requisitos Previos
Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada) y `npm`.

### Instalación
Clona o sitúate en el directorio del proyecto e instala las dependencias:
```bash
npm install
```

### Ejecutar en Desarrollo (API Local)
Ejecuta la aplicación en modo desarrollo conectada al archivo `server/db.json` local:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### Ejecutar en Desarrollo (MockAPI Externo)
Para utilizar la base de datos externa de MockAPI:
```bash
npm run dev:mockapi
```

### Reconstruir la Base de Datos Local
Si deseas restablecer o regenerar los datos del archivo `server/db.json` local con los datos semilla integrados:
```bash
node server/generate-integrated-db.mjs
```

### Construcción para Producción
Para compilar y minificar el código para producción:
```bash
npm run build
```
Los archivos de salida se guardarán en la carpeta `dist`.

---

## 📁 Estructura del Proyecto

- `server/`: Contiene el generador de base de datos (`generate-integrated-db.mjs`), la base de datos local mock (`db.json`) y los middlewares del servidor de desarrollo de Vite (`dev-inventory-api.mjs`, `dev-logistics-api.mjs`).
- `src/`: Directorio principal del código fuente.
  - `alerts/`, `analytics/`, `environmental-monitoring/`, `iam/`, `inventory/`, `logistics/`, `reporting/`: Subcarpetas por módulo/bounded context (diseño DDD).
  - `shared/`: Componentes comunes, enrutador general, y configuración compartida de sesión y navegación.
  - `locales/`: Archivos JSON de traducción (`es.json`, `en.json`).
  - `App.vue`: Componente raíz de la aplicación.
  - `main.js`: Inicialización y configuración de los plugins globales de Vue.
  - `router.js`: Definición de rutas y guardianes de navegación.
  - `style.css`: Estilos globales de la aplicación.
