# TeamFlow AI — Database Schema

## Entity Relationship Overview
The database models workspaces, users, projects, tasks, comments, messages, meetings, documents, and notifications.

```text
users ───────────< workspace_members >─────────── workspaces
  │                                                    │
  ├──────< tasks >─────── projects <───────────────────┘
  │         │                 │
  │         ├─< comments      ├─< meetings
  │                           ├─< documents
  └──────< messages           └─< messages
```

## Tables
1. **users**: `id`, `email`, `full_name`, `password_hash`, `avatar_url`, `created_at`
2. **workspaces**: `id`, `name`, `slug`, `owner_id`, `created_at`
3. **workspace_members**: `id`, `workspace_id`, `user_id`, `role`, `joined_at`
4. **projects**: `id`, `workspace_id`, `name`, `description`, `deadline`, `created_at`
5. **tasks**: `id`, `project_id`, `assignee_id`, `title`, `description`, `status`, `priority`, `deadline`, `estimated_hours`, `actual_hours`, `labels`, `position`, `created_at`, `updated_at`
6. **comments**: `id`, `task_id`, `user_id`, `content`, `created_at`
7. **messages**: `id`, `workspace_id`, `project_id`, `user_id`, `content`, `is_ai`, `created_at`
8. **meetings**: `id`, `project_id`, `title`, `transcript`, `summary`, `action_items`, `decisions`, `created_at`
9. **documents**: `id`, `project_id`, `title`, `content`, `filename`, `storage_url`, `created_at`
10. **notifications**: `id`, `user_id`, `type`, `title`, `content`, `read`, `link_url`, `created_at`
