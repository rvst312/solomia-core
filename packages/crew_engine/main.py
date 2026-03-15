import os
import sys
from dotenv import load_dotenv

load_dotenv()

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import (
    DirectoryReadTool,
    FileReadTool,
    ScrapeWebsiteTool,
    FileWriterTool,
    CodeInterpreterTool,
    GithubSearchTool
)

# Define common tools
docs_tool = DirectoryReadTool(directory='./')
file_tool = FileReadTool()
scrape_tool = ScrapeWebsiteTool()
file_writer_tool = FileWriterTool()
code_interpreter_tool = CodeInterpreterTool()
try:
    github_tool = GithubSearchTool()
except Exception:
    github_tool = None

# Ensure we can import from shared_types if needed
# sys.path.append(os.path.join(os.path.dirname(__file__), '../../packages'))

@CrewBase
class SoftwareAgencyCrew:
    """Software Agency Crew"""
    agents_config = os.path.join(os.path.dirname(__file__), 'config/agents.yaml')
    tasks_config = os.path.join(os.path.dirname(__file__), 'config/tasks.yaml')

    def __init__(self, output_dir: str = 'output'):
        self.output_dir = output_dir
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)

    # Agents
    @agent
    def product_owner(self) -> Agent:
        return Agent(
            config=self.agents_config['product_owner'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, scrape_tool]
        )

    @agent
    def software_architect(self) -> Agent:
        return Agent(
            config=self.agents_config['software_architect'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, scrape_tool]
        )

    @agent
    def tech_lead(self) -> Agent:
        return Agent(
            config=self.agents_config['tech_lead'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, file_writer_tool]
        )

    @agent
    def ticket_generator(self) -> Agent:
        return Agent(
            config=self.agents_config['ticket_generator'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, file_writer_tool]
        )

    @agent
    def ticket_orchestrator(self) -> Agent:
        return Agent(
            config=self.agents_config['ticket_orchestrator'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool]
        )

    @agent
    def qa_architect(self) -> Agent:
        return Agent(
            config=self.agents_config['qa_architect'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, file_writer_tool]
        )

    @agent
    def senior_engineer(self) -> Agent:
        tools = [docs_tool, file_tool, file_writer_tool]
        if github_tool:
            tools.append(github_tool)
            
        return Agent(
            config=self.agents_config['senior_engineer'],
            verbose=True,
            memory=True,
            tools=tools
        )

    @agent
    def code_reviewer(self) -> Agent:
        return Agent(
            config=self.agents_config['code_reviewer'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, code_interpreter_tool]
        )

    @agent
    def qa_engineer(self) -> Agent:
        return Agent(
            config=self.agents_config['qa_engineer'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, code_interpreter_tool]
        )

    @agent
    def devops_engineer(self) -> Agent:
        return Agent(
            config=self.agents_config['devops_engineer'],
            verbose=True,
            memory=True,
            tools=[docs_tool, file_tool, code_interpreter_tool]
        )

    # Tasks
    @task
    def requirements_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['requirements_analysis_task'],
            output_file=os.path.join(self.output_dir, 'requirements.md')
        )

    @task
    def architecture_design_task(self) -> Task:
        return Task(
            config=self.tasks_config['architecture_design_task'],
            output_file=os.path.join(self.output_dir, 'architecture.md')
        )

    @task
    def tech_spec_generation_task(self) -> Task:
        return Task(
            config=self.tasks_config['tech_spec_generation_task'],
            output_file=os.path.join(self.output_dir, 'tech_specs.md')
        )

    @task
    def ticket_generation_task(self) -> Task:
        return Task(
            config=self.tasks_config['ticket_generation_task'],
            output_file=os.path.join(self.output_dir, 'tickets.json')
        )

    @task
    def ticket_orchestration_task(self) -> Task:
        return Task(
            config=self.tasks_config['ticket_orchestration_task'],
            output_file=os.path.join(self.output_dir, 'ticket_plan.md')
        )

    @task
    def test_case_generation_task(self) -> Task:
        return Task(
            config=self.tasks_config['test_case_generation_task'],
            output_file=os.path.join(self.output_dir, 'test_plan.md')
        )

    @task
    def code_implementation_task(self) -> Task:
        return Task(
            config=self.tasks_config['code_implementation_task'],
            output_file=os.path.join(self.output_dir, 'implementation_report.md')
        )

    @task
    def code_review_task(self) -> Task:
        return Task(
            config=self.tasks_config['code_review_task'],
            output_file=os.path.join(self.output_dir, 'code_review_report.md')
        )

    @task
    def test_execution_task(self) -> Task:
        return Task(
            config=self.tasks_config['test_execution_task'],
            output_file=os.path.join(self.output_dir, 'test_results.md')
        )

    @task
    def ci_cd_pipeline_task(self) -> Task:
        return Task(
            config=self.tasks_config['ci_cd_pipeline_task'],
            output_file=os.path.join(self.output_dir, 'cicd_log.md')
        )

    @task
    def deployment_task(self) -> Task:
        return Task(
            config=self.tasks_config['deployment_task'],
            output_file=os.path.join(self.output_dir, 'deployment_report.md')
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[
                self.product_owner(),
                self.software_architect(),
                self.tech_lead(),
                self.ticket_generator(),
                self.ticket_orchestrator(),
                self.qa_architect(),
                self.senior_engineer(),
                self.code_reviewer(),
                self.qa_engineer(),
                self.devops_engineer()
            ],
            tasks=[
                self.requirements_analysis_task(),
                self.architecture_design_task(),
                self.tech_spec_generation_task(),
                self.ticket_generation_task(),
                self.ticket_orchestration_task(),
                self.test_case_generation_task(),
                self.code_implementation_task(),
                self.code_review_task(),
                self.test_execution_task(),
                self.ci_cd_pipeline_task(),
                self.deployment_task()
            ],
            process=Process.sequential,
            verbose=True,
            memory=True  # Enabling memory as requested
        )

    def run_analysis_phase(self, inputs: dict):
        return Crew(
            agents=[self.product_owner(), self.software_architect(), self.tech_lead()],
            tasks=[
                self.requirements_analysis_task(),
                self.architecture_design_task(),
                self.tech_spec_generation_task()
            ],
            process=Process.sequential,
            verbose=True,
            memory=True
        ).kickoff(inputs=inputs)

    def run_planning_phase(self, inputs: dict):
        return Crew(
            agents=[self.ticket_generator(), self.ticket_orchestrator()],
            tasks=[
                self.ticket_generation_task(),
                self.ticket_orchestration_task()
            ],
            process=Process.sequential,
            verbose=True,
            memory=True
        ).kickoff(inputs=inputs)

    def run_implementation_phase(self, inputs: dict):
        return Crew(
            agents=[self.qa_architect(), self.senior_engineer(), self.code_reviewer()],
            tasks=[
                self.test_case_generation_task(),
                self.code_implementation_task(),
                self.code_review_task()
            ],
            process=Process.sequential,
            verbose=True,
            memory=True
        ).kickoff(inputs=inputs)

    def run_verification_phase(self, inputs: dict):
        return Crew(
            agents=[self.qa_engineer(), self.devops_engineer()],
            tasks=[
                self.test_execution_task(),
                self.ci_cd_pipeline_task(),
                self.deployment_task()
            ],
            process=Process.sequential,
            verbose=True,
            memory=True
        ).kickoff(inputs=inputs)

    def get_agents_config(self):
        return self.agents_config

def run():
    # Example input simulating a meeting transcript
    inputs = {
        'meeting_transcript': '''
        Cliente: Hola, necesitamos una aplicación web para gestionar inventarios de una pequeña tienda.
        PM: Entendido. ¿Qué funcionalidades principales necesitan?
        Cliente: Necesitamos poder agregar productos, editar cantidades, y ver un reporte de stock bajo.
        PM: ¿Algo más?
        Cliente: Sí, autenticación de usuarios para que solo los empleados puedan acceder.
        PM: ¿Preferencia tecnológica?
        Cliente: No, confiamos en ustedes.
        '''
    }
    print(f"Running Crew with inputs: {inputs}")
    SoftwareAgencyCrew().crew().kickoff(inputs=inputs)

if __name__ == "__main__":
    run()
