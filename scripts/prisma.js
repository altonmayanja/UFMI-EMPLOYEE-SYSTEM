/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.error('Failed to load .env:', envConfig.error.message);
  process.exit(1);
}

const databaseUrl = envConfig.parsed?.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

// Set env var directly in process.env
process.env.DATABASE_URL = databaseUrl;

const args = process.argv.slice(2);

// For generate, validate, and format - just use the original schema
// (the env var is already set in process.env)
if (args.includes('generate') || args.includes('validate') || args.includes('format')) {
  const cmd = `npx prisma ${args.join(' ')}`;
  console.log(`Running: prisma ${args.join(' ')}`);
  try {
    execSync(cmd, { encoding: 'utf8', env: { ...process.env }, stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status || 1);
  }
  process.exit(0);
}

// For db commands (push, migrate, etc.) - create a temp schema with the URL directly
// to bypass Prisma's WASM env() validation bug
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Replace env("DATABASE_URL") with the actual URL for CLI validation
schemaContent = schemaContent.replace(
  /url\s*=\s*env\(["']DATABASE_URL["']\)/,
  `url = "${databaseUrl}"`
);

// Write temp schema
const tempSchemaPath = path.resolve(__dirname, '../prisma/schema-temp.prisma');
fs.writeFileSync(tempSchemaPath, schemaContent);

// Run prisma with temp schema
const filteredArgs = args.filter(a => a !== '--schema' && !a.startsWith('--schema='));
const cmd = `npx prisma ${filteredArgs.join(' ')} --schema=${tempSchemaPath}`;

console.log(`Running: prisma ${filteredArgs.join(' ')}`);
try {
  execSync(cmd, { encoding: 'utf8', env: { ...process.env }, stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
} finally {
  // Clean up temp schema
  if (fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
  }
}
