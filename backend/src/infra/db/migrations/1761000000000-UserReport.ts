import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserReport1761000000000 implements MigrationInterface {
  name = 'UserReport1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_report" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reporterId" INTEGER NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "reportedId" INTEGER NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "reason" VARCHAR NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_report"`);
  }
}
