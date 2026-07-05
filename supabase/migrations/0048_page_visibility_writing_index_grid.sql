-- Writing index layout: single column, two-up grid, or editorial (featured first + two-up)
ALTER TABLE public.page_visibility
  ADD COLUMN IF NOT EXISTS writing_index_grid TEXT NOT NULL DEFAULT 'double'
  CHECK (writing_index_grid IN ('single', 'double', 'editorial'));

COMMENT ON COLUMN public.page_visibility.writing_index_grid IS
  'Layout for /writing index: single, double (two-up), or editorial (wide first card + two-up).';
