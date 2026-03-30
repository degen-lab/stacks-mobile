import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1759000000000 implements MigrationInterface {
  name = 'InitialSchema1759000000000';

  private async createEnumIfMissing(
    queryRunner: QueryRunner,
    name: string,
    values: readonly string[],
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = '${name}'
        ) THEN
          CREATE TYPE "${name}" AS ENUM(${values
            .map((value) => `'${value}'`)
            .join(', ')});
        END IF;
      END$$;
    `);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const enums = [
      ['default_item_type_enum', ['0', '1']],
      ['default_item_purchasetype_enum', ['0', '1', '2']],
      ['submission_type_enum', ['0', '1']],
      ['submission_tier_enum', ['0', '1', '2', '3', '4']],
      ['submission_transactionstatus_enum', ['0', '1', '2', '3', '4']],
      ['stacking_data_txstatus_enum', ['0', '1', '2', '3', '4']],
      ['sponsored_transaction_status_enum', ['0', '1', '2', '3', '4']],
      [
        'tournament_status_status_enum',
        [
          'SubmitPhase',
          'FinishSubmissionsPhase',
          'DistributionPhase',
          'HeadToNextTournament',
        ],
      ],
      ['defi_operation_status_enum', ['0', '1', '2', '3', '4']],
      ['defi_operation_operationtype_enum', ['Swap', 'Lending']],
    ] as const;

    for (const [name, values] of enums) {
      await this.createEnumIfMissing(queryRunner, name, values);
    }

    // Create the current application schema in one shot for fresh databases.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" SERIAL NOT NULL,
        "googleId" character varying NOT NULL,
        "nickName" character varying NOT NULL,
        "points" integer NOT NULL DEFAULT 0,
        "streak" integer NOT NULL DEFAULT 0,
        "lastStreakCompletionDate" date,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "referralCode" character varying NOT NULL,
        "isBlackListed" boolean NOT NULL DEFAULT false,
        "photoUri" text,
        "analyticsConsent" boolean,
        "adsPersonalizationConsent" boolean,
        "consentVersion" character varying,
        "consentUpdatedAt" TIMESTAMP,
        "referrerId" integer,
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId"),
        CONSTRAINT "UQ_bf0e513b5cd8b4e937fa0702311" UNIQUE ("referralCode"),
        CONSTRAINT "FK_d928d4688b6eabe05384011f350"
          FOREIGN KEY ("referrerId") REFERENCES "user"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "default_item" (
        "id" SERIAL NOT NULL,
        "name" text NOT NULL,
        "type" "default_item_type_enum" NOT NULL,
        "description" text,
        "purchaseType" "default_item_purchasetype_enum" NOT NULL,
        "metadata" json,
        "pointsSpent" integer,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "quantity" integer,
        "pointsPerUnit" integer,
        "discriminator" character varying NOT NULL,
        "userId" integer,
        CONSTRAINT "PK_a05f604640489fc4a236af5eb2f" PRIMARY KEY ("id"),
        CONSTRAINT "FK_a31b7f91296e830491f619855dc"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_f16bde77c33d3e7029ad29fc5e"
      ON "default_item" ("discriminator")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fraud_attempt" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fraudReason" character varying NOT NULL,
        "fraudData" json NOT NULL,
        "userId" integer,
        CONSTRAINT "PK_8a532d9870f8cad77527d5a80f3" PRIMARY KEY ("id"),
        CONSTRAINT "FK_83f034eb269f0f17cff08c1ac12"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rewards_distribution_data" (
        "id" SERIAL NOT NULL,
        "tournamentId" bigint NOT NULL,
        "transactionId" text NOT NULL,
        CONSTRAINT "PK_097bf23a8827956f7a24dd8896c" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tournament_status" (
        "id" SERIAL NOT NULL,
        "tournamentId" bigint NOT NULL,
        "status" "tournament_status_status_enum" NOT NULL,
        CONSTRAINT "PK_048e1e18ec01ae3cec8140ef504" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crypto_purchase" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "cryptoCurrencyCode" text NOT NULL,
        "fiatCurrency" text NOT NULL,
        "status" text,
        "fiatAmount" bigint,
        "cryptoAmount" bigint,
        "userId" integer,
        CONSTRAINT "PK_3285c659ae702a21369d4412875" PRIMARY KEY ("id"),
        CONSTRAINT "FK_adc2c2f6b01834a3c1071f6c165"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stacking_data" (
        "id" SERIAL NOT NULL,
        "startCycleId" integer NOT NULL,
        "poolName" text NOT NULL,
        "poolStxAddress" text NOT NULL,
        "userStxAddress" text NOT NULL,
        "amountOfStxStacked" numeric(20,6) DEFAULT 0,
        "endCycleId" integer,
        "txId" text NOT NULL,
        "poxAddress" text,
        "txStatus" "stacking_data_txstatus_enum" NOT NULL DEFAULT '0',
        "rewardedStxAmount" bigint,
        "userId" integer,
        CONSTRAINT "PK_0a7aa844170e90af7fff0c797c2" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_f5b27ea70968e46158670fb56d7" UNIQUE ("txId"),
        CONSTRAINT "FK_6f85eb5bacd61d8b8d330340f41"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "defi_operation" (
        "id" SERIAL NOT NULL,
        "senderAddress" text NOT NULL,
        "txId" text,
        "status" "defi_operation_status_enum" NOT NULL,
        "operationType" "defi_operation_operationtype_enum" NOT NULL,
        "metadata" jsonb,
        "preparedContractCall" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" integer,
        CONSTRAINT "PK_2d9166d665d37e1f1e427af5378" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_b6288ff4350416e0d782614e6cd" UNIQUE ("txId"),
        CONSTRAINT "FK_262541a524bf0d0d4fe67423dcd"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sponsored_transaction" (
        "id" SERIAL NOT NULL,
        "serializedTx" text,
        "txId" text,
        "status" "sponsored_transaction_status_enum" NOT NULL DEFAULT '3',
        "adWatched" boolean NOT NULL DEFAULT false,
        "originAddress" text NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" integer NOT NULL,
        "defiOperationId" integer,
        CONSTRAINT "PK_f1c02a8e9cac540c6b72455cb78" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sponsored_transaction_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_sponsored_transaction_defi_operation"
          FOREIGN KEY ("defiOperationId") REFERENCES "defi_operation"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
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
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sponsored_transaction_defi_operation"
      ON "sponsored_transaction" ("defiOperationId")
      WHERE "defiOperationId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "submission" (
        "id" SERIAL NOT NULL,
        "transactionId" text,
        "type" "submission_type_enum" NOT NULL,
        "stacksAddress" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "score" integer NOT NULL,
        "tournamentId" integer NOT NULL,
        "tier" "submission_tier_enum" NOT NULL DEFAULT '0',
        "transactionStatus" "submission_transactionstatus_enum" NOT NULL DEFAULT '3',
        "isSponsored" boolean NOT NULL DEFAULT false,
        "userId" integer,
        "sponsoredTransactionId" integer,
        CONSTRAINT "PK_7faa571d0e4a7076e85890c9bd0" PRIMARY KEY ("id"),
        CONSTRAINT "REL_d619931c9eda93da4060816341" UNIQUE ("sponsoredTransactionId"),
        CONSTRAINT "FK_7bd626272858ef6464aa2579094"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_d619931c9eda93da4060816341e"
          FOREIGN KEY ("sponsoredTransactionId")
          REFERENCES "sponsored_transaction"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rewards_distribution_data_submissions" (
        "rewardsDistributionDataId" integer NOT NULL,
        "submissionId" integer NOT NULL,
        CONSTRAINT "PK_3fb70007a4453568fa094fd47ed"
          PRIMARY KEY ("rewardsDistributionDataId", "submissionId"),
        CONSTRAINT "FK_4f94db67b663332634b868a77c7"
          FOREIGN KEY ("rewardsDistributionDataId")
          REFERENCES "rewards_distribution_data"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_fc6f35e2ed7b203f99ee1c214f0"
          FOREIGN KEY ("submissionId")
          REFERENCES "submission"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_4f94db67b663332634b868a77c"
      ON "rewards_distribution_data_submissions" ("rewardsDistributionDataId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fc6f35e2ed7b203f99ee1c214f"
      ON "rewards_distribution_data_submissions" ("submissionId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "rewards_distribution_data_submissions"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "submission"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "sponsored_transaction"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "defi_operation"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "stacking_data"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "crypto_purchase"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "tournament_status"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "rewards_distribution_data"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "fraud_attempt"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "default_item"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "user"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "defi_operation_operationtype_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "defi_operation_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "sponsored_transaction_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "tournament_status_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "stacking_data_txstatus_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "submission_transactionstatus_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "submission_tier_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "submission_type_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "default_item_purchasetype_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "default_item_type_enum"
    `);
  }
}
