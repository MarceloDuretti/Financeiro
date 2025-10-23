import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { getSession } from "./localAuth";
import { getTenantId } from "./tenantUtils";

// WebSocket client with user metadata
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  tenantId?: string;
  isAlive?: boolean;
}

// Map to track connections by tenant
const tenantConnections = new Map<string, Set<AuthenticatedWebSocket>>();

// Setup session parser (same as Express)
const sessionParser = getSession();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    noServer: true,
    path: "/ws",
  });

  // Handle upgrade requests (authenticate via session)
  server.on("upgrade", (request, socket, head) => {
    // Only handle WebSocket requests for /ws path (let Vite HMR handle other paths)
    if (request.url !== "/ws") {
      return; // Let other handlers (Vite) process this
    }

    console.log("[WebSocket] Upgrade request received for /ws");

    // Parse session from cookie
    sessionParser(request as any, {} as any, () => {
      const session = (request as any).session;

      if (!session || !session.passport || !session.passport.user) {
        console.log("[WebSocket] Unauthorized - no session");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Extract userId from session
      const userId = session.passport.user;

      wss.handleUpgrade(request, socket, head, (ws) => {
        (ws as AuthenticatedWebSocket).userId = userId;
        wss.emit("connection", ws, request);
      });
    });
  });

  // Handle WebSocket connections
  wss.on("connection", async (ws: AuthenticatedWebSocket) => {
    const userId = ws.userId;
    
    if (!userId) {
      console.log("[WebSocket] Connection without userId - closing");
      ws.close();
      return;
    }

    try {
      // Get user to extract tenantId
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`[WebSocket] User ${userId} not found - closing`);
        ws.close();
        return;
      }

      // Set tenantId using the same logic as API routes
      const tenantId = getTenantId(user);
      ws.tenantId = tenantId;
      ws.isAlive = true;

      // Add to tenant room
      if (!tenantConnections.has(tenantId)) {
        tenantConnections.set(tenantId, new Set());
      }
      tenantConnections.get(tenantId)!.add(ws);

      console.log(`[WebSocket] Client connected - userId: ${userId}, tenantId: ${tenantId}, total in tenant: ${tenantConnections.get(tenantId)!.size}`);

      // Heartbeat
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Handle messages (optional - for future bidirectional communication)
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`[WebSocket] Message from ${userId}:`, message);
          
          // Echo back for now (can implement custom logic here)
          ws.send(JSON.stringify({ type: "ack", received: message }));
        } catch (error) {
          console.error("[WebSocket] Invalid message format:", error);
        }
      });

      // Handle disconnection
      ws.on("close", () => {
        if (ws.tenantId) {
          const connections = tenantConnections.get(ws.tenantId);
          if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
              tenantConnections.delete(ws.tenantId);
            }
            console.log(`[WebSocket] Client disconnected - userId: ${userId}, tenantId: ${ws.tenantId}, remaining in tenant: ${connections.size}`);
          }
        }
      });

      // Send welcome message
      ws.send(JSON.stringify({ 
        type: "connected", 
        message: "Real-time updates ativados",
        tenantId: ws.tenantId,
      }));

    } catch (error) {
      console.error("[WebSocket] Error setting up connection:", error);
      ws.close();
    }
  });

  // Heartbeat interval - ping clients every 30s
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedWebSocket;
      
      if (client.isAlive === false) {
        console.log(`[WebSocket] Terminating dead connection - tenantId: ${client.tenantId}`);
        return client.terminate();
      }

      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  console.log("[WebSocket] Server initialized");

  return wss;
}

// Broadcast message to all clients in a specific tenant
export function broadcastToTenant(tenantId: string, message: any) {
  const connections = tenantConnections.get(tenantId);
  
  if (!connections || connections.size === 0) {
    console.log(`[WebSocket] No clients to broadcast to for tenant ${tenantId}`);
    return;
  }

  const payload = JSON.stringify(message);
  let sentCount = 0;

  connections.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sentCount++;
    }
  });

  console.log(`[WebSocket] Broadcasted to ${sentCount}/${connections.size} clients in tenant ${tenantId}:`, message.type);
}

// Helper function to broadcast data changes
export function broadcastDataChange(
  tenantId: string, 
  resource: string, 
  action: "created" | "updated" | "deleted",
  data?: any
) {
  broadcastToTenant(tenantId, {
    type: "data:change",
    resource,
    action,
    data,
    timestamp: new Date().toISOString(),
  });
}
