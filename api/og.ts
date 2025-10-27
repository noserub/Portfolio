import React from 'react';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { ImageResponse } = await import('@vercel/og'); // dynamic ESM import

  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Brian Bureson – Portfolio';

  const element = React.createElement(
    'div',
    {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
      },
    },
    React.createElement(
      'div',
      {
        style: {
          fontSize: 64,
          color: 'white',
          fontWeight: 800,
          fontFamily:
            'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
          padding: '40px 60px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 24,
        },
      },
      title
    )
  );

  return new ImageResponse(element, { width: 1200, height: 630 });
}


