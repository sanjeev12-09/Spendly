module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { total, catStr, txList, month } = req.body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ text: 'GROQ_API_KEY not configured in Vercel environment variables.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly, sharp personal finance advisor. Be conversational, warm, and insightful. Use Indian Rupee context. Short readable paragraphs only. No markdown, no bullet points. Speak directly to the user.'
          },
          {
            role: 'user',
            content: `Analyze my ${month} spending:\nTotal: Rs.${total}\nBy Category: ${catStr}\nTransactions:\n${txList}\n\nGive: 1) Quick overall summary, 2) What stands out good or bad, 3) Two specific actionable money-saving tips. Under 200 words.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ text: `Groq error: ${data.error?.message || JSON.stringify(data)}` });
    }

    const text = data.choices?.[0]?.message?.content?.trim() || 'Analysis failed.';
    res.status(200).json({ text });

  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ text: `Error: ${err.message}` });
  }
};
