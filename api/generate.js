export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { profile, job, platform, length, extra } = req.body;

  if (!job || !profile?.name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const lengthMap = {
    short: '3-4 lines maximum, punchy and direct',
    medium: 'one focused paragraph, around 80-120 words',
    long: 'a full cover letter with 3 sections: hook, relevant experience, call to action — around 200-250 words'
  };

  const prompt = `You are an expert freelance proposal writer for Indian freelancers on ${platform}.

Write a ${lengthMap[length] || lengthMap.medium} proposal for this freelancer:
NAME: ${profile.name}
SKILL: ${profile.skill}
EXPERIENCE: ${profile.exp || 'not specified'}
RATE: ${profile.rate || 'not specified'}
SKILLS: ${profile.skills || 'not specified'}
ACHIEVEMENT: ${profile.achievement || 'not specified'}
TONE: ${profile.tone || 'confident'}

JOB DESCRIPTION:
${job}

${extra ? `EXTRA INSTRUCTIONS: ${extra}` : ''}

Rules:
- Start with a hook that shows you read their SPECIFIC job (NOT "Hi, I am a...")
- Sound human, NOT like AI
- Reference their specific project problem directly
- Mention 1 relevant achievement naturally woven in
- End with a simple, confident call to action
- Do NOT use buzzwords: "passionate", "dedicated", "leverage", "synergy"
- Do NOT use bullet points in the proposal
- Write the proposal ONLY, no preamble or explanation

After the proposal, on a new line write ONLY this JSON:
SCORES:{"personalisation":XX,"clarity":XX,"hook":XX,"win":XX}
Where XX is a number from 1-100. Be honest and critical with scoring.`;

  try {
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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Anthropic API error' });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '';

    const scoreMatch = raw.match(/SCORES:(\{[^}]+\})/);
    const proposal = raw.replace(/SCORES:\{[^}]+\}/, '').trim();
    let scores = { personalisation: 75, clarity: 80, hook: 70, win: 72 };

    if (scoreMatch) {
      try { scores = JSON.parse(scoreMatch[1]); } catch(e) {}
    }

    return res.status(200).json({ proposal, scores });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
