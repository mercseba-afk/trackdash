-- P0.6B candidate. Apply only after approval. No DML grants or RLS changes.
GRANT SELECT (id, slug) ON public.categories TO service_role;
GRANT SELECT (id, name, metadata, category_id) ON public.products TO service_role;
