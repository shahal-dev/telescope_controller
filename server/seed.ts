import { db } from "./db";
import { 
  users, locations, telescopes, observationPlans, logs, 
  supernovaTargets, supernovaDiscoveries 
} from "@shared/schema";
import { WeatherData } from "@shared/schema";

async function seedDatabase() {
  console.log("🗑️  Clearing existing data...");
  
  // Delete data in reverse order of dependencies
  await db.delete(logs);
  await db.delete(supernovaDiscoveries);
  await db.delete(supernovaTargets);
  await db.delete(observationPlans);
  await db.delete(telescopes);
  await db.delete(locations);
  await db.delete(users);

  console.log("🌱 Seeding database with fresh data...");

  console.log("Creating admin user...");
  const [admin] = await db.insert(users).values({
    username: "admin",
    password: "admin123",
    isAdmin: true,
  }).returning();

  console.log("Creating locations...");
  // CASSA Main Observatory
  const [cassaMain] = await db.insert(locations).values({
    name: "CASSA Main Observatory",
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
    } as WeatherData,
  }).returning();

  // CASSA Research Center
  const [cassaResearch] = await db.insert(locations).values({
    name: "CASSA Research Center",
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
    } as WeatherData,
  }).returning();

  // CASSA Educational Outreach
  const [cassaEducation] = await db.insert(locations).values({
    name: "CASSA Educational Outreach",
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
    } as WeatherData,
  }).returning();

  console.log("Creating telescopes...");
  // CASSA Main Observatory telescopes
  const [celestronCPC] = await db.insert(telescopes).values({
    name: "Celestron CPC 800",
    model: "Celestron CPC 800",
    locationId: cassaMain.id,
    status: "active",
    targetObject: "M31 Andromeda",
    rightAscension: "00h 42m 44s",
    declination: "+41° 16' 9\"",
    specifications: {
      aperture: "203mm (8\")",
      focalLength: "2032mm",
      focalRatio: "f/10",
      mountType: "Alt-azimuth",
      tracking: "Computerized GoTo",
      opticalDesign: "Schmidt-Cassegrain"
    }
  }).returning();

  await db.insert(telescopes).values({
    name: "Meade LX200 14\"",
    model: "Meade LX200-ACF",
    locationId: cassaMain.id,
    status: "standby",
    specifications: {
      aperture: "356mm (14\")",
      focalLength: "3556mm",
      focalRatio: "f/10",
      mountType: "German Equatorial",
      tracking: "Computerized GoTo",
      opticalDesign: "Advanced Coma-Free"
    }
  });

  // CASSA Research Center telescopes
  await db.insert(telescopes).values([
    {
      name: "Takahashi FSQ-106ED",
      model: "Takahashi FSQ-106EDX4",
      locationId: cassaResearch.id,
      status: "active",
      specifications: {
        aperture: "106mm",
        focalLength: "530mm",
        focalRatio: "f/5",
        mountType: "German Equatorial",
        tracking: "High-Precision",
        opticalDesign: "ED Quadruplet Astrograph"
      }
    },
    {
      name: "PlaneWave CDK14",
      model: "PlaneWave CDK14",
      locationId: cassaResearch.id,
      status: "maintenance",
      specifications: {
        aperture: "356mm (14\")",
        focalLength: "2541mm",
        focalRatio: "f/7.2",
        mountType: "Direct-Drive Mount",
        tracking: "Sub-arcsecond",
        opticalDesign: "Corrected Dall-Kirkham"
      }
    },
    {
      name: "Astro-Physics 175mm Starfire EDT",
      model: "AP 175EDT",
      locationId: cassaResearch.id,
      status: "active",
      specifications: {
        aperture: "175mm",
        focalLength: "1370mm",
        focalRatio: "f/8",
        mountType: "AP1600GTO",
        tracking: "Professional-Grade",
        opticalDesign: "ED Triplet Refractor"
      }
    }
  ]);

  // CASSA Educational Outreach telescopes
  await db.insert(telescopes).values([
    {
      name: "Celestron EdgeHD 11\"",
      model: "Celestron EdgeHD 11",
      locationId: cassaEducation.id,
      status: "offline",
      specifications: {
        aperture: "279mm (11\")",
        focalLength: "2800mm",
        focalRatio: "f/10",
        mountType: "CGX-L Mount",
        tracking: "Computerized GoTo",
        opticalDesign: "Edge-HD Schmidt-Cassegrain"
      }
    },
    {
      name: "Sky-Watcher EQ6-R Pro",
      model: "Sky-Watcher EQ6-R Pro",
      locationId: cassaEducation.id,
      status: "offline",
      specifications: {
        aperture: "N/A (Mount Only)",
        focalLength: "N/A",
        focalRatio: "N/A",
        mountType: "German Equatorial",
        tracking: "Belt-Driven",
        opticalDesign: "Equatorial Mount"
      }
    },
    {
      name: "Officina Stellare RH200",
      model: "RH200 AT",
      locationId: cassaEducation.id,
      status: "maintenance",
      specifications: {
        aperture: "200mm",
        focalLength: "1400mm",
        focalRatio: "f/7",
        mountType: "10Micron GM2000",
        tracking: "Ultra-High Precision",
        opticalDesign: "Ritchey-Chrétien"
      }
    },
    {
      name: "ASA N20150",
      model: "ASA Newtonian N20150",
      locationId: cassaEducation.id,
      status: "active",
      specifications: {
        aperture: "500mm (20\")",
        focalLength: "1500mm",
        focalRatio: "f/3",
        mountType: "ASA DDM160",
        tracking: "Direct Drive",
        opticalDesign: "Fast Newtonian Astrograph"
      }
    }
  ]);

  console.log("Creating observation plans...");
  await db.insert(observationPlans).values({
    name: "Deep Sky Objects",
    description: "Observation of various deep sky objects",
    status: "scheduled",
    telescopeId: celestronCPC.id,
    userId: admin.id,
    scheduledDate: new Date("2025-06-01"),
    targets: [
      {
        name: "M31 Andromeda Galaxy",
        rightAscension: "00h 42m 44s",
        declination: "+41° 16' 9\"",
        exposureTime: 300,
        filters: ["L", "R", "G", "B"]
      },
      {
        name: "M42 Orion Nebula",
        rightAscension: "05h 35m 17s",
        declination: "-05° 23' 28\"",
        exposureTime: 120,
        filters: ["Ha", "OIII", "SII"]
      }
    ],
  });

  console.log("Creating supernova targets...");
  const [target] = await db.insert(supernovaTargets).values({
    name: "NGC 4993",
    type: "Galaxy",
    magnitude: "12.4",
    distance: "130 million light-years",
    description: "Galaxy that hosted GW170817, a kilonova",
    lastChecked: new Date("2025-05-05"),
  }).returning();

  console.log("Creating supernova discoveries...");
  await db.insert(supernovaDiscoveries).values({
    name: "SN 2023abc",
    type: "Type Ia",
    magnitude: "15.8",
    targetId: target.id,
    location: "Outskirts of galaxy",
    discoveryDate: new Date("2025-01-15"),
  });

  console.log("Creating log entries...");
  await db.insert(logs).values({
    telescopeId: celestronCPC.id,
    level: "info",
    message: "Telescope initialized and ready",
    timestamp: new Date(),
    data: { status: "operational", temperature: 15.2 },
  });

  console.log("✅ Database seeded successfully!");
}

// Run the seed script
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  });

export { seedDatabase };