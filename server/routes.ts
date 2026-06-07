import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { 
  insertLocationSchema, 
  insertTelescopeSchema,
  insertObservationPlanSchema,
  insertLogSchema,
  insertSupernovaTargetSchema,
  insertSupernovaDiscoverySchema,
  insertUserSchema
} from "@shared/schema";

export interface TelescopeCommand {
  type: string;
  telescope: number;
  params?: any;
}

export interface TelescopeResponse {
  type: string;
  success: boolean;
  message?: string;
  data?: any;
}

// Keep track of connected clients
const telescopeConnections = new Map<number, Set<WebSocket>>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Set up WebSocket server for telescope communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as TelescopeCommand;
        
        if (data.type === 'connect') {
          // Register this connection with a telescope
          const telescopeId = data.telescope;
          if (!telescopeConnections.has(telescopeId)) {
            telescopeConnections.set(telescopeId, new Set());
          }
          telescopeConnections.get(telescopeId)?.add(ws);
          
          // Send confirmation
          const response: TelescopeResponse = {
            type: 'connect',
            success: true,
            message: 'Connected to telescope',
            data: { telescopeId }
          };
          ws.send(JSON.stringify(response));
          
          // Log the connection
          await storage.createLog({
            telescopeId: telescopeId,
            level: 'info',
            message: 'Client connected to telescope',
            timestamp: new Date(),
            data: {}
          });
        } else if (data.type === 'move') {
          // Handle telescope movement command
          const telescope = await storage.getTelescope(data.telescope);
          if (!telescope) {
            ws.send(JSON.stringify({
              type: 'move',
              success: false,
              message: 'Telescope not found'
            }));
            return;
          }
          
          // Log the command
          await storage.createLog({
            telescopeId: data.telescope,
            level: 'info',
            message: `Movement command: ${data.params.direction}`,
            timestamp: new Date(),
            data: data.params
          });
          
          // In a real system, we would send command to the actual telescope
          // For now, we'll just simulate success and broadcast to all connected clients
          const response: TelescopeResponse = {
            type: 'move',
            success: true,
            message: `Moved telescope ${data.params.direction}`,
            data: data.params
          };
          
          // Broadcast to all clients connected to this telescope
          telescopeConnections.get(data.telescope)?.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(response));
            }
          });
        } else if (data.type === 'goto') {
          // Handle goto command
          const { telescope, params } = data;
          
          // Log the command
          await storage.createLog({
            telescopeId: telescope,
            level: 'info',
            message: `Goto command: ${params.target || `${params.ra} ${params.dec}`}`,
            timestamp: new Date(),
            data: params
          });
          
          // Update telescope target information
          await storage.updateTelescope(telescope, {
            targetObject: params.target || 'Custom coordinates',
            rightAscension: params.ra,
            declination: params.dec
          });
          
          // Broadcast the command to all connected clients
          const response: TelescopeResponse = {
            type: 'goto',
            success: true,
            message: `Slewing to ${params.target || 'coordinates'}`,
            data: {
              target: params.target,
              ra: params.ra,
              dec: params.dec
            }
          };
          
          telescopeConnections.get(telescope)?.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(response));
            }
          });
        }
      } catch (err) {
        console.error('WebSocket error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          success: false,
          message: 'Invalid command format'
        }));
      }
    });

    ws.on('close', () => {
      // Remove this connection from all telescope connections
      for (const [telescopeId, clients] of telescopeConnections.entries()) {
        if (clients.has(ws)) {
          clients.delete(ws);
          
          // If no more clients for this telescope, remove the entry
          if (clients.size === 0) {
            telescopeConnections.delete(telescopeId);
          }
        }
      }
    });
  });

  registerApiRoutes(app);

  return httpServer;
}

// REST API routes — shared by the persistent server above (local/Render) and
// the Vercel serverless function in api/index.ts. No WebSocket/http.Server here.
export function registerApiRoutes(app: Express): void {
  // API Routes
  app.get('/api/locations', async (req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch locations' });
    }
  });

  app.get('/api/locations/:id', async (req: Request, res: Response) => {
    try {
      const location = await storage.getLocation(parseInt(req.params.id));
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch location' });
    }
  });

  app.post('/api/locations', async (req: Request, res: Response) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: 'Invalid location data' });
    }
  });

  app.patch('/api/locations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedLocation = await storage.updateLocation(id, req.body);
      if (!updatedLocation) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(updatedLocation);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  app.delete('/api/locations/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteLocation(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete location' });
    }
  });

  // Telescope routes
  app.get('/api/telescopes', async (req: Request, res: Response) => {
    try {
      const locationId = req.query.locationId;
      let telescopes;
      
      if (locationId) {
        telescopes = await storage.getTelescopesByLocation(parseInt(locationId.toString()));
      } else {
        telescopes = await storage.getTelescopes();
      }
      
      res.json(telescopes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch telescopes' });
    }
  });

  app.get('/api/telescopes/:id', async (req: Request, res: Response) => {
    try {
      const telescope = await storage.getTelescope(parseInt(req.params.id));
      if (!telescope) {
        return res.status(404).json({ message: 'Telescope not found' });
      }
      res.json(telescope);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch telescope' });
    }
  });

  app.post('/api/telescopes', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTelescopeSchema.parse(req.body);
      const telescope = await storage.createTelescope(validatedData);
      res.status(201).json(telescope);
    } catch (error) {
      res.status(400).json({ message: 'Invalid telescope data' });
    }
  });

  app.patch('/api/telescopes/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedTelescope = await storage.updateTelescope(id, req.body);
      if (!updatedTelescope) {
        return res.status(404).json({ message: 'Telescope not found' });
      }
      res.json(updatedTelescope);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  app.delete('/api/telescopes/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTelescope(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'Telescope not found' });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete telescope' });
    }
  });

  // Observation Plan routes
  app.get('/api/observation-plans', async (req: Request, res: Response) => {
    try {
      const telescopeId = req.query.telescopeId;
      const userId = req.query.userId;
      
      let plans;
      if (telescopeId) {
        plans = await storage.getObservationPlansByTelescope(parseInt(telescopeId.toString()));
      } else if (userId) {
        plans = await storage.getObservationPlansByUser(parseInt(userId.toString()));
      } else {
        plans = await storage.getObservationPlans();
      }
      
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch observation plans' });
    }
  });

  app.get('/api/observation-plans/:id', async (req: Request, res: Response) => {
    try {
      const plan = await storage.getObservationPlan(parseInt(req.params.id));
      if (!plan) {
        return res.status(404).json({ message: 'Observation plan not found' });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch observation plan' });
    }
  });

  app.post('/api/observation-plans', async (req: Request, res: Response) => {
    try {
      const validatedData = insertObservationPlanSchema.parse(req.body);
      const plan = await storage.createObservationPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: 'Invalid observation plan data' });
    }
  });

  app.patch('/api/observation-plans/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedPlan = await storage.updateObservationPlan(id, req.body);
      if (!updatedPlan) {
        return res.status(404).json({ message: 'Observation plan not found' });
      }
      res.json(updatedPlan);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  app.delete('/api/observation-plans/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteObservationPlan(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'Observation plan not found' });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete observation plan' });
    }
  });

  // Log routes
  app.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const telescopeId = req.query.telescopeId;
      
      let logs;
      if (telescopeId) {
        logs = await storage.getLogsByTelescope(parseInt(telescopeId.toString()));
      } else {
        logs = await storage.getLogs();
      }
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch logs' });
    }
  });

  app.post('/api/logs', async (req: Request, res: Response) => {
    try {
      const validatedData = insertLogSchema.parse(req.body);
      const log = await storage.createLog(validatedData);
      res.status(201).json(log);
      
      // Broadcast the log to all connected clients for this telescope
      const logMessage: TelescopeResponse = {
        type: 'log',
        success: true,
        data: log
      };
      
      telescopeConnections.get(log.telescopeId)?.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(logMessage));
        }
      });
      
    } catch (error) {
      res.status(400).json({ message: 'Invalid log data' });
    }
  });

  app.delete('/api/logs/:telescopeId/clear', async (req: Request, res: Response) => {
    try {
      const telescopeId = parseInt(req.params.telescopeId);
      const success = await storage.clearLogsByTelescope(telescopeId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: 'Failed to clear logs' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear logs' });
    }
  });

  // Supernova Target routes
  app.get('/api/supernova-targets', async (req: Request, res: Response) => {
    try {
      const targets = await storage.getSupernovaTargets();
      res.json(targets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch supernova targets' });
    }
  });

  app.get('/api/supernova-targets/:id', async (req: Request, res: Response) => {
    try {
      const target = await storage.getSupernovaTarget(parseInt(req.params.id));
      if (!target) {
        return res.status(404).json({ message: 'Supernova target not found' });
      }
      res.json(target);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch supernova target' });
    }
  });

  app.post('/api/supernova-targets', async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupernovaTargetSchema.parse(req.body);
      const target = await storage.createSupernovaTarget(validatedData);
      res.status(201).json(target);
    } catch (error) {
      res.status(400).json({ message: 'Invalid supernova target data' });
    }
  });

  app.patch('/api/supernova-targets/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedTarget = await storage.updateSupernovaTarget(id, req.body);
      if (!updatedTarget) {
        return res.status(404).json({ message: 'Supernova target not found' });
      }
      res.json(updatedTarget);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  // Supernova Discovery routes
  app.get('/api/supernova-discoveries', async (req: Request, res: Response) => {
    try {
      const discoveries = await storage.getSupernovaDiscoveries();
      res.json(discoveries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch supernova discoveries' });
    }
  });

  app.post('/api/supernova-discoveries', async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupernovaDiscoverySchema.parse(req.body);
      const discovery = await storage.createSupernovaDiscovery(validatedData);
      res.status(201).json(discovery);
    } catch (error) {
      res.status(400).json({ message: 'Invalid supernova discovery data' });
    }
  });

  // User routes
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedUser = await storage.updateUser(id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteUser(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Simple auth endpoint - in a real app use proper JWT authentication
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      res.status(500).json({ message: 'Authentication failed' });
    }
  });
}
