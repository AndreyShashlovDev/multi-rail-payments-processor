import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1779617782198 implements MigrationInterface {
  name = 'Migration1779617782198'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "external_integration"."transfer" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "transaction_id" bigint NOT NULL, "index" integer NOT NULL, "integration" smallint NOT NULL, "operation" smallint NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "from_owner" text, "to_owner" text, "currency" text NOT NULL, "amount_raw" text NOT NULL, "transfer_route_id" bigint, "transfer_intent_id" bigint, "metadata" jsonb, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transfer_transaction_id" ON "external_integration"."transfer" ("transaction_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."transaction_raw" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "transaction_id" bigint NOT NULL, "integration" smallint NOT NULL, "data" text NOT NULL, "transactionId" bigint, CONSTRAINT "UQ_9722e26363ed0544cac5e97054b" UNIQUE ("transaction_id"), CONSTRAINT "PK_1257bedf98d1fa4867fec3ca880" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."transaction" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "execution_type" smallint NOT NULL, "integration" smallint NOT NULL, "initiator" text NOT NULL, "source_tx_id" text NOT NULL, "block_id" text, "block_time" TIMESTAMP WITH TIME ZONE, "status" smallint NOT NULL, "metadata" jsonb, "fee" text, "fee_currency" text NOT NULL, CONSTRAINT "idx_unique_transaction_sourcetxid_integration" UNIQUE ("source_tx_id", "integration"), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."transfer_intent" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "intent_type" smallint NOT NULL, "intent_id" text NOT NULL, "estimated_raw_fee" text NOT NULL, "fee_currency" text NOT NULL, "from_account" text NOT NULL, "from_raw_amount" text NOT NULL, "from_currency" text NOT NULL, "from_integration" smallint NOT NULL, "to_account" text NOT NULL, "to_raw_amount" text NOT NULL, "to_currency" text NOT NULL, "to_integration" smallint NOT NULL, "status" smallint NOT NULL, "metadata" jsonb, CONSTRAINT "idx_unique_transfer_intent_intenttype_intentid" UNIQUE ("intent_type", "intent_id"), CONSTRAINT "PK_f72f801793b62aba3858f923bfd" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transfer_intent_status" ON "external_integration"."transfer_intent" ("status") `,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."transfer_route" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "tx_id" bigint, "transfer_intent_id" bigint NOT NULL, "intent_id" text NOT NULL, "tx_index" smallint NOT NULL, "execution_type" smallint NOT NULL, "integration" smallint NOT NULL, "from_account" text NOT NULL, "to_account" text NOT NULL, "raw_amount" numeric(60,30) NOT NULL, "currency" text NOT NULL, "status" smallint NOT NULL, "transaction_intent_id" bigint, CONSTRAINT "PK_transfer_route" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transfer_route_intent_id" ON "external_integration"."transfer_route" ("intent_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transfer_route_status" ON "external_integration"."transfer_route" ("status") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transfer_route_transaction_intent_id" ON "external_integration"."transfer_route" ("transaction_intent_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transfer_route_transfer_intent_id" ON "external_integration"."transfer_route" ("transfer_intent_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."transaction_intent" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "execution_type" smallint NOT NULL, "integration" smallint NOT NULL, "initiator" text NOT NULL, "source_tx_id" text NOT NULL, "status" smallint NOT NULL, "fee" text, "fee_currency" text NOT NULL, "raw_data" jsonb NOT NULL, "signed_data" text, "metadata" text, CONSTRAINT "idx_unique_transaction_intent_tx_id_integration" UNIQUE ("source_tx_id", "integration"), CONSTRAINT "PK_e0e3d75918a5f915864d612452b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transaction_intent_initiator_integration" ON "external_integration"."transaction_intent" ("initiator", "integration") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_transaction_intent_status" ON "external_integration"."transaction_intent" ("status") `,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."inbox" ("service_name" character varying NOT NULL, "idempotency_key" character varying NOT NULL, "data" text, CONSTRAINT "PK_45875d77b98fb32e13799702ac6" PRIMARY KEY ("service_name", "idempotency_key"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."outbox" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" text NOT NULL, "event" text NOT NULL, "payload" text NOT NULL, "status" smallint NOT NULL, "sent_at" TIMESTAMP WITH TIME ZONE, "processing_at" TIMESTAMP WITH TIME ZONE, "retries" smallint NOT NULL, CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_processing" ON "external_integration"."outbox" ("status", "processing_at") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_status_created_at" ON "external_integration"."outbox" ("status", "created_at") `,
    )
    await queryRunner.query(
      `CREATE TABLE "external_integration"."internal_block" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "integration" smallint NOT NULL, "block_number" bigint NOT NULL DEFAULT '0', CONSTRAINT "idx_unique_internal_block_internal_block" UNIQUE ("integration"), CONSTRAINT "PK_34e9bd3d632203a376159afe1e7" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "external_integration"."transfer" ADD CONSTRAINT "FK_fcd6254da86c093d217e6cf2429" FOREIGN KEY ("transaction_id") REFERENCES "external_integration"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "external_integration"."transfer_route" ADD CONSTRAINT "FK_4afef8c2d55a87e29aaa047f439" FOREIGN KEY ("transfer_intent_id") REFERENCES "external_integration"."transfer_intent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "external_integration"."transfer_route" ADD CONSTRAINT "FK_2acc3d79714026fc13fe6757284" FOREIGN KEY ("transaction_intent_id") REFERENCES "external_integration"."transaction_intent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "external_integration"."transfer_route" DROP CONSTRAINT "FK_2acc3d79714026fc13fe6757284"`,
    )
    await queryRunner.query(
      `ALTER TABLE "external_integration"."transfer_route" DROP CONSTRAINT "FK_4afef8c2d55a87e29aaa047f439"`,
    )
    await queryRunner.query(
      `ALTER TABLE "external_integration"."transfer" DROP CONSTRAINT "FK_fcd6254da86c093d217e6cf2429"`,
    )
    await queryRunner.query(`DROP TABLE "external_integration"."internal_block"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_outbox_status_created_at"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_outbox_processing"`)
    await queryRunner.query(`DROP TABLE "external_integration"."outbox"`)
    await queryRunner.query(`DROP TABLE "external_integration"."inbox"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transaction_intent_status"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transaction_intent_initiator_integration"`)
    await queryRunner.query(`DROP TABLE "external_integration"."transaction_intent"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transfer_route_transfer_intent_id"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transfer_route_transaction_intent_id"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transfer_route_status"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transfer_route_intent_id"`)
    await queryRunner.query(`DROP TABLE "external_integration"."transfer_route"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transfer_intent_status"`)
    await queryRunner.query(`DROP TABLE "external_integration"."transfer_intent"`)
    await queryRunner.query(`DROP TABLE "external_integration"."transaction"`)
    await queryRunner.query(`DROP TABLE "external_integration"."transaction_raw"`)
    await queryRunner.query(`DROP INDEX "external_integration"."idx_transfer_transaction_id"`)
    await queryRunner.query(`DROP TABLE "external_integration"."transfer"`)
  }
}
