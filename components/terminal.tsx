'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat, Message } from 'ai/react'; 
import { runCommand } from '@/lib/commands'; // Ensure correct path

// Define a type for output messages to track their type
type OutputMessage = {
  content: string;
  type: 'normal' | 'error' | 'roast' | 'loading';
};

// Helper function to store a roast in localStorage
function saveRoastToLocalStorage(twitterHandle: string, roast: string) {
  const storedRoasts = JSON.parse(localStorage.getItem('roasts') || '{}');
  storedRoasts[twitterHandle] = roast;
  localStorage.setItem('roasts', JSON.stringify(storedRoasts));
}

// Helper function to save terminal output to localStorage
const saveOutputToLocalStorage = (output: OutputMessage[]) => {
  localStorage.setItem('terminalOutput', JSON.stringify(output));
};

// Helper function to load terminal output from localStorage
const loadOutputFromLocalStorage = (): OutputMessage[] => {
  if (typeof window !== 'undefined') {
    const savedOutput = localStorage.getItem('terminalOutput');
    return savedOutput ? JSON.parse(savedOutput) : [];
  }
  return [];
};

// Helper function to clear terminal output from localStorage
const clearLocalStorage = () => {
  localStorage.removeItem('terminalOutput');
  localStorage.removeItem('roasts');
};

export default function Terminal() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<OutputMessage[]>(loadOutputFromLocalStorage()); // Load from localStorage
  const [showCursor, setShowCursor] = useState(true);
  const [submittedHandle, setSubmittedHandle] = useState<string | null>(null); // Track when a handle is submitted
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fartAudioRef = useRef<HTMLAudioElement>(null); // Ref for the fart sound

  // Scroll to bottom whenever output changes
  useEffect(() => {
    scrollToBottom();
  }, [output]); // This useEffect triggers scrollToBottom() when output changes

  // Use the useChat hook to handle the chat interaction
  const { setInput, handleSubmit } = useChat({
    api: '/api/search',
    onFinish: (message: Message) => {
      setIsLoading(false); // Stop loading once response is finished
      const roastMessage = message.content;

      // Save roast to localStorage with the Twitter handle
      if (submittedHandle) {
        saveRoastToLocalStorage(submittedHandle, roastMessage);
      }

      const newOutput: OutputMessage[] = [
        ...output,
        { content: `✔️ ${roastMessage}`, type: 'roast' as const }, // Ensure type is 'roast'
      ];
      setOutput(newOutput);
      saveOutputToLocalStorage(newOutput); // Save to localStorage
    },
    onError: (error: Error) => {
      setIsLoading(false); // Stop loading on error
      console.error('Chat error:', error);
      const newOutput: OutputMessage[] = [
        ...output,
        { content: `❌ Error: ${error.message}`, type: 'error' as const }, // Ensure type is 'error'
      ];
      setOutput(newOutput);
      saveOutputToLocalStorage(newOutput); // Save to localStorage
    },
  });

  // Flickering cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Focus on the hidden input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Trigger handleSubmit when a handle is successfully set
  useEffect(() => {
    if (submittedHandle) {
      handleSubmit();
      setSubmittedHandle(null); // Reset after submission to avoid repeated calls
    }
  }, [submittedHandle, handleSubmit]);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const commandString = command.trim();

      // Display the user's message in the output (normal white command)
      const newOutput: OutputMessage[] = [
        ...output,
        { content: `> ${commandString}`, type: 'normal' as const }, // Ensure type is 'normal'
      ];
      setOutput(newOutput);
      saveOutputToLocalStorage(newOutput); // Save to localStorage

      // Check if the command is 'clean' to clear the terminal and localStorage
      if (commandString === 'clean') {
        clearLocalStorage();
        setOutput([]);
      }
      // Check if the command starts with 'roast'
      else if (commandString.startsWith('roast')) {
        const twitterHandle = commandString.match(/@(\w+)/);
        if (twitterHandle) {
          setInput(twitterHandle[0]);
          setSubmittedHandle(twitterHandle[0]); // Store the submitted handle for use with the roast
          setIsLoading(true);
          const loadingMessage: OutputMessage[] = [
            ...newOutput,
            { content: "Peter Griffin is roasting... He’s not that fast because he’s fat.", type: 'loading' as const }, // Explicitly cast type to 'loading'
          ];
          setOutput(loadingMessage);
          saveOutputToLocalStorage(loadingMessage); // Save to localStorage
        } else {
          const errorOutput: OutputMessage[] = [
            ...newOutput,
            { content: 'No Twitter username provided. Please try again with roast @twitterhandle.', type: 'error' as const }, // Ensure type is 'error'
          ];
          setOutput(errorOutput);
          saveOutputToLocalStorage(errorOutput); // Save to localStorage
        }
      } 
      // Handle 'fart' command
      else if (commandString === 'fart') {
        if (fartAudioRef.current) {
          fartAudioRef.current.play(); // Play the fart sound
        }
        const fartOutput: OutputMessage[] = [
          ...newOutput,
          { content: '💨 Peter Griffin is farting... sound on', type: 'normal' as const },
        ];
        setOutput(fartOutput);
        saveOutputToLocalStorage(fartOutput); // Save to localStorage
      }
      // For any other command, use runCommand
      else {
        const result = await runCommand(commandString);

        const commandOutput: OutputMessage[] = [
          ...newOutput,
          ...result.output.map((line) => ({
            content: line,
            type: 'normal' as const, // Explicitly cast type to 'normal'
          })),
        ];
        setOutput(commandOutput);
        saveOutputToLocalStorage(commandOutput); // Save to localStorage
      }

      setCommand(''); // Clear the command input
    }
  };

  return (
    <div
      className="w-screen h-[100dvh] bg-black text-white font-mono p-4 flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {isLoading && <div className="text-yellow-500">Loading...</div>}
      {/* Terminal Output */}
      <div
        className="flex-grow overflow-y-auto mb-4"
        ref={terminalRef}
      >
        {output.map((line, index) => (
          <div
            key={index}
            className={
              line.type === 'roast'
                ? 'text-green-500' // Green for roast success
                : line.type === 'error'
                ? 'text-red-500' // Red for error/unrecognized command
                : line.type === 'loading'
                ? 'text-yellow-500' // Yellow for loading state
                : 'text-white' // White for normal commands
            }
          >
            {line.content}
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="mb-2 text-gray-400 text-sm">
        hint: &apos;help&apos; - clean (to clean terminal)
      </div>

      {/* Terminal Input Display */}
      <div className="flex items-center">
        <span className="text-white">peter-griffin@linux</span>
        <span className="text-yellow-500"> ~ </span>
        <span className="text-yellow-500">$</span>
        <span className="text-green-500 ml-2 flex-1">
          {command}
          {showCursor ? <span className="flicker">_</span> : ' '}
        </span>

        {/* Hidden input field */}
        <input
          ref={inputRef}
          type="text"
          className="absolute opacity-0 h-0 w-0"
          value={command}
          onChange={(e) => setCommand(e.target.value.toLowerCase())}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* Audio element for the fart sound */}
      <audio ref={fartAudioRef} src="/fart.mp3" />
    </div>
  );
}
