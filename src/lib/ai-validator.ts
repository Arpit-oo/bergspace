interface SmartCriteria {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
}

interface SmartGoalResult {
  index: number;
  title: string;
  score: number;
  passed: boolean;
  issues: string[];
  suggestion: string;
  suggestedDescription: string;
  criteria: SmartCriteria;
}

export interface SmartValidation {
  goals: SmartGoalResult[];
}

const FALLBACK = (goals: { title: string; description: string }[]): SmartValidation => ({
  goals: goals.map((g, i) => ({
    index: i,
    title: g.title,
    score: 5,
    passed: true,
    issues: [],
    suggestion: g.title,
    suggestedDescription: g.description || "",
    criteria: { specific: true, measurable: true, achievable: true, relevant: true, timeBound: true },
  })),
});

export async function validateGoals(
  goals: { title: string; description: string }[]
): Promise<SmartValidation> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return FALLBACK(goals);

  const goalsText = goals
    .map((g, i) => `Goal ${i + 1}:\nTitle: ${g.title}\nDescription: ${g.description || "None provided"}`)
    .join("\n\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You evaluate workplace goals against SMART criteria. Return ONLY valid JSON, no markdown.

CRITICAL RULES FOR THE "suggestion" FIELD:
- Write an ACTUAL improved goal title. NOT advice. NOT instructions.
- BAD: "Define a specific goal with clear measurable outcomes"
- BAD: "Set a target for revenue increase"
- GOOD: "Increase quarterly revenue by 15% through enterprise upsells by Q2 2026"
- GOOD: "Reduce customer churn from 8% to 4% by implementing proactive outreach program"
- The suggestion must be a COMPLETE, CONCRETE, ACTIONABLE goal title that someone could copy-paste directly.

CRITICAL RULES FOR THE "suggestedDescription" FIELD:
- Write 1-2 sentences describing HOW the goal will be achieved.
- Include specific methods, metrics, or milestones.
- BAD: "Improve the description to be more specific"
- GOOD: "Optimize database queries and implement Redis caching for top 10 API endpoints. Target P95 latency under 200ms measured via Datadog APM."

JSON structure:
{
  "goals": [
    {
      "index": 0,
      "title": "original title",
      "score": 3,
      "passed": false,
      "issues": ["Not measurable", "Not time-bound"],
      "suggestion": "Increase monthly active users from 5K to 15K by Q3 2026 through targeted content marketing",
      "suggestedDescription": "Launch weekly blog series and LinkedIn campaign targeting mid-market SaaS companies. Track MAU via Mixpanel with weekly reviews.",
      "criteria": { "specific": true, "measurable": false, "achievable": true, "relevant": true, "timeBound": false }
    }
  ]
}

- score: count of true criteria (0-5)
- passed: true if score >= 4
- issues: list ONLY failed criteria names
- If the goal is already SMART (score 5), set suggestion = original title, suggestedDescription = original description`,
          },
          {
            role: "user",
            content: `Evaluate these goals:\n\n${goalsText}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return FALLBACK(goals);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: SmartValidation = JSON.parse(cleaned);

    // Ensure suggestedDescription exists on all goals
    parsed.goals = parsed.goals.map((g, i) => ({
      ...g,
      suggestedDescription: g.suggestedDescription || goals[i]?.description || "",
    }));

    return parsed;
  } catch (e) {
    console.error("AI validator error:", e);
    return FALLBACK(goals);
  }
}
