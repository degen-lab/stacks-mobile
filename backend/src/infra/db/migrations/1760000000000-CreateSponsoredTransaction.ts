import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSponsoredTransaction1760000000000 implements MigrationInterface {
  name = 'CreateSponsoredTransaction1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'sponsored_transaction_status_enum'
        ) THEN
          CREATE TYPE "sponsored_transaction_status_enum" AS ENUM(
            '0',
            '1',
            '2',
            '3',
            '4'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sponsored_transaction" (
        "id" SERIAL PRIMARY KEY,
        "serializedTx" text,
        "txId" text,
        "status" "sponsored_transaction_status_enum" NOT NULL DEFAULT '3',
        "adWatched" boolean NOT NULL DEFAULT false,
        "originAddress" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" integer NOT NULL,
        CONSTRAINT "FK_sponsored_transaction_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sponsored_transaction_status_created_at"
      ON "sponsored_transaction" ("status", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sponsored_transaction_expires_at"
      ON "sponsored_transaction" ("expiresAt")
    `);

    // Submission owns the FK to its sponsored transaction (nullable for wallet-funded submissions).
    // ON DELETE SET NULL so cleanup jobs can delete expired SponsoredTransaction rows freely.
    await queryRunner.query(`
      ALTER TABLE "submission"
        DROP COLUMN IF EXISTS "adWatched",
        DROP COLUMN IF EXISTS "serializedTx",
        ADD COLUMN IF NOT EXISTS "sponsoredTransactionId" integer
          REFERENCES "sponsored_transaction"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "submission"
        DROP COLUMN IF EXISTS "sponsoredTransactionId",
        ADD COLUMN IF NOT EXISTS "serializedTx" text,
        ADD COLUMN IF NOT EXISTS "adWatched" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_sponsored_transaction_expires_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_sponsored_transaction_status_created_at"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "sponsored_transaction"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "sponsored_transaction_status_enum"
    `);
  }
}
