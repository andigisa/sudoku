import { type SQLJsDatabase } from "drizzle-orm/sql-js";
import * as schema from "./schema.js";
declare let db: SQLJsDatabase<typeof schema>;
export declare function initDatabase(): Promise<void>;
export declare function persist(): void;
export { db };
