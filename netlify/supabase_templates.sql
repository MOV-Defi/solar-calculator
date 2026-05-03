create table if not exists public.shared_templates (
  id text primary key,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_shared_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_shared_templates_updated_at on public.shared_templates;
create trigger trg_set_shared_templates_updated_at
before update on public.shared_templates
for each row
execute function public.set_shared_templates_updated_at();

