import { Pool} from "pg";

// Evita crear múltiples pools en hot-reload (dev)
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

export const pool =
  global.__pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") global.__pgPool = pool;
