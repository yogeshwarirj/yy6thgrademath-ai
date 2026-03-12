ALTER TABLE public.user_usage ADD COLUMN input_tokens integer NOT NULL DEFAULT 0;
ALTER TABLE public.user_usage ADD COLUMN output_tokens integer NOT NULL DEFAULT 0;