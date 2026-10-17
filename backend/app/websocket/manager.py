from typing import Dict, List, Any
import json
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # workspace_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # websocket -> metadata {user_id, workspace_id}
        self.connection_meta: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, workspace_id: str, user_id: str = "anonymous"):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)
        self.connection_meta[websocket] = {"workspace_id": workspace_id, "user_id": user_id}

    def disconnect(self, websocket: WebSocket):
        meta = self.connection_meta.get(websocket)
        if meta:
            workspace_id = meta.get("workspace_id")
            if workspace_id in self.active_connections and websocket in self.active_connections[workspace_id]:
                self.active_connections[workspace_id].remove(websocket)
                if len(self.active_connections[workspace_id]) == 0:
                    del self.active_connections[workspace_id]
            del self.connection_meta[websocket]

    async def broadcast_to_workspace(self, workspace_id: str, event_type: str, data: Any):
        """Broadcast real-time events to all connected clients in a workspace"""
        if workspace_id not in self.active_connections:
            return

        payload = {
            "type": event_type,
            "data": data
        }
        dead_connections = []
        for connection in self.active_connections[workspace_id]:
            try:
                await connection.send_text(json.dumps(payload, default=str))
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()
