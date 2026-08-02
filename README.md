# Inventario PYME - Frontend

Interfaz web del sistema de inventario para pequenas empresas. Consume la API usando rutas relativas bajo `/api`.

## Requisitos

- Node.js 20 o superior
- npm, pnpm o yarn

## Configuracion del backend

Para produccion, configura esta variable en tu hosting del frontend:

```bash
VITE_API_BASE_URL=https://urpi-back-production.up.railway.app
```

No agregues `/api` al final. El cliente ya llama rutas como `/api/products`, por lo que la URL final sera:

```text
https://urpi-back-production.up.railway.app/api/products
```

Para local, puedes dejar `VITE_API_BASE_URL` vacia y usar el proxy de Vite hacia `http://localhost:5000`.

Si quieres probar local contra Railway, crea un archivo `.env` con:

```bash
VITE_API_BASE_URL=https://urpi-back-production.up.railway.app
```

## Ejecutar

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite. Para crear una version de produccion:

```bash
npm run build
npm run preview
```

## Estructura

- `src/pages/` - pantallas de dashboard, productos, movimientos, insights y chat
- `src/components/` - layout y componentes visuales
- `src/lib/api-client/` - cliente TypeScript generado para consumir el backend
- `public/` - favicon, imagen social y archivos publicos
