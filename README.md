# ProposeAI — AI Proposal Generator for Indian Freelancers

## Project Structure
```
proposeai/
├── index.html        ← Main app (full UI)
├── api/
│   └── generate.js   ← Vercel serverless backend (holds API key securely)
├── vercel.json       ← Vercel routing config
└── README.md
```

## Deploy to Vercel (15 minutes)

### Step 1 — GitHub
1. Go to github.com → New Repository → name it `proposeai` → Public
2. Upload all files (keep the folder structure — api/generate.js must be in an `api` folder)
3. Commit

### Step 2 — Vercel
1. Go to vercel.com → Sign up with GitHub
2. Click "New Project" → Import your `proposeai` repo
3. Click Deploy — it'll detect the config automatically

### Step 3 — Add API Key (CRITICAL)
1. In Vercel dashboard → Your project → Settings → Environment Variables
2. Add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (get it from console.anthropic.com)
3. Click Save → Redeploy

### Step 4 — Custom Domain (Optional)
1. Buy `proposeai.in` on Namecheap (~₹800/year)
2. Vercel → Project → Settings → Domains → Add domain
3. Follow DNS instructions

## How the API Key Works
- Your API key lives ONLY in Vercel's environment variables
- Users never see it — it's server-side only
- The frontend calls `/api/generate` → Vercel runs `api/generate.js` → that calls Anthropic with your key
- 100% secure

## Adding Razorpay Payments
In `index.html`, find the `pay()` function and replace the `alert()` with:
```javascript
const rzp = new Razorpay({
  key: 'YOUR_RAZORPAY_KEY',
  amount: 49900, // ₹499 in paise
  currency: 'INR',
  name: 'ProposeAI',
  description: 'Pro Monthly Subscription',
  handler: function(response) {
    // Mark user as pro after payment
    localStorage.setItem('pai2_pro', 'true');
    document.getElementById('paywall').classList.remove('show');
    updateUsageUI();
  }
});
rzp.open();
```
Also add this script tag to index.html: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`

## Adding Google Analytics
Add this inside `<head>` in index.html:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```
Replace `G-XXXXXXXXXX` with your Google Analytics ID.
