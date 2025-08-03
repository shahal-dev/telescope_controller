import { 
  User, InsertUser, users,
  Location, InsertLocation, locations,
  Telescope, InsertTelescope, telescopes,
  ObservationPlan, InsertObservationPlan, observationPlans,
  Log, InsertLog, logs,
  SupernovaTarget, InsertSupernovaTarget, supernovaTargets,
  SupernovaDiscovery, InsertSupernovaDiscovery, supernovaDiscoveries,
  WeatherData,
  ObservationTarget
} from "@shared/schema";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<Location>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  updateLocationWeather(id: number, weatherData: WeatherData): Promise<Location | undefined>;

  // Telescopes
  getTelescopes(): Promise<Telescope[]>;
  getTelescopesByLocation(locationId: number): Promise<Telescope[]>;
  getTelescope(id: number): Promise<Telescope | undefined>;
  createTelescope(telescope: InsertTelescope): Promise<Telescope>;
  updateTelescope(id: number, telescope: Partial<Telescope>): Promise<Telescope | undefined>;
  deleteTelescope(id: number): Promise<boolean>;

  // Observation Plans
  getObservationPlans(): Promise<ObservationPlan[]>;
  getObservationPlansByTelescope(telescopeId: number): Promise<ObservationPlan[]>;
  getObservationPlansByUser(userId: number): Promise<ObservationPlan[]>;
  getObservationPlan(id: number): Promise<ObservationPlan | undefined>;
  createObservationPlan(plan: InsertObservationPlan): Promise<ObservationPlan>;
  updateObservationPlan(id: number, plan: Partial<ObservationPlan>): Promise<ObservationPlan | undefined>;
  deleteObservationPlan(id: number): Promise<boolean>;

  // Logs
  getLogs(): Promise<Log[]>;
  getLogsByTelescope(telescopeId: number): Promise<Log[]>;
  getLog(id: number): Promise<Log | undefined>;
  createLog(log: InsertLog): Promise<Log>;
  deleteLog(id: number): Promise<boolean>;
  clearLogsByTelescope(telescopeId: number): Promise<boolean>;

  // Supernova Targets
  getSupernovaTargets(): Promise<SupernovaTarget[]>;
  getSupernovaTarget(id: number): Promise<SupernovaTarget | undefined>;
  createSupernovaTarget(target: InsertSupernovaTarget): Promise<SupernovaTarget>;
  updateSupernovaTarget(id: number, target: Partial<SupernovaTarget>): Promise<SupernovaTarget | undefined>;
  deleteSupernovaTarget(id: number): Promise<boolean>;

  // Supernova Discoveries
  getSupernovaDiscoveries(): Promise<SupernovaDiscovery[]>;
  getSupernovaDiscovery(id: number): Promise<SupernovaDiscovery | undefined>;
  createSupernovaDiscovery(discovery: InsertSupernovaDiscovery): Promise<SupernovaDiscovery>;
  deleteSupernovaDiscovery(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private _users: Map<number, User>;
  private _locations: Map<number, Location>;
  private _telescopes: Map<number, Telescope>;
  private _observationPlans: Map<number, ObservationPlan>;
  private _logs: Map<number, Log>;
  private _supernovaTargets: Map<number, SupernovaTarget>;
  private _supernovaDiscoveries: Map<number, SupernovaDiscovery>;
  
  private userCurrentId: number;
  private locationCurrentId: number;
  private telescopeCurrentId: number;
  private observationPlanCurrentId: number;
  private logCurrentId: number;
  private supernovaTargetCurrentId: number;
  private supernovaDiscoveryCurrentId: number;

  constructor() {
    this._users = new Map();
    this._locations = new Map();
    this._telescopes = new Map();
    this._observationPlans = new Map();
    this._logs = new Map();
    this._supernovaTargets = new Map();
    this._supernovaDiscoveries = new Map();
    
    this.userCurrentId = 1;
    this.locationCurrentId = 1;
    this.telescopeCurrentId = 1;
    this.observationPlanCurrentId = 1;
    this.logCurrentId = 1;
    this.supernovaTargetCurrentId = 1;
    this.supernovaDiscoveryCurrentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true,
    });

    // Create locations
    const dhakaLocation = this.createLocation({
      name: "Dhaka Observatory",
      latitude: "23.8103",
      longitude: "90.4125",
      status: "online",
      weatherData: {
        condition: "Clear Sky",
        temperature: 25,
        humidity: 45,
        visibility: "Excellent",
        seeing: 8,
        icon: "cloud-moon"
      }
    });

    const chittagongLocation = this.createLocation({
      name: "Chittagong Hill Station",
      latitude: "22.3569",
      longitude: "91.7832",
      status: "online",
      weatherData: {
        condition: "Clear",
        temperature: 22,
        humidity: 40,
        visibility: "Very Good",
        seeing: 7,
        icon: "moon"
      }
    });

    const sylhetLocation = this.createLocation({
      name: "Sylhet Observatory",
      latitude: "24.8949",
      longitude: "91.8687",
      status: "weather-alert",
      weatherData: {
        condition: "Rain",
        temperature: 23,
        humidity: 80,
        visibility: "Poor",
        seeing: 2,
        icon: "cloud-rain"
      }
    });

    // Add telescopes
    this.createTelescope({
      name: "Celestron CPC 800",
      model: "Celestron CPC 800",
      locationId: dhakaLocation.id,
      status: "active",
      targetObject: "M31 Andromeda",
      rightAscension: "00h 42m 44s",
      declination: "+41° 16' 9\""
    });

    this.createTelescope({
      name: "Meade LX200",
      model: "Meade LX200",
      locationId: dhakaLocation.id,
      status: "standby"
    });

    this.createTelescope({
      name: "Takahashi FSQ-106ED",
      model: "Takahashi FSQ-106ED",
      locationId: chittagongLocation.id,
      status: "active"
    });

    this.createTelescope({
      name: "PlaneWave CDK14",
      model: "PlaneWave CDK14",
      locationId: chittagongLocation.id,
      status: "maintenance"
    });

    this.createTelescope({
      name: "Celestron EdgeHD 11\"",
      model: "Celestron EdgeHD 11\"",
      locationId: sylhetLocation.id,
      status: "offline"
    });

    this.createTelescope({
      name: "Sky-Watcher EQ6-R Pro",
      model: "Sky-Watcher EQ6-R Pro",
      locationId: sylhetLocation.id,
      status: "offline"
    });

    // Create observation plans
    this.createObservationPlan({
      name: "Deep Sky Objects",
      description: "Observation of various deep sky objects",
      telescopeId: 1,
      userId: 1,
      status: "completed",
      scheduledDate: new Date("2023-02-15"),
      targets: [
        { name: "M31", rightAscension: "00h 42m 44s", declination: "+41° 16' 9\"" },
        { name: "M42", rightAscension: "05h 35m 17s", declination: "-05° 23' 28\"" },
        { name: "M51", rightAscension: "13h 29m 53s", declination: "+47° 11' 43\"" }
      ]
    });

    this.createObservationPlan({
      name: "Solar System",
      description: "Observation of solar system objects",
      telescopeId: 1,
      userId: 1,
      status: "scheduled",
      scheduledDate: new Date("2023-02-20"),
      targets: [
        { name: "Jupiter", rightAscension: "03h 29m 08s", declination: "+17° 02' 28\"" },
        { name: "Saturn", rightAscension: "21h 08m 28s", declination: "-16° 26' 37\"" },
        { name: "Mars", rightAscension: "05h 13m 28s", declination: "+23° 00' 40\"" }
      ]
    });

    this.createObservationPlan({
      name: "Supernova Hunt",
      description: "Search for supernovas in galaxies",
      telescopeId: 3,
      userId: 1,
      status: "draft",
      scheduledDate: new Date("2023-03-01"),
      targets: [
        { name: "NGC 1365", rightAscension: "03h 33m 36s", declination: "-36° 08' 25\"" },
        { name: "NGC 4725", rightAscension: "12h 50m 27s", declination: "+25° 30' 03\"" }
      ]
    });

    // Create logs
    this.createLog({
      telescopeId: 1,
      timestamp: new Date("2023-02-15T22:45:13"),
      level: "info",
      message: "System initialized",
      data: {}
    });

    this.createLog({
      telescopeId: 1,
      timestamp: new Date("2023-02-15T22:45:20"),
      level: "info",
      message: "Connected to Celestron CPC 800",
      data: {}
    });

    this.createLog({
      telescopeId: 1,
      timestamp: new Date("2023-02-15T22:45:32"),
      level: "info",
      message: "Calibration sequence started",
      data: {}
    });

    // Add supernova targets
    this.createSupernovaTarget({
      name: "NGC 4321 (M100)",
      type: "Spiral",
      magnitude: "9.4",
      distance: "55 Mpc",
      lastChecked: new Date("2023-02-12"),
      description: "Large spiral galaxy"
    });

    this.createSupernovaTarget({
      name: "NGC 5194 (M51)",
      type: "Spiral",
      magnitude: "8.4",
      distance: "31 Mpc",
      lastChecked: new Date("2023-02-15"),
      description: "Whirlpool Galaxy"
    });

    this.createSupernovaTarget({
      name: "NGC 1365",
      type: "Barred Spiral",
      magnitude: "9.5",
      distance: "60 Mpc",
      lastChecked: new Date("2023-01-30"),
      description: "Great Barred Spiral Galaxy"
    });

    // Add supernova discoveries
    this.createSupernovaDiscovery({
      name: "SN 2023abc",
      type: "Type Ia",
      targetId: 1,
      magnitude: "16.2",
      discoveryDate: new Date("2023-02-10"),
      location: "NGC 4321 (Spiral)"
    });

    this.createSupernovaDiscovery({
      name: "SN 2023xyz",
      type: "Type II",
      targetId: 2,
      magnitude: "15.7",
      discoveryDate: new Date("2023-02-03"),
      location: "NGC 3627 (Spiral)"
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this._users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this._users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this._users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this._users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this._users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this._users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this._users.delete(id);
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return Array.from(this._locations.values());
  }

  async getLocation(id: number): Promise<Location | undefined> {
    return this._locations.get(id);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const id = this.locationCurrentId++;
    const newLocation: Location = { ...location, id, createdAt: new Date() };
    this._locations.set(id, newLocation);
    return newLocation;
  }

  async updateLocation(id: number, updates: Partial<Location>): Promise<Location | undefined> {
    const location = this._locations.get(id);
    if (!location) return undefined;

    const updatedLocation = { ...location, ...updates };
    this._locations.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    return this._locations.delete(id);
  }

  async updateLocationWeather(id: number, weatherData: WeatherData): Promise<Location | undefined> {
    const location = this._locations.get(id);
    if (!location) return undefined;

    const updatedLocation = { ...location, weatherData };
    this._locations.set(id, updatedLocation);
    return updatedLocation;
  }

  // Telescopes
  async getTelescopes(): Promise<Telescope[]> {
    return Array.from(this._telescopes.values());
  }

  async getTelescopesByLocation(locationId: number): Promise<Telescope[]> {
    return Array.from(this._telescopes.values()).filter(
      (telescope) => telescope.locationId === locationId
    );
  }

  async getTelescope(id: number): Promise<Telescope | undefined> {
    return this._telescopes.get(id);
  }

  async createTelescope(telescope: InsertTelescope): Promise<Telescope> {
    const id = this.telescopeCurrentId++;
    const newTelescope: Telescope = { ...telescope, id, createdAt: new Date() };
    this._telescopes.set(id, newTelescope);
    return newTelescope;
  }

  async updateTelescope(id: number, updates: Partial<Telescope>): Promise<Telescope | undefined> {
    const telescope = this._telescopes.get(id);
    if (!telescope) return undefined;

    const updatedTelescope = { ...telescope, ...updates };
    this._telescopes.set(id, updatedTelescope);
    return updatedTelescope;
  }

  async deleteTelescope(id: number): Promise<boolean> {
    return this._telescopes.delete(id);
  }

  // Observation Plans
  async getObservationPlans(): Promise<ObservationPlan[]> {
    return Array.from(this._observationPlans.values());
  }

  async getObservationPlansByTelescope(telescopeId: number): Promise<ObservationPlan[]> {
    return Array.from(this._observationPlans.values()).filter(
      (plan) => plan.telescopeId === telescopeId
    );
  }

  async getObservationPlansByUser(userId: number): Promise<ObservationPlan[]> {
    return Array.from(this._observationPlans.values()).filter(
      (plan) => plan.userId === userId
    );
  }

  async getObservationPlan(id: number): Promise<ObservationPlan | undefined> {
    return this._observationPlans.get(id);
  }

  async createObservationPlan(plan: InsertObservationPlan): Promise<ObservationPlan> {
    const id = this.observationPlanCurrentId++;
    const newPlan: ObservationPlan = { ...plan, id, createdAt: new Date() };
    this._observationPlans.set(id, newPlan);
    return newPlan;
  }

  async updateObservationPlan(id: number, updates: Partial<ObservationPlan>): Promise<ObservationPlan | undefined> {
    const plan = this._observationPlans.get(id);
    if (!plan) return undefined;

    const updatedPlan = { ...plan, ...updates };
    this._observationPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteObservationPlan(id: number): Promise<boolean> {
    return this._observationPlans.delete(id);
  }

  // Logs
  async getLogs(): Promise<Log[]> {
    return Array.from(this._logs.values());
  }

  async getLogsByTelescope(telescopeId: number): Promise<Log[]> {
    return Array.from(this._logs.values())
      .filter((log) => log.telescopeId === telescopeId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLog(id: number): Promise<Log | undefined> {
    return this._logs.get(id);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const id = this.logCurrentId++;
    const newLog: Log = { ...log, id };
    this._logs.set(id, newLog);
    return newLog;
  }

  async deleteLog(id: number): Promise<boolean> {
    return this._logs.delete(id);
  }

  async clearLogsByTelescope(telescopeId: number): Promise<boolean> {
    let success = true;
    
    for (const [id, log] of this._logs.entries()) {
      if (log.telescopeId === telescopeId) {
        const result = this._logs.delete(id);
        if (!result) success = false;
      }
    }
    
    return success;
  }

  // Supernova Targets
  async getSupernovaTargets(): Promise<SupernovaTarget[]> {
    return Array.from(this._supernovaTargets.values());
  }

  async getSupernovaTarget(id: number): Promise<SupernovaTarget | undefined> {
    return this._supernovaTargets.get(id);
  }

  async createSupernovaTarget(target: InsertSupernovaTarget): Promise<SupernovaTarget> {
    const id = this.supernovaTargetCurrentId++;
    const newTarget: SupernovaTarget = { ...target, id, createdAt: new Date() };
    this._supernovaTargets.set(id, newTarget);
    return newTarget;
  }

  async updateSupernovaTarget(id: number, updates: Partial<SupernovaTarget>): Promise<SupernovaTarget | undefined> {
    const target = this._supernovaTargets.get(id);
    if (!target) return undefined;

    const updatedTarget = { ...target, ...updates };
    this._supernovaTargets.set(id, updatedTarget);
    return updatedTarget;
  }

  async deleteSupernovaTarget(id: number): Promise<boolean> {
    return this._supernovaTargets.delete(id);
  }

  // Supernova Discoveries
  async getSupernovaDiscoveries(): Promise<SupernovaDiscovery[]> {
    return Array.from(this._supernovaDiscoveries.values());
  }

  async getSupernovaDiscovery(id: number): Promise<SupernovaDiscovery | undefined> {
    return this._supernovaDiscoveries.get(id);
  }

  async createSupernovaDiscovery(discovery: InsertSupernovaDiscovery): Promise<SupernovaDiscovery> {
    const id = this.supernovaDiscoveryCurrentId++;
    const newDiscovery: SupernovaDiscovery = { ...discovery, id, createdAt: new Date() };
    this._supernovaDiscoveries.set(id, newDiscovery);
    return newDiscovery;
  }

  async deleteSupernovaDiscovery(id: number): Promise<boolean> {
    return this._supernovaDiscoveries.delete(id);
  }
}

// Implementation of IStorage using PostgreSQL database
import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return db.select().from(locations);
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: number, updates: Partial<Location>): Promise<Location | undefined> {
    const [updatedLocation] = await db.update(locations)
      .set(updates)
      .where(eq(locations.id, id))
      .returning();
    return updatedLocation || undefined;
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id));
    return result.rowCount > 0;
  }

  async updateLocationWeather(id: number, weatherData: WeatherData): Promise<Location | undefined> {
    return this.updateLocation(id, { weatherData });
  }

  // Telescopes
  async getTelescopes(): Promise<Telescope[]> {
    return db.select().from(telescopes);
  }

  async getTelescopesByLocation(locationId: number): Promise<Telescope[]> {
    return db.select().from(telescopes).where(eq(telescopes.locationId, locationId));
  }

  async getTelescope(id: number): Promise<Telescope | undefined> {
    const [telescope] = await db.select().from(telescopes).where(eq(telescopes.id, id));
    return telescope || undefined;
  }

  async createTelescope(telescope: InsertTelescope): Promise<Telescope> {
    const [newTelescope] = await db.insert(telescopes).values(telescope).returning();
    return newTelescope;
  }

  async updateTelescope(id: number, updates: Partial<Telescope>): Promise<Telescope | undefined> {
    const [updatedTelescope] = await db.update(telescopes)
      .set(updates)
      .where(eq(telescopes.id, id))
      .returning();
    return updatedTelescope || undefined;
  }

  async deleteTelescope(id: number): Promise<boolean> {
    const result = await db.delete(telescopes).where(eq(telescopes.id, id));
    return result.rowCount > 0;
  }

  // Observation Plans
  async getObservationPlans(): Promise<ObservationPlan[]> {
    return db.select().from(observationPlans);
  }

  async getObservationPlansByTelescope(telescopeId: number): Promise<ObservationPlan[]> {
    return db.select()
      .from(observationPlans)
      .where(eq(observationPlans.telescopeId, telescopeId));
  }

  async getObservationPlansByUser(userId: number): Promise<ObservationPlan[]> {
    return db.select()
      .from(observationPlans)
      .where(eq(observationPlans.userId, userId));
  }

  async getObservationPlan(id: number): Promise<ObservationPlan | undefined> {
    const [plan] = await db.select()
      .from(observationPlans)
      .where(eq(observationPlans.id, id));
    return plan || undefined;
  }

  async createObservationPlan(plan: InsertObservationPlan): Promise<ObservationPlan> {
    const [newPlan] = await db.insert(observationPlans).values(plan).returning();
    return newPlan;
  }

  async updateObservationPlan(id: number, updates: Partial<ObservationPlan>): Promise<ObservationPlan | undefined> {
    const [updatedPlan] = await db.update(observationPlans)
      .set(updates)
      .where(eq(observationPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deleteObservationPlan(id: number): Promise<boolean> {
    const result = await db.delete(observationPlans).where(eq(observationPlans.id, id));
    return result.rowCount > 0;
  }

  // Logs
  async getLogs(): Promise<Log[]> {
    return db.select().from(logs);
  }

  async getLogsByTelescope(telescopeId: number): Promise<Log[]> {
    return db.select().from(logs).where(eq(logs.telescopeId, telescopeId));
  }

  async getLog(id: number): Promise<Log | undefined> {
    const [log] = await db.select().from(logs).where(eq(logs.id, id));
    return log || undefined;
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(log).returning();
    return newLog;
  }

  async deleteLog(id: number): Promise<boolean> {
    const result = await db.delete(logs).where(eq(logs.id, id));
    return result.rowCount > 0;
  }

  async clearLogsByTelescope(telescopeId: number): Promise<boolean> {
    const result = await db.delete(logs).where(eq(logs.telescopeId, telescopeId));
    return result.rowCount > 0;
  }

  // Supernova Targets
  async getSupernovaTargets(): Promise<SupernovaTarget[]> {
    return db.select().from(supernovaTargets);
  }

  async getSupernovaTarget(id: number): Promise<SupernovaTarget | undefined> {
    const [target] = await db.select()
      .from(supernovaTargets)
      .where(eq(supernovaTargets.id, id));
    return target || undefined;
  }

  async createSupernovaTarget(target: InsertSupernovaTarget): Promise<SupernovaTarget> {
    const [newTarget] = await db.insert(supernovaTargets).values(target).returning();
    return newTarget;
  }

  async updateSupernovaTarget(id: number, updates: Partial<SupernovaTarget>): Promise<SupernovaTarget | undefined> {
    const [updatedTarget] = await db.update(supernovaTargets)
      .set(updates)
      .where(eq(supernovaTargets.id, id))
      .returning();
    return updatedTarget || undefined;
  }

  async deleteSupernovaTarget(id: number): Promise<boolean> {
    const result = await db.delete(supernovaTargets).where(eq(supernovaTargets.id, id));
    return result.rowCount > 0;
  }

  // Supernova Discoveries
  async getSupernovaDiscoveries(): Promise<SupernovaDiscovery[]> {
    return db.select().from(supernovaDiscoveries);
  }

  async getSupernovaDiscovery(id: number): Promise<SupernovaDiscovery | undefined> {
    const [discovery] = await db.select()
      .from(supernovaDiscoveries)
      .where(eq(supernovaDiscoveries.id, id));
    return discovery || undefined;
  }

  async createSupernovaDiscovery(discovery: InsertSupernovaDiscovery): Promise<SupernovaDiscovery> {
    const [newDiscovery] = await db.insert(supernovaDiscoveries).values(discovery).returning();
    return newDiscovery;
  }

  async deleteSupernovaDiscovery(id: number): Promise<boolean> {
    const result = await db.delete(supernovaDiscoveries).where(eq(supernovaDiscoveries.id, id));
    return result.rowCount > 0;
  }
}

// Create an instance of the database storage
export const storage = new DatabaseStorage();
