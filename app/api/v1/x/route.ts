import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

// Ensure environment variables are defined (Paid-Tier Credentials)
const twitterApiKey = process.env.PAID_TWITTER_API_KEY as string;
const twitterApiSecretKey = process.env.PAID_TWITTER_API_SECRET_KEY as string;
const twitterAccessToken = process.env.PAID_TWITTER_ACCESS_TOKEN as string;
const twitterAccessTokenSecret = process.env.PAID_TWITTER_ACCESS_TOKEN_SECRET as string;

console.log('Twitter API Key:', twitterApiKey ? 'Loaded' : 'Missing');
console.log('Twitter API Secret Key:', twitterApiSecretKey ? 'Loaded' : 'Missing');
console.log('Twitter Access Token:', twitterAccessToken ? 'Loaded' : 'Missing');
console.log('Twitter Access Token Secret:', twitterAccessTokenSecret ? 'Loaded' : 'Missing');

if (!twitterApiKey || !twitterApiSecretKey || !twitterAccessToken || !twitterAccessTokenSecret) {
  console.error('Missing Twitter API credentials');
  throw new Error("Twitter API credentials are missing from environment variables");
}

// Function to post a tweet using Twitter API v2 with OAuth 1.0a User Context
async function postToTwitterV2(status: string): Promise<string | null> {
  console.log('Preparing to post tweet:', status);
  
  const oauthClient = new OAuth({
    consumer: {
      key: twitterApiKey,
      secret: twitterApiSecretKey,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString: string, key: string) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });

  const request_data = {
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST',
    data: {
      text: status,
    },
  };

  const token = {
    key: twitterAccessToken,
    secret: twitterAccessTokenSecret,
  };

  console.log('OAuth Client generated successfully');
  console.log('Request data:', request_data);
  console.log('Token details:', token);

  // Generate the OAuth header
  const authHeader = oauthClient.toHeader(oauthClient.authorize(request_data, token));

  console.log('OAuth Authorization Header:', authHeader.Authorization);

  return new Promise((resolve, reject) => {
    console.log('Sending POST request to Twitter API...');
    
    fetch(request_data.url, {
      method: request_data.method,
      body: JSON.stringify(request_data.data),
      headers: {
        'Authorization': authHeader.Authorization,
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        console.log('Received response from Twitter API. Status:', response.status);

        if (!response.ok) {
          console.log('Response was not ok, checking error details...');
          const errorData = await response.json();
          console.error('Twitter API error:', errorData);
          return reject(new Error(`Twitter API returned an error: ${errorData.errors?.[0]?.message || 'Unknown error'}`));
        }

        const jsonResponse = await response.json();
        console.log('Twitter API Response Body:', jsonResponse);

        if (jsonResponse.data && jsonResponse.data.id) {
          const tweetUrl = `https://twitter.com/user/status/${jsonResponse.data.id}`;
          console.log('Tweet posted successfully:', tweetUrl);
          resolve(tweetUrl);
        } else {
          console.error('Failed to post the tweet: No tweet ID in response.');
          reject(new Error('Failed to post the tweet.'));
        }
      })
      .catch((error) => {
        console.error('Error posting to Twitter:', error);
        reject(error);
      });
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Processing new POST request...');

    const body = await request.json();
    console.log('Request body received:', body);

    const { roastMessage } = body;

    if (!roastMessage) {
      console.warn('No roastMessage provided in the request');
      return NextResponse.json({ error: 'No roast message provided' }, { status: 400 });
    }

    console.log('Roast message received:', roastMessage);

    // Post the roast message to Twitter using v2 API
    const tweetUrl = await postToTwitterV2(roastMessage);

    if (tweetUrl) {
      console.log('Tweet posted successfully. Returning success response.');
      return NextResponse.json({ success: true, tweetUrl });
    } else {
      console.error('Failed to post the tweet. Returning error response.');
      return NextResponse.json({ error: 'Failed to post the tweet' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process the request' }, { status: 500 });
  }
}
