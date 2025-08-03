import { seedDatabase } from "../server/seed";
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("⚠️  WARNING: This will remove all existing data from the database!");
rl.question('Are you sure you want to proceed? (y/N) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log("Starting database seeding...");
    seedDatabase()
      .then(() => {
        console.log("✅ Database seeded successfully!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
      })
      .finally(() => {
        rl.close();
      });
  } else {
    console.log("Seeding cancelled.");
    rl.close();
    process.exit(0);
  }
});
