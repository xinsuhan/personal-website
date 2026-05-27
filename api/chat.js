const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MAX_MESSAGE_LENGTH = 1000;

const systemPrompt =
  "你是 xinsuhan.top 的网站 AI 助手。请用简洁、友好的中文回答用户问题。你可以介绍这个网站、站长的项目、学习方向和页面内容，但不要编造不存在的信息。";

function parseBody(body) {
  if (typeof body === "string") {
    return body ? JSON.parse(body) : {};
  }
  return body || {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let message;
  try {
    const body = parseBody(req.body);
    message = typeof body.message === "string" ? body.message.trim() : "";
  } catch (error) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message is too long" });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: "AI service is not configured" });
  }

  try {
    const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    if (!deepseekResponse.ok) {
      console.error("DeepSeek API request failed", deepseekResponse.status);
      return res.status(502).json({ error: "AI service is unavailable" });
    }

    const data = await deepseekResponse.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "AI service returned an empty response" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat API error", error.message);
    return res.status(500).json({ error: "AI service is unavailable" });
  }
};
