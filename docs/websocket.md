# TeamFlow AI — Real-Time WebSocket Protocol

## Connection Endpoint
```text
WS /ws/workspace/{workspace_id}?user_id={user_id}
```

## Connection Management
The backend `ConnectionManager` registers each WebSocket per workspace room. When any member triggers a state change (moves a task, adds a comment, or posts a chat message), the server broadcasts a JSON payload to all connected clients in that workspace.

## Event Payloads

### 1. `TASK_MOVED`
Broadcast whenever a card is transitioned between TODO, IN PROGRESS, IN REVIEW, or DONE.
```json
{
  "type": "TASK_MOVED",
  "data": {
    "id": "task-uuid",
    "project_id": "proj-uuid",
    "status": "DONE",
    "title": "API Authentication with JWT"
  }
}
```

### 2. `TASK_CREATED` / `TASK_UPDATED` / `TASK_DELETED`
Triggers immediate optimistic cache update on all active team members' screens without needing manual browser refresh.

### 3. `NEW_CHAT_MESSAGE`
Instant multi-user chat delivery with sender details and timestamp.
```json
{
  "type": "NEW_CHAT_MESSAGE",
  "data": {
    "id": "msg-uuid",
    "workspace_id": "ws-uuid",
    "content": "Backend authentication PR is ready for review.",
    "user": {
      "full_name": "Ruthi (Lead)",
      "avatar_url": "..."
    }
  }
}
```
