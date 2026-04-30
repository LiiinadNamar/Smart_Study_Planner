"""AI Service — LLM integration via OpenRouter (OpenAI-compatible API).

Supports any model available on OpenRouter including free tiers:
- google/gemini-2.0-flash-exp:free
- google/gemini-2.5-flash-preview
- perplexity/sonar-small-online
"""

import json
import logging
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Handles all LLM-powered features via OpenRouter."""

    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY,
        )
        self.model = settings.OPENROUTER_MODEL

    async def _chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Send a chat completion request to OpenRouter."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
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
        except Exception as e:
            logger.error(f"LLM API error: {e}")
            raise RuntimeError(f"AI service unavailable: {str(e)}")

    async def summarize_text(self, text: str) -> str:
        """Generate a structured summary of the learning material.

        Args:
            text: Raw extracted text from a document.

        Returns:
            Structured markdown summary.
        """
        system_prompt = """You are an expert academic assistant. Your task is to create a clear, 
structured summary of the provided learning material. 

Format your response as follows:
## Key Concepts
- List the main concepts covered

## Detailed Summary
Provide a concise but thorough summary organized by topic.

## Key Takeaways
- List 3-5 most important points to remember

## Glossary
- Define any important terms

Keep the summary concise but comprehensive. Use markdown formatting."""

        user_prompt = f"Please summarize the following learning material:\n\n{text[:8000]}"

        return await self._chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=2000,
        )

    async def generate_quiz(self, summary: str, num_questions: int = 5) -> list[dict]:
        """Generate multiple-choice quiz questions from a summary.

        Args:
            summary: AI-generated summary text.
            num_questions: Number of questions to generate (1-20).

        Returns:
            List of dicts: [{question, options, correct_index}]
        """
        system_prompt = f"""You are a quiz generator for students. Create exactly {num_questions} 
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
        )

        # Parse JSON from response (handle possible markdown wrapping)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        try:
            questions = json.loads(raw)
            if not isinstance(questions, list):
                raise ValueError("Response is not a JSON array")
            # Validate structure
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
            raise RuntimeError(f"Failed to parse AI quiz response: {e}")

    async def generate_roadmap(self, goal: str, weeks: int = 4) -> list[dict]:
        """Generate a week-by-week learning roadmap for a goal.

        Args:
            goal: The learning goal (e.g., "Learn React").
            weeks: Number of weeks for the roadmap.

        Returns:
            List of dicts: [{week, title, description, tasks}]
        """
        system_prompt = f"""You are an expert learning coach. Create a {weeks}-week study roadmap 
for a student's learning goal.

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
        )

        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        try:
            roadmap = json.loads(raw)
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
            raise RuntimeError(f"Failed to parse AI roadmap response: {e}")


# Singleton instance
ai_service = AIService()
