import pytest
from crewai import Task
from packages.crew_engine.main import SoftwareAgencyCrew

def test_requirements_analysis_task():
    """Test that the requirements_analysis_task is created correctly."""
    print("\n--> Verificando tarea: Requirements Analysis...")
    crew_instance = SoftwareAgencyCrew()
    task = crew_instance.requirements_analysis_task()
    assert isinstance(task, Task)
    assert task.output_file == "requirements.md"
    print(f"    Tarea creada correctamente con output: {task.output_file}")

def test_architecture_design_task():
    """Test that the architecture_design_task is created correctly."""
    print("\n--> Verificando tarea: Architecture Design...")
    crew_instance = SoftwareAgencyCrew()
    task = crew_instance.architecture_design_task()
    assert isinstance(task, Task)
    assert task.output_file == "architecture.md"
    print(f"    Tarea creada correctamente con output: {task.output_file}")

def test_all_tasks_creation():
    """Test that all tasks are created correctly."""
    print("\n--> Verificando creación de TODAS las tareas...")
    crew_instance = SoftwareAgencyCrew()
    tasks = [
        crew_instance.requirements_analysis_task(),
        crew_instance.architecture_design_task(),
        crew_instance.tech_spec_generation_task(),
        crew_instance.ticket_generation_task(),
        crew_instance.ticket_orchestration_task(),
        crew_instance.test_case_generation_task(),
        crew_instance.code_implementation_task(),
        crew_instance.code_review_task(),
        crew_instance.test_execution_task(),
        crew_instance.ci_cd_pipeline_task(),
        crew_instance.deployment_task()
    ]
    assert all(isinstance(t, Task) for t in tasks)
    assert len(tasks) == 11
    print(f"    Se han creado {len(tasks)} tareas exitosamente.")
