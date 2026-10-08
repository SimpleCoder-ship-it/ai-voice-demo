import asyncio
from main import OPENAI_DEPLOYMENT, extract_form

TRANSCRIPT = "The incident title is fire, date is 10 Oct, dept is safety."

print(f"Testing Azure OpenAI deployment {OPENAI_DEPLOYMENT}...")
form = asyncio.run(extract_form(TRANSCRIPT))
print("Response:", form.model_dump_json(indent=2))

assert "fire" in form.incident_title.lower(), form.incident_title
assert form.date_of_occurrence.endswith("-10-10"), form.date_of_occurrence
assert form.department == "Safety", form.department
print("PASS")
