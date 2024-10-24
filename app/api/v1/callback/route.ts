import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

const clientId = process.env.PAID_TWITTER_CLIENT_ID as string;
const clientSecret = process.env.PAID_TWITTER_CLIENT_SECRET as string;
const redirectUri = 'https://www.heehhehe.online/api/v1/callback'; 
const tokenEndpoint = 'https://api.twitter.com/oauth2/token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorizationCode = searchParams.get('code');

  if (!authorizationCode) {
    return NextResponse.json({ error: 'Authorization code not found' }, { status: 400 });
  }

  const codeVerifier = ''; // Store this from the authorization request

  // Exchange authorization code for access token
  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
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
    return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 400 });
  }

  // Store the token or proceed to posting a tweet using the access token.
  return NextResponse.json({ success: true, token: tokenData });
}
