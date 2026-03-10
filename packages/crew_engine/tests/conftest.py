import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mock_llm():
    """Mock the LLM to avoid API calls."""
    mock = MagicMock()
    # Configure the mock to return a response structure that CrewAI expects
    mock.predict.return_value = "Mocked LLM response"
    return mock

@pytest.fixture(autouse=True)
def mock_openai_env_vars(monkeypatch):
    """Set dummy environment variables for OpenAI to prevent validation errors."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-dummy-key")
    monkeypatch.setenv("OPENAI_MODEL_NAME", "gpt-4")
