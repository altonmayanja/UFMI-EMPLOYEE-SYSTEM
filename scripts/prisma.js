/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv');
const path = require('path');

// Load .env BEFORE Prisma runs
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Forward args to prisma CLI
const { execSync } = require('child_process');
const args = process.argv.slice(2);

try {
  execSync(`npx prisma ${args.join(' ')}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
} catch (error) {
  process.exit(error.status || 1);
}
