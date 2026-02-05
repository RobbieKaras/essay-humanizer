export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { essay } = JSON.parse(event.body || "{}");
    if (!essay || !essay.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing essay" }) };
    }

    const prompt = `
Polish the essay below to sound like the same person wrote it, but more natural.

Rules:
- Keep the same ideas (do not add new examples)
- Simple, conversational vocabulary
- Avoid academic or overly formal words
- Do NOT use semicolons
- Vary sentence length naturally
- Add light filler phrases when appropriate
- Break into more paragraphs if it improves flow
- Sound like a real college student, not AI or a textbook

Essay:
${essay}
`.trim();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 700
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data?.error?.message || "OpenAI request failed" })
      };
    }

    const result = data.choices?.[0]?.message?.content ?? "";
    return { statusCode: 200, body: JSON.stringify({ result }) };

  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
}
