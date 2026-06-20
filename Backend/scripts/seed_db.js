import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Scheme from '../src/models/Scheme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected successfully!");

    console.log("Reading maharashtra_schemes.json...");
    const jsonPath = path.resolve(__dirname, '../../../scraping/maharashtra_schemes.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Found ${data.length} schemes. Processing...`);

    const formattedSchemes = data.map((item) => {
      // Basic formatting to split newlines into arrays
      return {
        schemeName: item.name || "Unknown Scheme",
        category: (item.tags && item.tags.length > 0) ? item.tags[0] : "General",
        description: item.details || "",
        benefits: item.benefits ? item.benefits.split('\n').map(s => s.trim()).filter(Boolean) : [],
        eligibility: item.eligibility ? item.eligibility.split('\n').map(s => s.trim()).filter(Boolean) : [],
        requiredDocuments: item.documents_required ? item.documents_required.split('\n').map(s => s.trim()).filter(Boolean) : [],
        applicationProcess: item.application_process ? item.application_process.split('\n').map(s => s.trim()).filter(Boolean) : [],
        officialLink: item.url || "#",
      };
    });

    console.log("Clearing existing schemes from database...");
    await Scheme.deleteMany({});

    console.log("Inserting new schemes...");
    await Scheme.insertMany(formattedSchemes);
    
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
