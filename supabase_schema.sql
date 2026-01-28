-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  display_name text,
  email text,
  bio text,
  avatar_url text,
  avatar_style text,
  avatar_id text,
  avatar_background text[],
  avatar_background_type text,
  preferences jsonb default '{"darkMode": false, "publicProfile": false}'::jsonb,
  plan jsonb default '{"tier": "Free Tier", "level": 1, "isPro": false}'::jsonb,

  constraint display_name_length check (char_length(display_name) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table public.profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create a table for badminton analyses
create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  player_description text,
  video_url text,
  thumbnail_url text,
  analysis jsonb, -- Stores the full analysis results
  metadata jsonb  -- Stores any additional metadata (model used, etc.)
);

alter table public.analyses
  enable row level security;

create policy "Users can view their own analyses." on public.analyses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own analyses." on public.analyses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own analyses." on public.analyses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own analyses." on public.analyses
  for delete using (auth.uid() = user_id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email, avatar_style, avatar_id)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'adventurer', 'seed');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
