import pytest
from crewai import Agent, Crew
from packages.crew_engine.main import SoftwareAgencyCrew

def test_crew_instantiation():
    """Test that the SoftwareAgencyCrew class can be instantiated."""
    print("\n--> Verificando instanciación de SoftwareAgencyCrew...")
    crew_instance = SoftwareAgencyCrew()
    assert crew_instance is not None
    print("    SoftwareAgencyCrew instanciado correctamente.")

def test_product_owner_agent_creation():
    """Test that the product_owner agent is created correctly."""
    print("\n--> Verificando agente Product Owner...")
    crew_instance = SoftwareAgencyCrew()
    agent = crew_instance.product_owner()
    assert isinstance(agent, Agent)
    assert agent.role.strip() == "AI Product Owner"
    assert agent.verbose is True
    print(f"    Agente '{agent.role.strip()}' creado correctamente.")

def test_software_architect_agent_creation():
    """Test that the software_architect agent is created correctly."""
    print("\n--> Verificando agente Software Architect...")
    crew_instance = SoftwareAgencyCrew()
    agent = crew_instance.software_architect()
    assert isinstance(agent, Agent)
    assert agent.role.strip() == "AI Architect"
    print(f"    Agente '{agent.role.strip()}' creado correctamente.")

def test_all_agents_creation():
    """Test that all agents are created correctly."""
    print("\n--> Verificando creación de TODOS los agentes...")
    crew_instance = SoftwareAgencyCrew()
    agents = [
        crew_instance.product_owner(),
        crew_instance.software_architect(),
        crew_instance.tech_lead(),
        crew_instance.ticket_generator(),
        crew_instance.ticket_orchestrator(),
        crew_instance.qa_architect(),
        crew_instance.senior_engineer(),
        crew_instance.code_reviewer(),
        crew_instance.qa_engineer(),
        crew_instance.devops_engineer()
    ]
    assert all(isinstance(a, Agent) for a in agents)
    assert len(agents) == 10
    print(f"    Se han creado {len(agents)} agentes exitosamente.")

def test_crew_creation():
    """Test that the crew is created correctly with all agents and tasks."""
    print("\n--> Verificando creación del Crew completo...")
    crew_instance = SoftwareAgencyCrew()
    crew = crew_instance.crew()
    assert isinstance(crew, Crew)
    assert len(crew.agents) == 10
    assert len(crew.tasks) == 11
    print(f"    Crew creado con {len(crew.agents)} agentes y {len(crew.tasks)} tareas.")
