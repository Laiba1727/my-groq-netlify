const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const code = body.code || "";
    const language = body.language || "code";

    const prompt = `
You are a professional senior developer.

Evaluate the following ${language} code based on the following **four categories** and provide a **score from 1 to 10** for each:

1. **Code Quality** (e.g., clean, consistent, modular)
2. **Performance** (e.g., efficiency, speed, resource usage)
3. **Readability** (e.g., clear naming, structure, comments)
4. **Best Practices** (e.g., idiomatic code, standards, security)

### Your Response Format:
- Code Quality: X/10
- Performance: X/10
- Readability: X/10
- Best Practices: X/10

Then write a short paragraph explaining the evaluation.

After that, **optimize the code** to improve it. The optimized version should be:
- More concise
- More efficient
- Following best practices

### Code to Evaluate:
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



