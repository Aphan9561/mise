create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  title text not null,
  description text,
  cuisine text,
  prep_minutes integer,
  ingredients text[] not null default '{}',
  instructions text[] not null default '{}',
  image_url text,
  source text not null default 'personal',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipes
add column if not exists source_url text;

alter table public.recipes
add column if not exists image_url text;

create index if not exists recipes_clerk_user_id_idx
on public.recipes (clerk_user_id);

drop trigger if exists set_recipes_updated_at on public.recipes;

create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();
