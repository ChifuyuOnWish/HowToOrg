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
| `project_id` | uuid (FK → projects) | The project this item belongs to. |
| `list_id` | uuid (FK → lists, nullable) | The list this item is in. Null if not placed in any list. |
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
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(project_id, user_id)
);

-- ============================================================
-- 4. LISTS
-- ============================================================
create table lists (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
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
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  color text default '#6366f1'
);

-- ============================================================
-- 6. ITEMS
-- ============================================================
create table items (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
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

-- ============================================================
-- 7. ITEM ASSIGNEES
-- ============================================================
create table item_assignees (
  item_id uuid references items(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (item_id, user_id)
);

-- ============================================================
-- 8. ITEM LABELS
-- ============================================================
create table item_labels (
  item_id uuid references items(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
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

-- Profiles
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_write" on profiles for all using (auth.uid() = id);

-- Projects
create policy "projects_read" on projects for select using (
  exists (select 1 from project_members where project_id = id and user_id = auth.uid())
);
create policy "projects_insert" on projects for insert with check (auth.uid() = created_by);
create policy "projects_update" on projects for update using (
  exists (select 1 from project_members where project_id = id and user_id = auth.uid())
);

-- Project members
create policy "members_read" on project_members for select using (
  exists (select 1 from project_members pm where pm.project_id = project_id and pm.user_id = auth.uid())
);
create policy "members_insert" on project_members for insert with check (
  auth.uid() = user_id or
  exists (select 1 from project_members where project_id = project_members.project_id and user_id = auth.uid())
);

-- Lists
create policy "lists_all" on lists for all using (
  exists (select 1 from project_members where project_id = lists.project_id and user_id = auth.uid())
);

-- Labels
create policy "labels_all" on labels for all using (
  exists (select 1 from project_members where project_id = labels.project_id and user_id = auth.uid())
);

-- Items
create policy "items_all" on items for all using (
  exists (select 1 from project_members where project_id = items.project_id and user_id = auth.uid())
);

-- Item assignees
create policy "item_assignees_all" on item_assignees for all using (
  exists (
    select 1 from items
    join project_members on project_members.project_id = items.project_id
    where items.id = item_assignees.item_id and project_members.user_id = auth.uid()
  )
);

-- Item labels
create policy "item_labels_all" on item_labels for all using (
  exists (
    select 1 from items
    join project_members on project_members.project_id = items.project_id
    where items.id = item_labels.item_id and project_members.user_id = auth.uid()
  )
);

-- ============================================================
-- 10. TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', null);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-add creator as project member
create or replace function handle_new_project()
returns trigger as $$
begin
  insert into project_members (project_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_project_created
  after insert on projects
  for each row execute function handle_new_project();
```