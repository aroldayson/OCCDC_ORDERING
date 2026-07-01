-- Enable Realtime for orders and schools
DO $$
BEGIN
  -- Safe drop orders if exists in publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE p.pubname = 'supabase_realtime' 
    AND n.nspname = 'public' 
    AND c.relname = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
  END IF;

  -- Safe drop schools if exists in publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE p.pubname = 'supabase_realtime' 
    AND n.nspname = 'public' 
    AND c.relname = 'schools'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.schools;
  END IF;

  -- Safe add orders if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE p.pubname = 'supabase_realtime' 
    AND n.nspname = 'public' 
    AND c.relname = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- Safe add schools if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE p.pubname = 'supabase_realtime' 
    AND n.nspname = 'public' 
    AND c.relname = 'schools'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schools;
  END IF;
END
$$;
