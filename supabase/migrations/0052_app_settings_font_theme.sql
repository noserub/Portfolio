-- Published typography preset for the portfolio (body + display font pairing).
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS font_theme TEXT NOT NULL DEFAULT 'modern-default'
CHECK (
  font_theme IN (
    'modern-default',
    'classic-contrast',
    'editorial',
    'swiss',
    'warm'
  )
);

COMMENT ON COLUMN public.app_settings.font_theme IS
  'Curated typography preset applied site-wide for anonymous visitors and signed-in preview.';
