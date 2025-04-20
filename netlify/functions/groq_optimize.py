def handler(event, context):
    import requests
    import json
    import os

    body = json.loads(event["body"])
    input_code = body.get("code", "")

    headers = {
        "Authorization": f"Bearer {os.environ.get('GROQ_API_KEY')}",
        "Content-Type": "application/json"
    }

    prompt = f"Optimize this Python code:\n\n```python\n{input_code}\n```"

    payload = {
        "model": "mixtral-8x7b-32768",  # you can change to other models like llama2-70b-4096
        "messages": [
            {"role": "system", "content": "You are an expert Python developer who writes clean, optimized code."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 512
    }

    response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)

    optimized_code = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"optimized_code": optimized_code})
    }
