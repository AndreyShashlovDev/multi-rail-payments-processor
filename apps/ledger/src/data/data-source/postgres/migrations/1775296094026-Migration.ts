import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775296094026 implements MigrationInterface {
    name = 'Migration1775296094026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ledger"."balance_event_inbox" ("key" character varying NOT NULL, CONSTRAINT "IDX_UNIQUE_KEY" UNIQUE ("key"), CONSTRAINT "PK_0565e42ee6b5b8be02626e9783d" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "ledger"."integration_account_es" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "account" text NOT NULL, "integration" text NOT NULL, "currency" text NOT NULL, "change_type" text NOT NULL, "amount" numeric(60,30) NOT NULL, "available_after" numeric(60,30) NOT NULL, "hold_after" numeric(60,30) NOT NULL, "hold_in_after" numeric(60,30) NOT NULL, "intent_id" text, "intent_type" text, "intent_operation_type" text, "metadata" jsonb NOT NULL, CONSTRAINT "PK_f26b74f6650dc47b7df9222ebe3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_integration_account_es_intent" ON "ledger"."integration_account_es" ("intent_type", "intent_id") `);
        await queryRunner.query(`CREATE INDEX "idx_integration_account_es_account_integration_currency" ON "ledger"."integration_account_es" ("account", "integration", "currency") `);
        await queryRunner.query(`CREATE TABLE "ledger"."integration_account_projection" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "account" text NOT NULL, "integration" text NOT NULL, "currency" text NOT NULL, "available" numeric(60,30) NOT NULL, "hold" numeric(60,30) NOT NULL, "hold_in" numeric(60,30) NOT NULL, CONSTRAINT "idx_unique_integration_account_projection_account_integration_currency" UNIQUE ("account", "integration", "currency"), CONSTRAINT "PK_ee0e6c5e3d37364d56268823241" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ledger"."platform_account_es" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "account_id" uuid NOT NULL, "integration" text NOT NULL, "currency" text NOT NULL, "change_type" text NOT NULL, "amount" numeric(60,30) NOT NULL, "available_after" numeric(60,30) NOT NULL, "hold_after" numeric(60,30) NOT NULL, "hold_in_after" numeric(60,30) NOT NULL, "intent_id" text, "intent_type" text, "intent_operation_type" text, "metadata" jsonb NOT NULL, CONSTRAINT "PK_4053799200e4b0aedf844854262" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_platform_account_es_intent" ON "ledger"."platform_account_es" ("intent_type", "intent_id") `);
        await queryRunner.query(`CREATE INDEX "idx_platform_account_es_account_integration_currency" ON "ledger"."platform_account_es" ("account_id", "integration", "currency") `);
        await queryRunner.query(`CREATE TABLE "ledger"."platform_account_projection" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "account_id" uuid NOT NULL, "integration" text NOT NULL, "currency" text NOT NULL, "available" numeric(60,30) NOT NULL, "hold" numeric(60,30) NOT NULL, "hold_in" numeric(60,30) NOT NULL, CONSTRAINT "idx_unique_platform_account_projection_account_integration_currency" UNIQUE ("account_id", "integration", "currency"), CONSTRAINT "PK_5a0749c1e6f4480bf6c86aa9d9f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ledger"."platform_account_projection"`);
        await queryRunner.query(`DROP INDEX "ledger"."idx_platform_account_es_account_integration_currency"`);
        await queryRunner.query(`DROP INDEX "ledger"."idx_platform_account_es_intent"`);
        await queryRunner.query(`DROP TABLE "ledger"."platform_account_es"`);
        await queryRunner.query(`DROP TABLE "ledger"."integration_account_projection"`);
        await queryRunner.query(`DROP INDEX "ledger"."idx_integration_account_es_account_integration_currency"`);
        await queryRunner.query(`DROP INDEX "ledger"."idx_integration_account_es_intent"`);
        await queryRunner.query(`DROP TABLE "ledger"."integration_account_es"`);
        await queryRunner.query(`DROP TABLE "ledger"."balance_event_inbox"`);
    }

}
