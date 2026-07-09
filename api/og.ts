import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

function titleFontSize(title: string): number {
  const len = title.length;
  if (len > 72) return 40;
  if (len > 48) return 48;
  if (len > 32) return 56;
  return 64;
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get('title') || 'Brian Bureson · AI product design & trust UX').trim();
  const fontSize = titleFontSize(title);

  try {
    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
          },
          children: {
            type: 'div',
            props: {
              style: {
                fontSize,
                lineHeight: 1.15,
                color: 'white',
                fontWeight: 800,
                fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
                padding: '40px 60px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 24,
                textAlign: 'center',
                maxWidth: '1040px',
              },
              children: title,
            },
          },
        },
      },
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error('OG image generation failed:', error);
    return new Response('OG image generation failed', { status: 500 });
  }
}
