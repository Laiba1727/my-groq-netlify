const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const code = body.code || "";
    const language = body.language || "code";

    const prompt = `Optimize the following ${language} code to make it more concise and efficient:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: "You are a professional developer who improves code quality, performance, and readability." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 512
      })
    });

    const result = await response.json();

    // Log the full result to inspect the API response
    console.log("Groq API response:", result);

    const optimized_code = result?.choices?.[0]?.message?.content || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optimized_code })
    };

  } catch (err) {
    console.error("Error in groq_optimize function:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong." })
    };
  }
};

