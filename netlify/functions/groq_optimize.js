const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const code = body.code || "";
    const language = body.language || "code";

    const prompt = `
You are a professional developer.

First, **evaluate** the following ${language} code for:
1. Code quality
2. Performance
3. Readability
4. Best practices

Then, **optimize** the code to make it more concise and efficient.

Return both:
- A short evaluation report
- The optimized version of the code

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
            content: "You are a professional developer who evaluates and improves code quality, performance, and readability."
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

    console.log("Groq API response:", result);

    const full_response = result?.choices?.[0]?.message?.content || "No output received from the model.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluation_and_optimization: full_response })
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


