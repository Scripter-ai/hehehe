/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // For strict checks
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY, // Makes sure your environment variables are passed correctly
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CX: process.env.GOOGLE_CX,
  },
  // Optionally, to enhance security headers or customize static file serving, you can extend config here.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
