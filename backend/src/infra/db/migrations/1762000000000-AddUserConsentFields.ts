import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserConsentFields1762000000000 implements MigrationInterface {
  name = 'AddUserConsentFields1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS "analyticsConsent" boolean,
        ADD COLUMN IF NOT EXISTS "adsPersonalizationConsent" boolean,
        ADD COLUMN IF NOT EXISTS "consentVersion" varchar,
        ADD COLUMN IF NOT EXISTS "consentUpdatedAt" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        DROP COLUMN IF EXISTS "consentUpdatedAt",
        DROP COLUMN IF EXISTS "consentVersion",
        DROP COLUMN IF EXISTS "adsPersonalizationConsent",
        DROP COLUMN IF EXISTS "analyticsConsent"
    `);
  }
}
