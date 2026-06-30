-- Enable Realtime for orders and schools
BEGIN;
  -- Remove them first if they exist in the publication to prevent duplicate errors
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.orders;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.schools;

  -- Add tables to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.schools;
COMMIT;
