import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { systemPrompt } from '@/content/systemprompt';
import { CoreSystemMessage, CoreMessage } from '@/types';
import fetch from 'node-fetch';  

const googleApiKey = process.env.GOOGLE_API_KEY;
const googleCx = process.env.GOOGLE_CX;

if (!googleApiKey || !googleCx) {
  throw new Error("GOOGLE_API_KEY or GOOGLE_CX is not set in environment variables");
}

async function performGoogleSearch(twitterHandle: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(twitterHandle)}&key=${googleApiKey}&cx=${googleCx}`
  );
  const data = await response.json();

  if (data.items && data.items.length > 0) {
    return data.items.map((item: { title: string, snippet: string, link: string }) => 
      `${item.title}\n${item.snippet}\n${item.link}`).join("\n\n");
  }

  return "No relevant search results found.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { link, messages } = body;

    if (!link && (!messages || !Array.isArray(messages))) {
      return NextResponse.json({ error: 'Invalid Twitter handle or messages' }, { status: 400 });
    }

    const twitterHandle = link || extractTwitterHandle(messages.map((msg: CoreMessage) => msg.content).join(' '));

    let webSearchData = '';

    if (twitterHandle) {
      webSearchData = await performGoogleSearch(twitterHandle);
    } else {
      webSearchData = 'No Twitter profile URL found in the user message.';
    }

    const augmentedPrompt: CoreSystemMessage = {
      role: 'system',
      content: `The user requested to roast this Twitter profile: "${twitterHandle}". Based on web search, here is some relevant data: ${webSearchData}`
    };

    const userMessages: CoreMessage[] = messages ? convertToCoreMessages(messages) : [];
    const combinedMessages: CoreMessage[] = [systemPrompt, augmentedPrompt, ...userMessages];

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: combinedMessages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process the request' }, { status: 500 });
  }
}

function extractTwitterHandle(messageContent: string): string | null {
  // Match both https://x.com/username and https://twitter.com/username formats
  const urlPattern = /(https?:\/\/(www\.)?(x\.com|twitter\.com)\/([a-zA-Z0-9_]{1,15}))/g;
  const matches = messageContent.match(urlPattern);

  // If we find a URL, extract the username part (group 4 in regex)
  if (matches && matches.length > 0) {
    const urlMatch = matches[0];
    const username = urlMatch.split('/').pop(); // Get the part after the last '/'
    return username ? username : null;
  }

  // Otherwise, check if an @username format is used
  const twitterPattern = /@([a-zA-Z0-9_]{1,15})/g;
  const twitterMatches = messageContent.match(twitterPattern);
  if (twitterMatches && twitterMatches.length > 0) {
    return twitterMatches[0].replace('@', ''); // Remove the '@' symbol and return the handle
  }

  // Return null if no handle or URL is found
  return null;
}

