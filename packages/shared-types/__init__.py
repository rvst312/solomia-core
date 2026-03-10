from pydantic import BaseModel


class AutomationRequest(BaseModel):
    topic: str
    requirements: str

class AutomationDesign(BaseModel):
    flow_design: str
    tasks: list
    tools: list
    cost_strategy: str
