const fetch = require("node-fetch");
const languageDetect = require("language-detect");

function extractJSON(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  let jsonString = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    try {
      jsonString = jsonString
        .replace(/\\n/g, "\n")
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\&/g, "&")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f");
      return JSON.parse(jsonString);
    } catch (err2) {
      console.error("Failed to sanitize and parse JSON:", err2);
      return null;
    }
  }
}

function detectLanguage(code) {
  try {
    const lang = languageDetect.sync(code);
    return lang || "unknown";
  } catch {
    return "unknown";
  }
}

exports.handler = async function (event, context) {
  try {
    const body = JSON.parse(event.body);
    const code = body.code || "";
    const language = body.language || detectLanguage(code);

    const prompt = `
You are a professional senior developer.

Evaluate the following ${language} code and return the result strictly in valid JSON format only, with no markdown, no extra explanation, and no apologies. Always include the "optimized_code" field with properly escaped **full runnable code**, including necessary imports and example usage if applicable. If the code is already optimal, repeat it in the "optimized_code" field.

Use this structure exactly:

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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: "You are a professional developer who always responds in clean, valid JSON only, with no markdown and no extra commentary.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content || "{}";

    console.log("Raw model output:", content);

    const parsedJson = extractJSON(content);

    if (!parsedJson || !parsedJson.optimization || !parsedJson.optimization.optimized_code) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Model did not return valid optimized_code or JSON structure." }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedJson),
    };
  } catch (err) {
    console.error("Error in groqOptimize function:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Something went wrong." }),
    };
  }
};


