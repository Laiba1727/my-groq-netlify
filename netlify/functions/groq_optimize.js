const fetch = require("node-fetch");

function extractJSON(text) {
  // Attempt to extract JSON from between ``` or find first valid JSON object
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Failed to parse extracted JSON block.");
    }
  }

  // Try parsing raw content directly if no markdown block
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Direct JSON parse failed.");
    return null;
  }
}

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const code = body.code || "";
    const language = body.language || "code";

    const prompt = `
You are a professional senior developer.

Evaluate the following ${language} code and return the result strictly in valid **JSON format only**, no markdown or extra explanation. Use this structure:

{
  "evaluation": {
    "code_quality": {
      "comment": "string",
      "score": number
    },
    "performance": {
      "comment": "string",
      "score": number
    },
    "readability": {
      "comment": "string",
      "score": number
    },
    "best_practices": {
      "comment": "string",
      "score": number
    }
  },
  "optimization": {
    "optimized_code": "string",
    "explanation": "string",
    "benefits": ["string", "string", "string"]
  }
}

Code to evaluate:
\`\`\`${language}
${code}
\`\`\`
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: "You are a professional developer who always responds in clean, parsable JSON without markdown or explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content || "{}";

    const parsedJson = extractJSON(content);

    if (!parsedJson) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Model did not return valid JSON." })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedJson)
    };

  } catch (err) {
    console.error("Error in groq_optimize function:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Something went wrong." })
    };
  }
};



