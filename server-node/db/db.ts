import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import pgvector from "pgvector/pg";
import { getEnv, getNumberEnv } from "../utils/env.js";
import { logger } from "../utils/logger.js";
import { ensureDatabaseSchema } from "./schema.js";

const pool = new Pool({
  connectionString: getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/edusim"),
  max: getNumberEnv("PGPOOL_MAX", 10),
  idleTimeoutMillis: getNumberEnv("PGPOOL_IDLE_TIMEOUT_MS", 30_000),
  connectionTimeoutMillis: getNumberEnv("PGPOOL_CONNECTION_TIMEOUT_MS", 10_000),
});

let initializationPromise: Promise<void> | null = null;

pool.on("connect", async (client) => {
  await pgvector.registerTypes(client);
});

pool.on("error", (error) => {
  logger.error("PostgreSQL pool error", error);
});

export async function initializeDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const client = await pool.connect();

      try {
        await pgvector.registerTypes(client);
        await ensureDatabaseSchema(client);
        logger.info("PostgreSQL schema ready");
      } finally {
        client.release();
      }
    })();
  }

  await initializationPromise;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, [...params]);
}

export async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function shutdownDatabase(): Promise<void> {
  await pool.end();
  logger.info("PostgreSQL pool closed");
}

export { pool };
