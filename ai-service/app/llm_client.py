from abc import ABC, abstractmethod

from openai import AsyncOpenAI

from .config import settings


class LLMError(Exception):
    pass


class LLMClient(ABC):
    @abstractmethod
    async def complete_json(self, system_prompt: str, user_prompt: str) -> str:
        """Return a raw JSON string from the model."""


class OpenAIClient(LLMClient):
    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise LLMError("OPENAI_API_KEY is not set.")
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def complete_json(self, system_prompt: str, user_prompt: str) -> str:
        response = await self._client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content
        if not content:
            raise LLMError("Empty response from OpenAI.")
        return content


class GeminiClient(LLMClient):
    """Stub — same interface as OpenAIClient, swap in google-generativeai here.

    Left unimplemented on purpose: the brief allows either provider, and the
    analyzer only depends on `LLMClient.complete_json`, so wiring in the
    Gemini SDK later is a same-shaped, isolated change.
    """

    async def complete_json(self, system_prompt: str, user_prompt: str) -> str:
        raise NotImplementedError("Set LLM_PROVIDER=openai until Gemini support is added.")


def get_llm_client() -> LLMClient:
    if settings.llm_provider == "gemini":
        return GeminiClient()
    return OpenAIClient()
