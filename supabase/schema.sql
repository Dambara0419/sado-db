create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null default 'user',
  created_at timestamptz default now()
);

create table items (
  id serial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  author text,
  kiln text,
  category text,
  description text,
  is_public boolean not null default true,
  created_at timestamptz default now()
);

create table item_images (
  id serial primary key,
  item_id integer not null references items(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table items enable row level security;
alter table item_images enable row level security;

create policy "Profiles viewable by all" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Public items or own items or admin" on items for select
  using (is_public = true or auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can insert own items" on items for insert with check (auth.uid() = user_id);
create policy "Users can update own items or admin" on items for update
  using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can delete own items or admin" on items for delete
  using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Images viewable by all" on item_images for select using (true);
create policy "Users can insert images of own items" on item_images for insert
  with check (exists (select 1 from items where id = item_id and user_id = auth.uid()));
create policy "Users can delete images of own items or admin" on item_images for delete
  using (exists (
    select 1 from items i where i.id = item_id and (
      i.user_id = auth.uid() or
      exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  ));
