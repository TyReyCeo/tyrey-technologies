"""Provider-agnostic LLM completion layer.

ai_engine composes prompts; this module owns transport — provider selection,
timeouts, retries with backoff, and metadata logging. Logs model, latency, and
token usage only, never user content (CLAUDE.md AI workflow rules).
"""

import logging
import time
from typing import Protocol

from .config import settings

logger = logging.getLogger("tyrey.llm")

REQUEST_TIMEOUT_SECONDS = 120.0
MAX_RETRIES = 2  # SDK retries with exponential backoff on 429/5xx/timeouts


class LLMError(RuntimeError):
    """The model provider failed after retries. main.py maps this to a 502."""


class LLMProvider(Protocol):
    def complete(self, system: str, user: str, max_tokens: int) -> str: ...


class AnthropicProvider:
    def complete(self, system: str, user: str, max_tokens: int) -> str:
        import anthropic

        client = anthropic.Anthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            timeout=REQUEST_TIMEOUT_SECONDS,
            max_retries=MAX_RETRIES,
        )
        started = time.monotonic()
        try:
            response = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
        except anthropic.APIError as exc:
            logger.error(
                "llm call failed model=%s latency_ms=%d error=%s",
                settings.CLAUDE_MODEL,
                int((time.monotonic() - started) * 1000),
                type(exc).__name__,
            )
            raise LLMError("Model provider request failed") from exc

        logger.info(
            "llm call model=%s latency_ms=%d input_tokens=%d output_tokens=%d",
            response.model,
            int((time.monotonic() - started) * 1000),
            response.usage.input_tokens,
            response.usage.output_tokens,
        )
        return "".join(block.text for block in response.content if block.type == "text")


def get_provider() -> LLMProvider:
    """Single seam for swapping model providers (Anthropic today)."""
    return AnthropicProvider()
