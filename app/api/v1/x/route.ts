import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import crypto from 'crypto';

const clientId = process.env.PAID_TWITTER_CLIENT_ID as string;
const clientSecret = process.env.PAID_TWITTER_CLIENT_SECRET as string;
const redirectUri = 'https://www.heehhehe.online/api/v1/callback'; // Make sure the callback URL is properly set in your Twitter app
const authorizationEndpoint = 'https://twitter.com/i/oauth2/authorize';
const tokenEndpoint = 'https://api.twitter.com/oauth2/token';
const twitterApiUrl = 'https://api.twitter.com/2/tweets';

let codeVerifier: string | null = null; // Store the code verifier

// Helper to create the code verifier and code challenge
function generateCodeVerifierAndChallenge() {
  codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// 1. Redirect user to Twitter authorization
export function GET() {
  const { codeChallenge } = generateCodeVerifierAndChallenge();
  const authorizationUrl = `${authorizationEndpoint}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=tweet.read tweet.write users.read&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return NextResponse.redirect(authorizationUrl);
}

// 2. Callback to handle authorization code and get access token
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorizationCode = searchParams.get('code');

  if (!authorizationCode) {
    return NextResponse.json({ error: 'Authorization code not found' }, { status: 400 });
  }

  if (!codeVerifier) {
    return NextResponse.json({ error: 'Code verifier not found. Possible session issue.' }, { status: 400 });
  }

  // Exchange authorization code for access token
  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code: authorizationCode,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return NextResponse.json({ error: 'Failed to obtain access token', details: tokenData }, { status: 400 });
  }

  // 3. Post tweet using OAuth 2.0 Access Token
  const { roastMessage } = await request.json();
  const tweetResponse = await fetch(twitterApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: roastMessage }),
  });

  if (!tweetResponse.ok) {
    const error = await tweetResponse.json();
    return NextResponse.json({ error: 'Failed to post tweet', details: error }, { status: 400 });
  }

  const tweetData = await tweetResponse.json();
  return NextResponse.json({ success: true, tweetData });
}
