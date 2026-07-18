import { closePool } from "../db/db";
import { migrate } from "../db/migrate";

async function main(): Promise<void> {
  try {
    await migrate();
    console.log("Migrations complete");
  } finally {
    await closePool();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
