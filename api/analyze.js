module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { total, catStr, txList, month } = req.body;

    const prompt = `You are a friendly, sharp personal finance advisor. Be conversational, warm, and insightful. Use Indian Rupee context. Short readable paragraphs only. No markdown, no bullet points. Speak directly to the user.

Analyze my ${month} spending:
Total: Rs.${total}
By Category: ${catStr}
Transactions:
${txList}

Give: 1) Quick overall summary, 2) What stands out good or bad, 3) Two specific actionable money-saving tips. Under 200 words.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ text: 'Gemini API key not configured. Please add GEMINI_API_KEY in Vercel environment variables.' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ text: `Gemini error: ${data.error?.message || 'Unknown error'}` });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return res.status(500).json({ text: `Gemini returned no text. Raw: ${JSON.stringify(data)}` });
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ text: `Error: ${err.message}` });
  }
};
