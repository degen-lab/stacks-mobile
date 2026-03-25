import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSponsoredSwapSupport1761000000000 implements MigrationInterface {
  name = 'AddSponsoredSwapSupport1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Store the exact contract call params prepared by the server so we can
    // verify the signed tx matches exactly what was quoted.
    await queryRunner.query(`
      ALTER TABLE "defi_operation"
        ADD COLUMN IF NOT EXISTS "preparedContractCall" jsonb
    `);

    // Link a sponsored request to the defi operation it was created for.
    // UNIQUE enforces one active sponsored slot per swap (prevents replay).
    await queryRunner.query(`
      ALTER TABLE "sponsored_transaction"
        ADD COLUMN IF NOT EXISTS "defiOperationId" integer
          REFERENCES "defi_operation"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sponsored_transaction_defi_operation"
      ON "sponsored_transaction" ("defiOperationId")
      WHERE "defiOperationId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_sponsored_transaction_defi_operation"
    `);

    await queryRunner.query(`
      ALTER TABLE "sponsored_transaction"
        DROP COLUMN IF EXISTS "defiOperationId"
    `);

    await queryRunner.query(`
      ALTER TABLE "defi_operation"
        DROP COLUMN IF EXISTS "preparedContractCall"
    `);
  }
}
