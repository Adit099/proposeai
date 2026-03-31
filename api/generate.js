export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { profile, job, platform, length, extra } = req.body;
  if (!job || !profile?.name) return res.status(400).json({ error: 'Missing fields' });

  const lengthMap = {
    short: '3-4 lines maximum, punchy and direct',
    medium: 'one focused paragraph, around 80-120 words',
    long: 'full cover letter: hook, experience, CTA, around 200-250 words'
  };

  const prompt = `You are an expert freelance proposal writer for Indian freelancers on ${platform}.

Write a ${lengthMap[length]||lengthMap.medium} proposal for:
NAME: ${profile.name}
SKILL: ${profile.skill}
EXPERIENCE: ${profile.exp||'n/a'}
RATE: ${profile.rate||'n/a'}
SKILLS: ${profile.skills||'n/a'}
ACHIEVEMENT: ${profile.win||'n/a'}
TONE: ${profile.tone||'confident'}

JOB DESCRIPTION:
${job}

${extra?'EXTRA: '+extra:''}

Rules:
- Start with a hook that shows you read their specific job (NOT "Hi, I am a...")
- Sound human, NOT like AI
- Reference their specific project problem
- Mention 1 relevant achievement naturally
- End with a confident call to action
- No buzzwords like "passionate", "dedicated", "leverage"
- No bullet points
- Write the proposal ONLY, no preamble

After the proposal add exactly:
SCORES:{"personalisation":XX,"clarity":XX,"hook":XX,"win":XX}
Where XX is 1-100.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.8 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const scoreMatch = raw.match(/SCORES:(\{[^}]+\})/);
    const proposal = raw.replace(/SCORES:\{[^}]+\}/, '').trim();
    let scores = { personalisation: 75, clarity: 80, hook: 70, win: 72 };
    if (scoreMatch) { try { scores = JSON.parse(scoreMatch[1]); } catch(e) {} }

    return res.status(200).json({ proposal, scores });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
