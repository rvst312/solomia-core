# Pruebas de Agentes

Este directorio contiene pruebas unitarias para los agentes y tareas de CrewAI.

## Requisitos

Asegúrate de tener instaladas las dependencias de prueba:

```bash
pip install pytest pytest-mock crewai pydantic
```

## Ejecutar Pruebas

### Opción 1: Ejecutar localmente

Para ejecutar las pruebas localmente, debes hacerlo desde la raíz del proyecto para asegurar que las rutas de importación sean correctas:

```bash
# Desde la raíz del monorepo (software-agency-crew/)
export PYTHONPATH=$PYTHONPATH:$(pwd)
python3 -m pytest packages/crew_engine/tests/
```

### Opción 2: Ejecutar en Docker

Si prefieres ejecutar las pruebas dentro del contenedor Docker (recomendado para asegurar el mismo entorno que producción):

1. Construye la imagen de la API (si no lo has hecho):
   ```bash
   docker-compose build api
   ```

2. Ejecuta las pruebas montando el volumen para reflejar cambios en tiempo real:
   ```bash
   docker run --rm -v $(pwd)/packages:/app/packages software-agency-crew-api python3 -m pytest packages/crew_engine/tests/
   ```

## Estructura

- `conftest.py`: Configuración global de pruebas y mocks (simulación de LLM).
- `test_agents.py`: Pruebas para verificar la creación correcta de los agentes.
- `test_tasks.py`: Pruebas para verificar la creación correcta de las tareas.
