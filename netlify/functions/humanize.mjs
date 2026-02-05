export async function handler(event) {
  try {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { essay } = JSON.parse(event.body || "{}");
    if (!essay || !essay.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing essay" })
      };
    }

    // Safety: keep requests reasonable
    if (essay.length > 12000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Essay too long. Please split it into smaller parts." })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY env var in Netlify" })
      };
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

    // Gemini endpoint (key in query string)
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    encodeURIComponent(apiKey);


    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 700
        }
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data?.error?.message || "Gemini request failed" })
      };
    }

    const result =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
}

