export default async function handler(req, res) {
  // Allow CORS from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { total, catStr, txList, month } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are a friendly, sharp personal finance advisor. Be conversational, warm, insightful. Use Indian Rupee context. Short readable paragraphs only. No markdown, no bullet points. Speak directly to the user.',
        messages: [{
          role: 'user',
          content: `Analyze my ${month} spending:\nTotal: ₹${total}\nBy Category: ${catStr}\nTransactions:\n${txList}\n\nGive: 1) Quick overall summary, 2) What stands out good or bad, 3) Two specific actionable money-saving tips. Under 200 words.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('').trim() || 'Analysis failed.';
    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
