# Database Documentation

## Overview

The database is hosted on Supabase (PostgreSQL). It covers user authentication, project management, task tracking, and team collaboration. Auth is handled natively by Supabase — the `profiles` table extends it with extra user info.

---

## Tables

### `profiles`
Extends Supabase's built-in `auth.users`. Automatically created when a user signs up via a trigger.

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | References `auth.users(id)`. Same ID as the auth user. |
| `name` | text | Display name of the user. |
| `avatar_url` | text | URL to the user's avatar image. |
| `created_at` | timestamptz | When the profile was created. |

---

### `projects`
A project is the top-level container. It has lists, items, labels and members.

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated unique ID. |
| `name` | text | Name of the project. Required. |
| `description` | text | Optional description. |
| `created_by` | uuid (FK → profiles) | The user who created the project. |
| `created_at` | timestamptz | When the project was created. |

> When a project is created, a trigger automatically adds `created_by` as a member in `project_members`.

---

### `project_members`
Junction table — links users to projects. Every user who has access to a project has a row here.

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated unique ID. |
| `project_id` | uuid (FK → projects) | The project. |
| `user_id` | uuid (FK → profiles) | The member. |
| `joined_at` | timestamptz | When the user joined the project. |

> Unique constraint on `(project_id, user_id)` — a user can only be a member once.

---

### `lists`
A list is a column on the board (e.g. "To Do", "In Progress", "Done"). Each list belongs to a project.

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated unique ID. |
| `project_id` | uuid (FK → projects) | The project this list belongs to. |
| `name` | text | Display name of the list. Required. |
| `color` | text | Hex color for the list header (default `#6366f1`). |
| `position` | integer | Order of the list on the board (left to right). |
| `status` | text | Optional status label tied to this list (e.g. `todo`, `done`). Used for workflow automation. |
| `created_at` | timestamptz | When the list was created. |

---

### `labels`
Labels are tags that can be attached to items. They are scoped per project.

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated unique ID. |
| `project_id` | uuid (FK → projects) | The project this label belongs to. |
| `name` | text | Label text (e.g. `bug`, `urgent`, `frontend`). Required. |
| `color` | text | Hex color for the label badge (default `#6366f1`). |

---

### `items`
Items are the cards on the board. They belong to a project and optionally to a list.

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated unique ID. |
| `project_id` | uuid (FK → projects) | The project this item belongs to. Not null. |
| `list_id` | uuid (FK → lists, nullable) | The list this item is in. Null if not placed in any list. Enforced via composite FK `(project_id, list_id)` — guarantees the list belongs to the same project. |
| `title` | text | Title of the item. Required. |
| `description` | text | Optional rich description. |
| `item_type` | text | Type of item: `task`, `bug`, `feature`, `note`, etc. Default `task`. User-defined. |
| `status` | text | Current status: `todo`, `in_progress`, `done`, etc. Default `todo`. |
| `due_date` | date | Optional deadline. |
| `position` | integer | Vertical order within its list. |
| `created_by` | uuid (FK → profiles) | The user who created the item. |
| `created_at` | timestamptz | When the item was created. |

---

### `item_assignees`
Junction table — links users to items they are assigned to.

| Column | Type | Description |
|---|---|---|
| `item_id` | uuid (PK, FK → items) | The item. |
| `user_id` | uuid (PK, FK → profiles) | The assigned user. |

> Composite primary key on `(item_id, user_id)`.

---

### `item_labels`
Junction table — links labels to items.

| Column | Type | Description |
|---|---|---|
| `item_id` | uuid (PK, FK → items) | The item. |
| `label_id` | uuid (PK, FK → labels) | The label. |

> Composite primary key on `(item_id, label_id)`.

---

## Relationships Summary

```
auth.users
    └── profiles (1:1)
            └── projects (created_by)
            └── project_members (many users ↔ many projects)
            └── items (created_by)
            └── item_assignees (many users ↔ many items)

projects
    ├── lists (1:many)
    ├── labels (1:many)
    ├── items (1:many)
    └── project_members (1:many)

lists
    └── items (1:many)

items
    ├── item_assignees (1:many)
    └── item_labels (1:many)

labels
    └── item_labels (1:many)
```

---

## Triggers

### `on_auth_user_created`
Fires after a new user signs up. Automatically inserts a row in `profiles` using the user's metadata.

### `on_project_created`
Fires after a new project is inserted. Automatically adds the creator as a member in `project_members`.

---

## Row Level Security (RLS)

All tables have RLS enabled. The rules ensure:

- Users can only read/write data in projects they are members of.
- Profiles are readable by everyone (needed for assignee display), but only editable by their owner.
- Items, lists, and labels are only accessible to project members.

---

## Full Setup Script

Run the following in order in Supabase SQL Editor to recreate the entire database from scratch.

```sql
-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 2. PROJECTS
-- ============================================================
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 3. PROJECT MEMBERS
-- ============================================================
create table project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(project_id, user_id)
);

-- ============================================================
-- 4. LISTS
-- ============================================================
create table lists (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  position integer default 0,
  status text,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 5. LABELS
-- ============================================================
create table labels (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text default '#6366f1'
);

-- ============================================================
-- 6. ITEMS
-- ============================================================
create table items (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  list_id uuid references lists(id) on delete set null,
  title text not null,
  description text,
  item_type text default 'task',
  status text default 'todo',
  due_date date,
  position integer default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Composite unique on lists to support the cross-project FK check on items
alter table lists add constraint lists_project_id_id_unique unique (project_id, id);

-- Ensures an item's list always belongs to the same project as the item
alter table items add constraint items_project_list_fk
  foreign key (project_id, list_id) references lists(project_id, id);

-- ============================================================
-- 7. ITEM ASSIGNEES
-- ============================================================
create table item_assignees (
  item_id uuid not null references items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (item_id, user_id)
);

-- ============================================================
-- 8. ITEM LABELS
-- ============================================================
create table item_labels (
  item_id uuid not null references items(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  primary key (item_id, label_id)
);

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table lists enable row level security;
alter table labels enable row level security;
alter table items enable row level security;
alter table item_assignees enable row level security;
alter table item_labels enable row level security;

-- Helper function to check project membership without RLS recursion
create or replace function is_project_member(p_project_id uuid)
returns boolean
security definer
set search_path = public
language sql stable
as $$
  select exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = auth.uid()
  );
$$;

-- Profiles
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete" on profiles for delete using (auth.uid() = id);

-- Projects
create policy "projects_read" on projects for select using (is_project_member(id));
create policy "projects_insert" on projects for insert with check (auth.uid() = created_by);
create policy "projects_update" on projects for update using (is_project_member(id)) with check (is_project_member(id));
create policy "projects_delete" on projects for delete using (is_project_member(id));

-- Project members
create policy "members_read" on project_members for select using (is_project_member(project_id));
create policy "members_insert" on project_members for insert with check (is_project_member(project_id));

-- Lists
create policy "lists_all" on lists for all
  using (is_project_member(project_id))
  with check (is_project_member(project_id));

-- Labels
create policy "labels_all" on labels for all
  using (is_project_member(project_id))
  with check (is_project_member(project_id));

-- Items
create policy "items_all" on items for all
  using (is_project_member(project_id))
  with check (is_project_member(project_id));

-- Item assignees (assignee must be a member of the item's project)
create policy "item_assignees_all" on item_assignees for all using (
  exists (
    select 1 from items
    where items.id = item_assignees.item_id and is_project_member(items.project_id)
  )
) with check (
  exists (
    select 1 from items
    join project_members pm on pm.project_id = items.project_id
    where items.id = item_assignees.item_id
      and is_project_member(items.project_id)
      and pm.user_id = item_assignees.user_id
  )
);

-- Item labels (label must belong to the same project as the item)
create policy "item_labels_all" on item_labels for all using (
  exists (
    select 1 from items
    where items.id = item_labels.item_id and is_project_member(items.project_id)
  )
) with check (
  exists (
    select 1 from items
    join labels on labels.id = item_labels.label_id
    where items.id = item_labels.item_id
      and is_project_member(items.project_id)
      and labels.project_id = items.project_id
  )
);

-- ============================================================
-- 10. TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public, auth
language plpgsql
as $$
begin
  insert into profiles (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', null);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-add creator as project member
create or replace function handle_new_project()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into project_members (project_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$;

create trigger on_project_created
  after insert on projects
  for each row execute function handle_new_project();
```