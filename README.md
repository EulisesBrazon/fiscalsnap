# FiscalSnap

Aplicación web para gestión de retenciones de IVA por tenant, con generación de comprobantes PDF, OCR de facturas y configuración de firma empresarial.

## Características principales

- Multi tenant por empresa (RIF), con usuarios y roles.
- Autenticación con credenciales mediante NextAuth.
- Módulo de proveedores y retenciones.
- Generación de comprobantes PDF con template editable.
- Previsualización de templates PDF.
- Firma empresarial configurable desde Dashboard, cargada a Cloudinary.
- Soporte de imágenes PNG, JPG y JPEG para firma.
- Entrega de imagen con URL firmada para evitar exposición directa de assets.
- Tema visual por tenant (modo y paleta de colores).
- OCR de facturas (Tesseract por defecto).

## Stack técnico

- Next.js 16 (App Router)
- TypeScript
- MongoDB con Mongoose
- NextAuth
- pdfmake
- Cloudinary
- Tailwind CSS
- Zod

## Estructura general

- src/app: rutas web y endpoints API.
- src/backend: lógica de negocio, servicios, modelos y controladores.
- src/components: componentes de interfaz.
- src/lib: utilidades compartidas de app y auth.

## Requisitos

- Node.js 20 o superior
- MongoDB accesible
- Cuenta de Cloudinary

## Configuración de entorno

Crea un archivo .env con valores similares:

- NODE_ENV=development
- MONGODB_URI=tu_uri_mongodb
- OCR_PROVIDER=tesseract
- CLOUDINARY_CLOUD_NAME=tu_cloud_name
- CLOUDINARY_API_KEY=tu_api_key
- CLOUDINARY_API_SECRET=tu_api_secret
- CLOUDINARY_UPLOAD_FOLDER=fiscalsnap
- ENABLE_SELF_REGISTRATION=true

Notas:

- ENABLE_SELF_REGISTRATION controla si el registro público de nuevas empresas está habilitado.
- La firma se guarda como referencia de asset (public id), no como URL pública fija.

## Instalación

1. Instala dependencias

	npm install

2. Inicia en desarrollo

	npm run dev

3. Abre la aplicación

	http://localhost:3000

## Scripts

- npm run dev: desarrollo
- npm run dev:turbo: desarrollo con Turbopack
- npm run build: compilación de producción
- npm run start: servidor en producción
- npm run lint: validación estática
- npm run db:init: inicialización base de colecciones

## Seguridad aplicada

- Control de acceso por sesión y roles en endpoints.
- Registro público activable o desactivable por variable de entorno.
- Subida de firma vía backend autenticado.
- Uso de URL firmada para mostrar imágenes privadas.
- Manejo de errores de validación con respuestas controladas.

## Flujo de firma empresarial

1. El administrador carga o reemplaza la firma en Dashboard, sección Company.
2. La imagen se sube a Cloudinary en modo autenticado.
3. En base de datos se almacena la referencia del asset.
4. El PDF usa la firma vigente del tenant en tiempo de generación.

## Estado funcional actual

- Registro y login por empresa.
- Gestión de proveedores y retenciones.
- Emisión y descarga de comprobante PDF.
- Configuración de empresa y firma.
- Edición de templates PDF con revisiones.
