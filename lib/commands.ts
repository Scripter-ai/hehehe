import { CommandResponse } from '@/types';
import { insults } from '@/content/insults'; 
import { facts } from '@/content/facts'; 
import { wisdom } from '@/content/wisdom';

// Helper function to store a roast in localStorage
function saveRoastToLocalStorage(twitterHandle: string, roast: string) {
  const storedRoasts = JSON.parse(localStorage.getItem('roasts') || '{}');
  storedRoasts[twitterHandle] = roast;
  localStorage.setItem('roasts', JSON.stringify(storedRoasts));
}

// Helper function to retrieve a roast from localStorage
function getRoastFromLocalStorage(twitterHandle: string): string | null {
  const storedRoasts = JSON.parse(localStorage.getItem('roasts') || '{}');
  return storedRoasts[twitterHandle] || null;
}

// Helper function to format URLs as clickable links
const makeUrlClickable = (url: string) => {
  return `<a href="${url}" target="_blank" class="text-blue-500 underline">${url}</a>`;
};

// Helper function to get a random item from an array
const getRandomItem = (array: string[]) => array[Math.floor(Math.random() * array.length)];

export async function runCommand(input: string): Promise<CommandResponse> {
  const [command, ...args] = input.split(' ');

  switch (command.toLowerCase()) { // Convert command to lowercase to ensure case-insensitivity

    case 'roast':
      // Check if the user provided a Twitter handle (starts with '@')
      if (args.length === 0) {
        // No handle provided, ask the user to provide a Twitter handle
        return { output: ['Please provide a Twitter handle. Example: roast @twitterusername'] };
      } else if (args[0]?.startsWith('@')) {
        const twitterHandle = args[0];
        const roastMessage = `use roast not Roast......`;

        // Store the generated roast in localStorage
        saveRoastToLocalStorage(twitterHandle, roastMessage);

        return { output: [`Roasting Twitter profile ${twitterHandle}...`, roastMessage] };
      } else {
        return { output: ['Invalid format. Use: roast @<twitterhandle>'] };
      }

      case 'share':
        // Check if a Twitter handle is provided
        if (args.length === 0 || !args[0].startsWith('@')) {
          return { output: ['Please provide a Twitter handle to share. Example: share @twitterusername'] };
        }
  
        const twitterHandle = args[0];
        const storedRoast = getRoastFromLocalStorage(twitterHandle);
  
        if (!storedRoast) {
          return { output: [`No roast available for ${twitterHandle}. Please roast a Twitter profile first using the roast command.`] };
        }
  
        const tweetText = `#GRIFFINAI\n\nRoasting ${twitterHandle} with Peter Griffin's AI roast! 🔥\n\n${storedRoast}\n\nDdrdT2BKsh3xgXYGvKkVs4ahqG99dQJsMgXfadCQpump`;
  
        // Call your API to post the tweet
        try {
          const response = await fetch('/api/v1/x', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roastMessage: tweetText }), 
          });
  
          const data = await response.json();
  
          if (data.success && data.tweetUrl) {
            return { output: [`Tweet posted successfully! Check it out here: ${makeUrlClickable(data.tweetUrl)}`] };
          } else {
            return { output: ['Failed to post the tweet. Please try again.'] };
          }
        } catch (error) {
          console.error('Error posting tweet:', error);
          return { output: ['Error occurred while posting the tweet.'] };
        }
  
      case 'help':
      // Return the list of available commands
      return {
        output: [
          'Available commands:',
          'help - Show this list of commands',
          'clean - cleans the terminal',
          'ca - The CA from pump',
          'pump - The link to official pump.fun',
          'twitter - Elon Musk his twitter',
          'website - The website you are on',
          'dex - Dexscreener.com',
          'roast @<twitterusername> - Roast a Twitter profile',
          'share @<twitterusername> - Share the roast on Twitter',
          'insult - Let me insult you',
          'fact - The facts of Peter Griffin',
          'wisdom - Get a random piece of Peter Griffin wisdom',
          'fart - Ah yes........... sound on',
          'mooning - Cant touch this........... sound on',
        ]
      };

    case 'ca':
      return { output: ['DdrdT2BKsh3xgXYGvKkVs4ahqG99dQJsMgXfadCQpump'] };
    
    case 'pump':
      // Make the URL clickable using makeUrlClickable
      return { output: [makeUrlClickable('https://pump.fun/DdrdT2BKsh3xgXYGvKkVs4ahqG99dQJsMgXfadCQpump')] };
    
    case 'dex':
      return { output: ['Coming soon'] };

    case 'twitter':
      // Make the URL clickable using makeUrlClickable
      return { output: [makeUrlClickable('https://x.com/elonmusk')] };

    case 'website':
      // Make the URL clickable using makeUrlClickable
      return { output: [makeUrlClickable('https://www.heehhehe.online')] };

    case 'insult':
      // Return a random insult
      return { output: [getRandomItem(insults)] };

    case 'fact':
      // Return a random fact
      return { output: [getRandomItem(facts)] };

    case 'wisdom':
      // Return a random piece of wisdom
      return { output: [getRandomItem(wisdom)] };
    
    case 'fart':
      return { output: ['💨 Peter Griffin is farting... sound on'] };

    case 'mooning':
      return { output: ['💨 Cant touch this... sound on'] };

    default:
      return { output: [`Command not found: ${command}`] };
  }
}
