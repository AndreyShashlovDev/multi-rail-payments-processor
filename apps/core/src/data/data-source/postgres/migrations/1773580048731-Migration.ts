import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1773580048731 implements MigrationInterface {
    name = 'Migration1773580048731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "core"."integration_account" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "integration" smallint NOT NULL, "account" text NOT NULL, "currency" text, "custody_account_id" bigint NOT NULL, "status" smallint NOT NULL DEFAULT '1', CONSTRAINT "idx_unique_integration_account_custody_account_id" UNIQUE ("custody_account_id"), CONSTRAINT "PK_29708a53e178d1c04d542a81800" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_integration_account_integration_currency_status" ON "core"."integration_account" ("integration", "currency", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_integration_account_integration_account" ON "core"."integration_account" ("integration", "account") `);
        await queryRunner.query(`CREATE TABLE "core"."integration_account_link" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "platform_account_id" uuid NOT NULL, "user_id" uuid NOT NULL, "integration_account_id" bigint NOT NULL, "status" smallint NOT NULL DEFAULT '1', "link_type" smallint NOT NULL DEFAULT '2', "released_at" TIMESTAMP, "expires_at" TIMESTAMP, CONSTRAINT "PK_db2cae70b14e4f520fed5798882" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_integration_account_link_platform_account_id" ON "core"."integration_account_link" ("platform_account_id") `);
        await queryRunner.query(`CREATE INDEX "idx_integration_account_link_integration_account_id_status" ON "core"."integration_account_link" ("integration_account_id", "status") `);
        await queryRunner.query(`CREATE TABLE "core"."payout_intent" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "initiator_account_id" uuid NOT NULL, "initiator_user_id" uuid NOT NULL, "from_integration_account" text NOT NULL, "from_platform_account" uuid NOT NULL, "from_id" bigint, "from_amount" numeric(60,30) NOT NULL, "from_currency" text NOT NULL, "from_integration" smallint NOT NULL, "estimated_fee" numeric(60,30) NOT NULL, "estimated_fee_currency" text NOT NULL, "platform_fee" numeric(60,30), "platform_fee_integration_account" text, "platform_fee_platform_account" uuid, "platform_fee_account_id" bigint, "integration_fee_payer_integration_account" text, "integration_fee_payer_platform_account" uuid, "integration_fee_payer_id" bigint, "integration_fee" numeric(60,30), "integration_fee_currency" text NOT NULL, "integration_fee_rate" numeric(60,30) NOT NULL, "exchange_rate" numeric(60,30), "to_integration_account" text NOT NULL, "to_platform_account" uuid, "to_id" bigint, "to_amount" numeric(60,30) NOT NULL, "to_currency" text NOT NULL, "to_integration" smallint NOT NULL, "status" smallint NOT NULL DEFAULT '1', "metadata" jsonb, CONSTRAINT "PK_a4dd54c9a374c6744f8391112e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_payout_intent_status" ON "core"."payout_intent" ("status") `);
        await queryRunner.query(`CREATE TABLE "core"."account" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner" uuid NOT NULL, "role" smallint NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "core"."integration_currency" ("id" SERIAL NOT NULL, "integration" text NOT NULL, "currency" text NOT NULL, "decimals" smallint NOT NULL, "unit_exponent" smallint NOT NULL, "alias" text NOT NULL, CONSTRAINT "idx_unique_integration_currency_integration_currency" UNIQUE ("integration", "currency"), CONSTRAINT "PK_8d0a82aba16869d53a12ea7c385" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "core"."payment_intent" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "initiator_account_id" uuid NOT NULL, "initiator_user_id" uuid NOT NULL, "to_integration_account" text NOT NULL, "to_platform_account" uuid NOT NULL, "to_id" bigint, "from_platform_account_id" uuid, "from_integration_account" text, "integration" smallint NOT NULL, "amount" numeric(60,30) NOT NULL, "paid" numeric(60,30) NOT NULL, "currency" text NOT NULL, "platform_fee" numeric(60,30), "platform_fee_platform_account_id" uuid, "platform_fee_integration_account" text, "platform_fee_account_id" bigint, "platform_fee_payer" smallint, "status" smallint NOT NULL DEFAULT '1', "metadata" jsonb, CONSTRAINT "PK_dfca7a184ac4bccfccd817a13e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_payment_intent_integration_currency_status" ON "core"."payment_intent" ("integration", "currency", "status") `);
        await queryRunner.query(`CREATE TABLE "core"."escrow" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "integration" smallint NOT NULL, "platform_account_id" uuid, "integration_account" text, "amount" numeric(60,30) NOT NULL, "currency" text NOT NULL, "type" smallint NOT NULL, "intent_type" text, "intent_id" text, "status" smallint NOT NULL, "metadata" jsonb, "metadata_hash" text NOT NULL, CONSTRAINT "PK_4aafc323d34fd7979460661ab4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_escrow_metadata_hash" ON "core"."escrow" ("metadata_hash") `);
        await queryRunner.query(`CREATE INDEX "idx_escrow_intent_type_intent_id" ON "core"."escrow" ("intent_type", "intent_id") `);
        await queryRunner.query(`CREATE INDEX "idx_escrow_status_created_at" ON "core"."escrow" ("status", "created_at") `);
        await queryRunner.query(`CREATE TABLE "core"."inbox" ("service_name" character varying NOT NULL, "idempotency_key" character varying NOT NULL, "data" text, CONSTRAINT "PK_45875d77b98fb32e13799702ac6" PRIMARY KEY ("service_name", "idempotency_key"))`);
        await queryRunner.query(`ALTER TABLE "core"."integration_account_link" ADD CONSTRAINT "FK_c34758bc84aa67e0a5fc697f236" FOREIGN KEY ("integration_account_id") REFERENCES "core"."integration_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."integration_account_link" DROP CONSTRAINT "FK_c34758bc84aa67e0a5fc697f236"`);
        await queryRunner.query(`DROP TABLE "core"."inbox"`);
        await queryRunner.query(`DROP INDEX "core"."idx_escrow_status_created_at"`);
        await queryRunner.query(`DROP INDEX "core"."idx_escrow_intent_type_intent_id"`);
        await queryRunner.query(`DROP INDEX "core"."idx_escrow_metadata_hash"`);
        await queryRunner.query(`DROP TABLE "core"."escrow"`);
        await queryRunner.query(`DROP INDEX "core"."idx_payment_intent_integration_currency_status"`);
        await queryRunner.query(`DROP TABLE "core"."payment_intent"`);
        await queryRunner.query(`DROP TABLE "core"."integration_currency"`);
        await queryRunner.query(`DROP TABLE "core"."account"`);
        await queryRunner.query(`DROP INDEX "core"."idx_payout_intent_status"`);
        await queryRunner.query(`DROP TABLE "core"."payout_intent"`);
        await queryRunner.query(`DROP INDEX "core"."idx_integration_account_link_integration_account_id_status"`);
        await queryRunner.query(`DROP INDEX "core"."idx_integration_account_link_platform_account_id"`);
        await queryRunner.query(`DROP TABLE "core"."integration_account_link"`);
        await queryRunner.query(`DROP INDEX "core"."idx_integration_account_integration_account"`);
        await queryRunner.query(`DROP INDEX "core"."idx_integration_account_integration_currency_status"`);
        await queryRunner.query(`DROP TABLE "core"."integration_account"`);
    }

}
