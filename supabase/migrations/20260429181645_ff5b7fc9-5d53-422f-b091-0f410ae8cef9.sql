
-- App configs table: each user owns multiple JSON-defined apps
CREATE TABLE public.app_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select app_configs" ON public.app_configs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner insert app_configs" ON public.app_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update app_configs" ON public.app_configs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner delete app_configs" ON public.app_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Generic entries table: stores rows for ANY entity defined in any config
CREATE TABLE public.entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_id UUID NOT NULL REFERENCES public.app_configs(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX entries_app_entity_idx ON public.entries (app_id, entity);
CREATE INDEX entries_user_idx ON public.entries (user_id);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select entries" ON public.entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner insert entries" ON public.entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update entries" ON public.entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner delete entries" ON public.entries
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER app_configs_set_updated BEFORE UPDATE ON public.app_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER entries_set_updated BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
