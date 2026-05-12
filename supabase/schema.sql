-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  strava_user_id bigint unique not null,
  username text unique not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at bigint not null,
  created_at timestamptz default now()
);

-- Activities table
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  strava_activity_id bigint unique not null,
  date date not null,
  created_at timestamptz default now()
);

create index if not exists activities_user_date on activities(user_id, date);
