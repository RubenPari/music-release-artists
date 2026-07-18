import { getPool } from "../db/db";
import { migrate } from "../db/migrate";

migrate()
  .then(() => {
    console.log("Migrations complete");
    return getPool().end();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
