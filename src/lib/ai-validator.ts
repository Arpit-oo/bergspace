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
  criteria: SmartCriteria;
}

export interface SmartValidation {
  goals: SmartGoalResult[];
}

export async function validateGoals(
  goals: { title: string; description: string }[]
): Promise<SmartValidation> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Graceful fallback if no API key
  if (!apiKey) {
    return {
      goals: goals.map((g, i) => ({
        index: i,
        title: g.title,
        score: 5,
        passed: true,
        issues: [],
        suggestion: g.title,
        criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
        },
      })),
    };
  }

  const goalsText = goals
    .map(
      (g, i) =>
        `Goal ${i + 1}:\nTitle: ${g.title}\nDescription: ${g.description || "No description"}`
    )
    .join("\n\n");

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
          content: `You are a goal quality evaluator. For each goal, evaluate against SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound). Return JSON only, no markdown fences.

Return this exact JSON structure:
{
  "goals": [
    {
      "index": 0,
      "title": "the goal title",
      "score": 3,
      "passed": false,
      "issues": ["Not time-bound", "Not measurable"],
      "suggestion": "A rewritten SMART version of the goal",
      "criteria": {
        "specific": true,
        "measurable": false,
        "achievable": true,
        "relevant": true,
        "timeBound": false
      }
    }
  ]
}

Rules:
- score is 1-5, counting how many SMART criteria are met
- passed is true if score >= 4
- issues lists which criteria failed (e.g. "Not specific", "Not measurable")
- In the 'suggestion' field, provide ONLY the rewritten goal title — a single concise sentence, not an explanation. Do NOT include preamble like "Define a specific goal, such as..." — just write the improved goal title directly.
- Be constructive and practical in suggestions`,
        },
        {
          role: "user",
          content: `Evaluate these goals:\n\n${goalsText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("OpenAI API error:", response.status, errorBody);
    // Fallback on API error - let goals through
    return {
      goals: goals.map((g, i) => ({
        index: i,
        title: g.title,
        score: 5,
        passed: true,
        issues: [],
        suggestion: g.title,
        criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
        },
      })),
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    // Strip markdown fences if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: SmartValidation = JSON.parse(cleaned);
    return parsed;
  } catch {
    console.error("Failed to parse OpenAI response:", content);
    // Fallback on parse error
    return {
      goals: goals.map((g, i) => ({
        index: i,
        title: g.title,
        score: 5,
        passed: true,
        issues: [],
        suggestion: g.title,
        criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
        },
      })),
    };
  }
}
