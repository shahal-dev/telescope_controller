import net from "net";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

// On hosts where IPv6 is advertised via DNS but unroutable, Node's "Happy
// Eyeballs" (autoSelectFamily) stalls on the dead IPv6 address instead of
// falling back to IPv4. With @neondatabase/serverless that surfaces as an
// opaque "fetch failed" / empty-message error and the DB never connects.
// Forcing IPv4-first selection makes the fallback deterministic.
net.setDefaultAutoSelectFamily(false);

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });