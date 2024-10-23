import { CommandResponse } from '@/types';

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
      if (args.length === 0 || !args[0].startsWith('@')) {
        // No Twitter handle provided, ask the user to provide one
        return { output: ['Please provide a Twitter handle to share. Example: share @twitterusername'] };
      }

      const twitterHandle = args[0];
      const storedRoast = getRoastFromLocalStorage(twitterHandle);

      if (!storedRoast) {
        // If no roast was found for the provided handle
        return { output: [`No roast available for ${twitterHandle}. Please roast a Twitter profile first using the roast command.`] };
      }

      const tweetText = `#GRIFFINAI\n\nRoasting ${twitterHandle} with Peter Griffin's AI roast! 🔥\n\n${storedRoast}`;

      // Log the tweetText and URL for debugging
      console.log('Tweet Text:', tweetText);

      // Open Twitter's compose page with the pre-filled tweet text
      const url = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

      console.log('Opening URL:', url); // Log the URL to ensure it's correct
      window.open(url, '_blank');

      return { output: [`Opening Twitter to share roast for ${twitterHandle}...`] };

    case 'help':
      // Return the list of available commands
      return {
        output: [
          'Available commands:',
          'help - Show this list of commands',
          'ca - Command description for ca',
          'twitter - Command description for twitter',
          'website - Command description for website',
          'dex - Command description for dex',
          'roast @<twitterusername> - Roast a Twitter profile',
          'share @<twitterusername> - Share the roast on Twitter'
        ]
      };

    // Placeholder for other commands
    case 'ca':
      return { output: [''] };

    case 'twitter':
      return { output: ['https://x.com/elonmusk'] };

    case 'website':
      return { output: ['https://www.heehhehe.online'] };

    default:
      return { output: [`Command not found: ${command}`] };
  }
}
