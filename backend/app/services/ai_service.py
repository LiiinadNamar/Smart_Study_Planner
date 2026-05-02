"""AI Service — LLM integration via OpenRouter (OpenAI-compatible API).

Supports any model available on OpenRouter including free tiers:
- google/gemini-2.0-flash-exp:free
- google/gemini-2.5-flash-preview
- perplexity/sonar-small-online
"""

import asyncio
import json
import logging

from openai import AsyncOpenAI, APITimeoutError, APIConnectionError, APIStatusError

from app.core.config import settings

logger = logging.getLogger(__name__)

_PLACEHOLDER_KEYS = ("", "your-openrouter-api-key-here")


def _strip_json_fence(raw: str) -> str:
    """Strip markdown code fences from an LLM response.

    Handles:
        ```json\\n[...]\\n```
        ```\\n[...]\\n```
        plain JSON with no fences
    """
    raw = raw.strip()
    if raw.startswith("```"):
        # Remove opening fence line (```json or ```)
        first_newline = raw.find("\n")
        if first_newline != -1:
            raw = raw[first_newline + 1:]
        else:
            raw = raw[3:]
        # Remove closing fence
        if raw.endswith("```"):
            raw = raw[: raw.rfind("```")]
    return raw.strip()


class AIService:
    """Handles all LLM-powered features via OpenRouter."""

    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY or "no-key",
            timeout=settings.OPENAI_TIMEOUT,
        )
        self.model = settings.OPENROUTER_MODEL

    def _check_api_key(self):
        """Raise a descriptive error if the API key is not configured."""
        if settings.OPENROUTER_API_KEY in _PLACEHOLDER_KEYS:
            raise RuntimeError(
                "OpenRouter API key is not configured. "
                "Add OPENROUTER_API_KEY to backend/.env "
                "(get a free key at https://openrouter.ai/keys)."
            )

    async def _chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        retries: int = 1,
    ) -> str:
        """Send a chat completion request to OpenRouter with timeout, retry, and model fallback."""
        self._check_api_key()

        # Reliable free models to fall back to if the primary one is down or rate-limited
        fallback_models = [
            "google/gemma-3-27b-it:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "qwen/qwen3-coder:free",
            "google/gemini-2.0-flash-exp:free",
            "openrouter/free",
        ]

        models_to_try = [self.model]
        for fm in fallback_models:
            if fm not in models_to_try:
                models_to_try.append(fm)

        last_error: Exception | None = None

        for current_model in models_to_try:
            for attempt in range(retries + 1):
                try:
                    response = await self.client.chat.completions.create(
                        model=current_model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=temperature,
                        max_tokens=max_tokens,
                        extra_headers={
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "Smart Study Planner",
                        },
                    )
                    return response.choices[0].message.content or ""

                except APITimeoutError as e:
                    last_error = e
                    logger.warning(
                        f"AI request timed out on {current_model} (attempt {attempt + 1}/{retries + 1})"
                    )
                    if attempt < retries:
                        await asyncio.sleep(1)

                except APIConnectionError as e:
                    last_error = e
                    logger.error(f"AI connection error: {e}")
                    # Connection error implies networking issue, break out completely
                    raise RuntimeError(f"Connection error to AI provider: {e}")

                except APIStatusError as e:
                    last_error = e
                    if e.status_code in (401, 403):
                        raise RuntimeError(
                            f"Invalid or missing OpenRouter API key "
                            f"(HTTP {e.status_code}). Check OPENROUTER_API_KEY in .env."
                        )
                    # 429 = rate limit, 404 = removed model, 5xx = server down
                    logger.warning(f"Model {current_model} unavailable (HTTP {e.status_code}): {e.message}")
                    break  # Stop retrying this model, move to the next fallback model

                except Exception as e:
                    last_error = e
                    logger.error(f"Unexpected AI error with {current_model}: {e}")
                    break  # Move to next model

        raise RuntimeError(
            f"AI service unavailable. All models failed. Last error: {last_error}"
        )

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    async def summarize_text(self, text: str) -> str:
        """Generate a structured markdown summary of the learning material."""
        system_prompt = """You are an expert academic assistant. Create a clear, structured summary.

Format your response as follows:
## Key Concepts
- List the main concepts covered

## Detailed Summary
Concise but thorough summary organized by topic.

## Key Takeaways
- List 3-5 most important points to remember

## Glossary
- Define any important terms

Use markdown formatting."""

        user_prompt = f"Please summarize the following learning material:\n\n{text[:8000]}"

        return await self._chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=2000,
            retries=1,
        )

    async def generate_quiz(self, summary: str, num_questions: int = 5) -> list[dict]:
        """Generate multiple-choice quiz questions from a summary.

        Returns:
            List of dicts: [{question, options, correct_index}]
        """
        system_prompt = f"""You are a quiz generator for students. Create exactly {num_questions} \
multiple-choice questions based on the provided material.

You MUST respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON.

Each question object must have exactly these fields:
- "question": the question text (string)
- "options": exactly 4 answer options (array of 4 strings)
- "correct_index": index of the correct option, 0-3 (integer)

Example format:
[
  {{
    "question": "What is X?",
    "options": ["A", "B", "C", "D"],
    "correct_index": 2
  }}
]"""

        user_prompt = f"Generate {num_questions} quiz questions from this material:\n\n{summary[:5000]}"

        raw = await self._chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.5,
            max_tokens=3000,
            retries=1,
        )

        cleaned = _strip_json_fence(raw)

        try:
            questions = json.loads(cleaned)
            if not isinstance(questions, list):
                raise ValueError("Response is not a JSON array")
            validated = []
            for q in questions:
                validated.append({
                    "question": str(q.get("question", "")),
                    "options": [str(o) for o in q.get("options", [])[:4]],
                    "correct_index": int(q.get("correct_index", 0)),
                })
            return validated
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse quiz JSON: {e}\nRaw: {raw[:500]}")
            raise RuntimeError(
                "AI returned an invalid quiz format. Please try again."
            )

    async def generate_roadmap(self, goal: str, weeks: int = 4) -> list[dict]:
        """Generate a week-by-week learning roadmap.

        Returns:
            List of dicts: [{week, title, description, tasks}]
        """
        system_prompt = f"""You are an expert learning coach. Create a {weeks}-week study roadmap.

You MUST respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON.

Each week object must have exactly these fields:
- "week": week number (integer, starting from 1)
- "title": short title for the week (string)
- "description": what the student will learn this week (string)
- "tasks": array of 3-5 specific actionable tasks (array of strings)

Example format:
[
  {{
    "week": 1,
    "title": "Fundamentals",
    "description": "Learn the basics of...",
    "tasks": ["Read chapter 1", "Complete exercise set A", "Watch intro video"]
  }}
]"""

        user_prompt = f"Create a {weeks}-week learning roadmap for: {goal}"

        raw = await self._chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=3000,
            retries=1,
        )

        cleaned = _strip_json_fence(raw)

        try:
            roadmap = json.loads(cleaned)
            if not isinstance(roadmap, list):
                raise ValueError("Response is not a JSON array")
            validated = []
            for step in roadmap:
                validated.append({
                    "week": int(step.get("week", 0)),
                    "title": str(step.get("title", "")),
                    "description": str(step.get("description", "")),
                    "tasks": [str(t) for t in step.get("tasks", [])],
                })
            return validated
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse roadmap JSON: {e}\nRaw: {raw[:500]}")
            raise RuntimeError("AI returned an invalid roadmap format. Please try again.")


# Singleton instance
ai_service = AIService()
