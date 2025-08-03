import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  status: text("status").notNull().default("online"),
  weatherData: json("weather_data").$type<WeatherData>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  telescopes: many(telescopes),
}));

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

// Telescopes
export const telescopes = pgTable("telescopes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  locationId: integer("location_id").notNull(),
  status: text("status").notNull().default("offline"),
  targetObject: text("target_object"),
  rightAscension: text("right_ascension"),
  declination: text("declination"),
  specifications: json("specifications").$type<TelescopeSpecifications>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTelescopeSchema = createInsertSchema(telescopes).omit({
  id: true,
  createdAt: true,
});

// Observation plans
export const observationPlans = pgTable("observation_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  telescopeId: integer("telescope_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("draft"),
  scheduledDate: timestamp("scheduled_date"),
  targets: json("targets").$type<ObservationTarget[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertObservationPlanSchema = createInsertSchema(observationPlans).omit({
  id: true,
  createdAt: true,
});

// Logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  telescopeId: integer("telescope_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  data: json("data").$type<Record<string, any>>(),
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
});

// SupernovaTargets
export const supernovaTargets = pgTable("supernova_targets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  magnitude: text("magnitude").notNull(),
  distance: text("distance").notNull(),
  lastChecked: timestamp("last_checked"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupernovaTargetSchema = createInsertSchema(supernovaTargets).omit({
  id: true,
  createdAt: true,
});

// SupernovaDiscoveries
export const supernovaDiscoveries = pgTable("supernova_discoveries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  targetId: integer("target_id").notNull(),
  magnitude: text("magnitude").notNull(),
  discoveryDate: timestamp("discovery_date").defaultNow().notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupernovaDiscoverySchema = createInsertSchema(supernovaDiscoveries).omit({
  id: true,
  createdAt: true,
});

// Types for JSON columns
export type WeatherData = {
  condition: string;
  temperature: number;
  humidity: number;
  visibility: string;
  seeing: number;
  icon: string;
};

export type ObservationTarget = {
  name: string;
  rightAscension: string;
  declination: string;
  exposureTime?: number;
  filters?: string[];
};

export type TelescopeSpecifications = {
  aperture: string;
  focalLength: string;
  focalRatio: string;
  mountType: string;
  tracking: string;
  opticalDesign: string;
};

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Telescope = typeof telescopes.$inferSelect;
export type InsertTelescope = z.infer<typeof insertTelescopeSchema>;

export type ObservationPlan = typeof observationPlans.$inferSelect;
export type InsertObservationPlan = z.infer<typeof insertObservationPlanSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type SupernovaTarget = typeof supernovaTargets.$inferSelect;
export type InsertSupernovaTarget = z.infer<typeof insertSupernovaTargetSchema>;

export type SupernovaDiscovery = typeof supernovaDiscoveries.$inferSelect;
export type InsertSupernovaDiscovery = z.infer<typeof insertSupernovaDiscoverySchema>;
