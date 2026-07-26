export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { food, grams } = req.body || {};
  if (!food || !grams) {
    return res.status(400).json({ error: 'Missing food or grams' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: "You are a nutrition database. Given a food and a quantity in grams, respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape: {\"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number}. Numbers are grams for protein/carbs/fat and kcal for calories, for the exact quantity given. Use standard nutrition database values, best estimate if the food is ambiguous.",
        messages: [{ role: 'user', content: `${food}, ${grams}g` }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: errText });
    }

    const data = await response.json();
    const textBlock = data.content.find(b => b.type === 'text');
    const clean = textBlock.text.replace(/```json|```/g, '').trim();
    const macros = JSON.parse(clean);

    return res.status(200).json(macros);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
