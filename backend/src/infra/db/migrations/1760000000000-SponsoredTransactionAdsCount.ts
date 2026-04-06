import { MigrationInterface, QueryRunner } from 'typeorm';

export class SponsoredTransactionAdsCount1760000000000 implements MigrationInterface {
  name = 'SponsoredTransactionAdsCount1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction ADD COLUMN "adsRequired" int NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction ADD COLUMN "adsWatchedCount" int NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE sponsored_transaction SET "adsWatchedCount" = CASE WHEN "adWatched" THEN 1 ELSE 0 END`,
    );
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction DROP COLUMN "adWatched"`,
    );
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction ADD COLUMN "dependsOnRequestId" integer NULL REFERENCES sponsored_transaction(id) ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction DROP COLUMN "dependsOnRequestId"`,
    );
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction ADD COLUMN "adWatched" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE sponsored_transaction SET "adWatched" = ("adsWatchedCount" >= "adsRequired")`,
    );
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction DROP COLUMN "adsWatchedCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE sponsored_transaction DROP COLUMN "adsRequired"`,
    );
  }
}
