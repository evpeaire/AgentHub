/**
 * Cloudflare Worker — GitHub OAuth Token Exchange Proxy
 * 
 * This worker handles the one API call that GitHub blocks from browsers:
 * exchanging an authorization code for an access token.
 * 
 * Deploy: npx wrangler deploy
 * 
 * Required secret (set via `npx wrangler secret put GITHUB_CLIENT_SECRET`):
 *   GITHUB_CLIENT_SECRET — from your GitHub OAuth App settings
 * 
 * Required env var (set in wrangler.toml):
 *   GITHUB_CLIENT_ID — your OAuth App client ID
 *   ALLOWED_ORIGIN — your GitHub Pages URL
 */

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { code } = await request.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { ...corsHeaders(env.ALLOWED_ORIGIN), 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for token with GitHub
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    return new Response(JSON.stringify(tokenData), {
      headers: {
        ...corsHeaders(env.ALLOWED_ORIGIN),
        'Content-Type': 'application/json',
      },
    });
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
