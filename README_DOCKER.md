# Software Agency Crew

Este proyecto utiliza una arquitectura de microservicios con Docker para orquestar un equipo de agentes de IA que desarrollan software.

## Requisitos Previos

- Docker y Docker Compose
- Clave de API de OpenAI (`OPENAI_API_KEY`)

## Configuración

1. Asegúrate de tener un archivo `.env` en la raíz con tu clave de API:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL_NAME=gpt-4o-mini
   ```

2. El proyecto utiliza un directorio `output/` para almacenar los artefactos generados (documentos de requisitos, código, reportes). Este directorio se monta en el contenedor de la API.

## Ejecución con Docker

Para iniciar todo el sistema (Frontend + Backend + IA Engine):

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

## Flujo de Trabajo

1. Abre el Frontend en tu navegador.
2. Sube un archivo de texto con la transcripción de la reunión con el cliente.
3. Inicia la fase de **Análisis**. Los agentes generarán los requisitos y la arquitectura.
4. Revisa los logs en el dashboard.
5. Aprueba para continuar a la fase de **Planificación**, donde se generarán los tickets.
6. Continúa con **Implementación** y **Verificación**.

## Estructura de Archivos Generados

Todos los archivos generados por los agentes se guardarán en la carpeta `output/` de tu proyecto local:

- `requirements.md`
- `architecture.md`
- `tech_specs.md`
- `tickets.json`
- `implementation_report.md`
- etc.

## Desarrollo

Si necesitas instalar nuevas dependencias de Python:
1. Agrégalas a `apps/api/requirements.txt` o `packages/crew_engine/requirements.txt`.
2. Reconstruye los contenedores: `docker-compose up --build`.
