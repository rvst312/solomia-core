# Tickets de Evolución - Software Agency Crew

## 🎯 Resumen
Tu crew actual tiene 10 agentes bien definidos en 4 fases (Analysis, Planning, Implementation, Verification). Los tickets abajo proponen evolucionlos para mayor autonomía y capacidad.

---

## Ticket 1: Asignar herramientas a los agentes
**Prioridad:** Alta | **Estimación:** 2 días

### Problema
Los 10 agentes actualmente no tienen herramientas (tools) asignadas. Solo usan capacidades por defecto de CrewAI.

### Solución propuesta
Asignar herramientas relevantes a cada agente:

| Agente | Herramientas sugeridas |
|--------|----------------------|
| `product_owner` | Web search, URL fetcher (para investigar mercado/competidores) |
| `software_architect` | File reader (para analizar código existente), Web search |
| `tech_lead` | File reader/writer |
| `ticket_generator` | File writer (generar JSON), Template processor |
| `qa_architect` | File writer |
| `senior_engineer` | File reader/writer, Code executor, Git tools |
| `code_reviewer` | File reader, Linter tools |
| `qa_engineer` | Test runner, File reader |
| `devops_engineer` | Docker tools, Cloud CLI tools, Shell |
| `ticket_orchestrator` | File reader/writer (para actualizar plan) |

### Criterios de aceptación
- [ ] Cada agente tiene al menos 1 herramienta asignada
- [ ] Las herramientas están probadas y funcionales

---

## Ticket 2: Implementar Crew con proceso secuencial + handoff
**Prioridad:** Alta | **Estimación:** 1 día

### Problema
Los agentes trabajan en paralelo dentro de cada fase, pero el output de uno no se pasa automáticamente al siguiente.

### Solución
Configurar `process=Process.hierarchical` o usar `handoffs` explícitos para que:
- `product_owner` → pase requirements a `software_architect`
- `software_architect` → pase architecture a `tech_lead`
- `ticket_orchestrator` → aprue tickets antes de pasar a `senior_engineer`

### Criterios de aceptación
- [ ] Output de cada agente se pasa al siguiente automáticamente
- [ ] Validar que el contexto no se pierde entre fases

---

## Ticket 3: Agregar agente "Project Manager" para supervisión global
**Prioridad:** Media | **Estimación:** 2 días

### Problema
No hay un agente que supervise el progreso general del proyecto y tome decisiones de alto nivel.

### Solución
Crear nuevo agente `project_manager`:

```python
project_manager = Agent(
    role="Project Manager",
    goal="Supervisar el progreso del proyecto, identificar bloqueos y optimizar el flujo de trabajo",
    backstory="Director de proyectos experimentado con visión estratégica...",
    tools=[file_reader, web_search],
    verbose=True
)
```

### Criterios de aceptación
- [ ] Agente creado y configurado
- [ ] Monitorea el estado del crew
- [ ] Puede intervenir cuando hay bloqueos

---

## Ticket 4: Implementar memoria persistente con memoria a largo plazo
**Prioridad:** Media | **Estimación:** 3 días

### Problema
Solo se usa `memory=True` básico, sin persistencia entre ejecuciones.

### Solución
Implementar:
- **Short-term memory**: Context window expandida
- **Long-term memory**: Persistir conocimiento entre sesiones (usar SQLite o vector DB)
- **Entity memory**: Recordar información sobre el proyecto/Cliente

```python
from crewai.memory.storage import SQLiteStorage

crew = Crew(
    agents=agents,
    tasks=tasks,
    memory=True,
    long_term_memory=SQLiteStorage(db_path="./data/memory.db"),
)
```

### Criterios de aceptación
- [ ] Memoria persiste entre ejecuciones
- [ ] Agentes pueden recordar contexto de proyectos anteriores
- [ ] Implementar limpieza de memoria antigua

---

## Ticket 5: Agregar herramientas de desarrollo real al senior_engineer
**Prioridad:** Alta | **Estimación:** 5 días

### Problema
`senior_engineer` no puede ejecutar código ni interactuar con el sistema de archivos real.

### Solución
Crear custom tools para:
1. **ReadFileTool** - Leer archivos del proyecto
2. **WriteFileTool** - Escribir archivos
3. **ExecuteCommandTool** - Ejecutar comandos shell (con sandbox)
4. **GitTool** - Operaciones git básicas
5. **CodeExecutionTool** - Ejecutar código en sandbox

```python
class ExecuteCommandTool(BaseTool):
    name = "execute_command"
    description = "Ejecuta comandos en el terminal"
    
    def _run(self, command: str, working_dir: str = "."):
        # Implementar con restricciones de seguridad
        pass
```

### Criterios de aceptación
- [ ] senior_engineer puede leer y escribir archivos
- [ ] Puede ejecutar pruebas
- [ ] Sandbox seguro (no comandos destructivos)

---

## Ticket 6: Implementar agentos de validación en cada fase
**Prioridad:** Baja | **Estimación:** 3 días

### Problema
No hay validación automática entre fases.

### Solución
Agregar agentes "gatekeepers":
- `requirements_validator` - Valida que requirements estén completos
- `architecture_validator` - Verifica que la arquitectura sea viable
- `code_quality_gate` - Bloquea merge si no pasa quality gates

### Criterios de aceptación
- [ ] Validación automática al final de cada fase
- [ ] Feedback claro si no pasa validación

---

## Ticket 7: Agregar integración con sistema de tickets externo (Linear/Jira)
**Prioridad:** Baja | **Estimación:** 4 días

### Problema
Los tickets se generan internamente pero no se sincronizan con herramientas de gestión de proyectos.

### Solución
Crear tool para integrar con Linear o Jira API:
- Sincronizar tickets generados con Linear/Jira
- Actualizar estado de tickets desde el crew
- Attach URLs de tickets a outputs

### Criterios de aceptación
- [ ] Integración con Linear (MVP)
- [ ] Tickets se crean automáticamente en Linear
- [ ] Estados se actualizan automáticamente

---

## Ticket 8: Implementar sistema de feedback iterativo
**Prioridad:** Media | **Estimación:** 3 días

### Problema
El flujo es lineal, no hay iteración cuando algo falla.

### Solución
Modificar el crew para que:
- `code_reviewer` pueda pedir correcciones a `senior_engineer`
- `qa_engineer` pueda reportar bugs para re-implementación
- `ticket_orchestrator` pueda repriorizar según feedback

Usar handoffs condicionales:
```python
code_review_task = Task(
    description="...",
    agent=code_reviewer,
    context=[code_implementation_task],
    callback=lambda result: check_approval(result)
)
```

### Criterios de aceptación
- [ ] Agentes pueden pedir trabajo adicional cuando no cumple estándares
- [ ] Máximo 2 iteraciones por tarea (evitar loops infinitos)

---

## Ticket 9: Agregar métricas y logging estructurado
**Prioridad:** Baja | **Estimación:** 2 días

### Problema
No hay visibilidad del rendimiento del crew.

### Solución
Implementar:
- Logging de cada tarea (start, end, duración, output)
- Métricas: tiempo por tarea, tasa de éxito, tokens usados
- Dashboard simple con resultados

### Criterios de aceptación
- [ ] Logging estructurado (JSON)
- [ ] Métricas guardadas en BD
- [ ] Reporte post-ejecución generado

---

## Ticket 10: Implementar "Safety Agent" para revisión de seguridad
**Prioridad:** Media | **Estimación:** 2 días

### Problema
El código generado no pasa por revisión de seguridad.

### Solución
Crear agente `security_review_agent`:

```python
security_agent = Agent(
    role="Security Expert",
    goal="Identificar vulnerabilidades de seguridad en el código generado",
    backstory="Hacker ético certificado...",
    tools=[code_scanner_tool],
    verbose=True
)
```

Agregar como gatekeeper antes de deployment.

### Criterios de aceptación
- [ ] Escanea código generado
- [ ] Reporta vulnerabilidades comunes (OWASP Top 10)
- [ ] Bloquea deployment si hay issues críticos

---

## Orden sugerido de implementación

1. **Sprint 1**: Tickets 1 + 2 (Fundamentos - 3 días)
2. **Sprint 2**: Ticket 5 (Herramientas desarrollo - 5 días)
3. **Sprint 3**: Tickets 3 + 4 (Memoria y PM - 5 días)
4. **Sprint 4**: Tickets 6 + 8 (Validación y feedback - 6 días)
5. **Sprint 5**: Tickets 7 + 9 + 10 (Integraciones y seguridad - 8 días)
