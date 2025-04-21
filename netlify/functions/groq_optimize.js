const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const code = body.code || "";
    const language = body.language || "code";
    const prompt = `
You are a professional senior developer.

Evaluate the following ${language} code thoroughly and provide a structured **Evaluation Report** as follows:

---

*Evaluation Report*

### Code Quality  
Evaluate if the code is clean, modular, and functional. Comment if it fulfills its purpose efficiently.

### Performance  
Comment on the performance, execution speed, and whether operations are optimized.

### Readability  
Discuss clarity in structure, variable naming, and ease of understanding.

### Best Practices  
Mention if the code follows standard practices, idiomatic style, and language-specific norms.

*Score:*  
- Code Quality: X/10  
- Performance: X/10  
- Readability: X/10  
- Best Practices: X/10  

---

*Optimization*  
Provide a more optimized version of the code. Make sure it is:

- More concise  
- More efficient  
- Following best practices

### Optimized Version  
\`\`\`${language}
// your improved version here
\`\`\`

*Explanation:*  
Explain what changes you made and why they are beneficial.

*Benefits:*  
- Bullet point 1  
- Bullet point 2  
- Bullet point 3

---

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



