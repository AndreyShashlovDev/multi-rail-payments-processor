# Data Examples — Payout + Payment Flow

> This document shows **real database state** after a complete payout → payment cycle.
> All numeric enum values are replaced with human-readable names for clarity.

---

## Scenario

A user (`42cf2c08`) initiates a **payout of 5 ETH** from the platform hot wallet (`0x1`) to an external address (`0x2`).
The system also detects this as an **incoming payment** for another user (`6093e1f8`) who is waiting for funds on `0x2`.

**Participants:**

| Role | Platform Account | Integration Account |
|------|-----------------|-------------------|
| Payout initiator (sender) | `42cf2c08-fe39-4933-b3ee-2ed547be9e08` | — |
| Platform hot wallet (source) | `cf0104f7-8df8-4b4c-b456-cf165bd7d158` | `0x1` |
| Payment receiver | `6093e1f8-c64c-48b8-9751-e0be36f400cd` | `0x2` |

**Amounts:**

| Item | Amount | Currency |
|------|--------|----------|
| Transfer amount | 5.0 | ETH (native) |
| Estimated integration fee | 0.2 | ETH |
| Actual integration fee | 0.1 | ETH |
| Platform fee (payment) | 0.1 | ETH |
| Platform fee (payout) | 0.1 | ETH |

---

## Flow Timeline

```
t0  Fixtures: MANUAL_CORRECTION credits to platform accounts
t1  User creates payout → PayoutIntent CREATED
t2  User creates payment → PaymentIntent CREATED
t3  EIS builds transaction → Transaction PREPARED
    Pipeline: PREPARED → holds placed → PayoutIntent HELD
t4  EIS signs + promotes → Transaction PROMOTED
    Pipeline: PROMOTED → PayoutIntent PROCESSING
t5  Transaction accepted on-chain → Transaction ACCEPTED
    Pipeline: ACCEPTED → PayoutIntent CONFIRMING, PaymentIntent CONFIRMING
    Payment: HOLD_IN placed (incoming hold)
t6  Transaction confirmed on-chain → Transaction CONFIRMED
    Pipeline: CONFIRMED →
      Payout: RELEASE_HOLD + DEBIT + PLATFORM_FEE_ACCRUED → PayoutIntent SUCCESS
      Payment: RELEASE_HOLD_IN + CREDIT + PLATFORM_FEE_ACCRUED → PaymentIntent COMPLETED
```

---

## 1. Payout Intent

Service: **Core** · Schema: `core` · Table: `payout_intent`

<details>
<summary>payout_intent (1 record)</summary>

```json
[
  {
    "id": "b6ab9111-bbf5-484d-bea4-f9e4b4b8895c",
    "operation_type": "USER_REQUEST",
    "status": "SUCCESS",
    "initiator_account_id": "42cf2c08-fe39-4933-b3ee-2ed547be9e08",
    "initiator_user_id": "6cd9b891-acf3-4a63-b28c-7c6bc48483e5",
    "from_integration_account": "0x1",
    "from_platform_account": "cf0104f7-8df8-4b4c-b456-cf165bd7d158",
    "from_id": 1,
    "from_amount": "5.0",
    "from_currency": "native",
    "from_integration": "ETHEREUM",
    "to_integration_account": "0x2",
    "to_platform_account": null,
    "to_id": 2,
    "to_amount": "5.0",
    "to_currency": "native",
    "to_integration": "ETHEREUM",
    "estimated_fee": "0.2",
    "estimated_fee_currency": "native",
    "integration_fee": "0.1",
    "integration_fee_currency": "native",
    "integration_fee_rate": "1.0",
    "integration_fee_payer_integration_account": "0x1",
    "integration_fee_payer_platform_account": "cf0104f7-8df8-4b4c-b456-cf165bd7d158",
    "integration_fee_payer_id": 1,
    "platform_fee": "0.1",
    "platform_fee_integration_account": "0x1",
    "platform_fee_platform_account": "cf0104f7-8df8-4b4c-b456-cf165bd7d158",
    "platform_fee_account_id": 1,
    "exchange_rate": "1.0",
    "metadata": null,
    "created_at": "2026-03-21T15:35:48.200Z",
    "updated_at": "2026-03-21T15:36:00.403Z"
  }
]
```

</details>

**Key points:**
- `operation_type = USER_REQUEST` — standard user-initiated payout. Would be `CONSOLIDATION` for system-initiated fee sweeps.
- `from` = platform hot wallet (`0x1`, account `cf0104f7`). This is where funds leave from on-chain.
- `to` = destination address (`0x2`). Receiver of the transfer.
- `estimated_fee` (0.2) > actual `integration_fee` (0.1) — sender is charged `min(estimated, actual)` = 0.1, the rest is refunded during CONFIRMED.
- **Sender pays**: transfer amount (5.0) + platform fee (0.1) + integration fee compensation (0.1) = 5.2 total debited from platform obligations.
- **Hot wallet pays**: actual gas on-chain (0.1) — debited from integration account balance.
- Status progression: `CREATED → PREPARED → HELD → PROCESSING → CONFIRMING → SUCCESS`

---

## 2. Payment Intent

Service: **Core** · Schema: `core` · Table: `payment_intent`

<details>
<summary>payment_intent (1 record)</summary>

```json
[
  {
    "id": "f05d4900-97ae-485b-9068-00d3d58860a7",
    "operation_type": "USER_REQUEST",
    "status": "COMPLETED",
    "initiator_account_id": "6093e1f8-c64c-48b8-9751-e0be36f400cd",
    "initiator_user_id": "ea5bad60-80c2-4abf-ad13-66a4dbf8409d",
    "to_integration_account": "0x2",
    "to_platform_account": "6093e1f8-c64c-48b8-9751-e0be36f400cd",
    "to_id": 2,
    "from_platform_account_id": null,
    "from_integration_account": null,
    "integration": "ETHEREUM",
    "amount": "5.0",
    "paid": "0.0",
    "currency": "native",
    "platform_fee": "0.1",
    "platform_fee_platform_account_id": "cf0104f7-8df8-4b4c-b456-cf165bd7d158",
    "platform_fee_integration_account": "0x1",
    "platform_fee_account_id": 1,
    "platform_fee_payer": "CLIENT",
    "metadata": null,
    "created_at": "2026-03-21T15:35:48.153Z",
    "updated_at": "2026-03-21T15:36:00.403Z"
  }
]
```

</details>

**Key points:**
- `operation_type = USER_REQUEST` — standard user-initiated payment. Would be `CONSOLIDATION` for system-initiated fee sweeps.
- `to` = the deposit address (`0x2`) assigned to user `6093e1f8`.
- `from` is null — for incoming payments, the sender is external (unknown until the transaction arrives).
- `platform_fee_payer = CLIENT` — the platform fee (0.1 ETH) is deducted from the receiver's credited amount.
- Status progression: `CREATED → CONFIRMING → COMPLETED`

---

## 3. Transaction & Transfer

Service: **External Integration** · Schema: `external_integration` · Tables: `transaction`, `transfer`

<details>
<summary>transaction (1 record)</summary>

```json
[
  {
    "id": 1,
    "integration": "ETHEREUM",
    "source_tx_id": "0xa6444690168591d481f309e620bea50ea3bb2080",
    "block_id": "33",
    "block_time": "2026-03-21T18:36:00.000Z",
    "status": "CONFIRMED",
    "fee": "100000000000000000",
    "fee_currency": "native",
    "metadata": {
      "ver": 1,
      "txFee": "100000000000000000",
      "gasUsed": "0x0",
      "txIndex": 33,
      "gasPrice": "0x0",
      "blockHash": "85b101384006bfcec93fff314bba192644cee1d981dca93e72f6efaa9fa3d174"
    },
    "created_at": "2026-03-21T15:35:50.025Z",
    "updated_at": "2026-03-21T15:36:00.009Z"
  }
]
```

</details>

<details>
<summary>transfer (1 record)</summary>

```json
[
  {
    "id": 1,
    "transaction_id": 1,
    "index": 0,
    "integration": "ETHEREUM",
    "operation": "NATIVE_TRANSFER",
    "initiator": "0x1",
    "from": "0x1",
    "to": "0x2",
    "from_owner": "0x1",
    "to_owner": "0x2",
    "currency": "native",
    "amount_raw": "5000000000000000000",
    "transfer_intent_id": 1,
    "metadata": null,
    "created_at": "2026-03-21T15:35:50.025Z",
    "updated_at": "2026-03-21T15:35:50.025Z"
  }
]
```

</details>

**Key points:**
- `fee` is in raw format (wei): `100000000000000000` = 0.1 ETH.
- `amount_raw` is also in wei: `5000000000000000000` = 5.0 ETH.
- One transaction → one transfer. In real scenarios a transaction can contain multiple transfers (e.g. token + native, batch payouts).
- `transfer_intent_id = 1` links back to the `TransferIntent` that initiated this on-chain transfer.
- Status progression: `PREPARED → PROMOTED → ACCEPTED → CONFIRMED`

---

## 4. Escrow

Service: **Core** · Schema: `core` · Table: `escrow`

Escrow is a live operational view of holds in the system. Records are created in response to ledger hold confirmation events (via JetStream) and reflect the current hold state from the ledger. It enables monitoring and decision-making: detecting stale holds that signal bugs or unresolved mispayments, and identifying accrued platform fees ready for consolidation. Resolved records are periodically cleaned up.

| # | type | amount | account | int_account | intent_type | intent_id | status | txStatus |
|---|------|--------|---------|-------------|-------------|-----------|--------|----------|
| 1 | AMOUNT | 5.0 | sender | 0x1 | PAYOUT | `b6ab9111` | RESOLVED | TX_PREPARED |
| 2 | FEE | 0.1 | sender | 0x1 | PAYOUT | `b6ab9111` | RESOLVED | TX_PREPARED |
| 3 | INTEGRATION_FEE | 0.2 | sender | 0x1 | PAYOUT | `b6ab9111` | RESOLVED | TX_PREPARED |
| 4 | INTEGRATION_FEE | 0.1 | hot wallet | 0x1 | PAYOUT | `b6ab9111` | RESOLVED | TX_PREPARED |
| 5 | AMOUNT | 5.0 | receiver | 0x2 | PAYMENT | `f05d4900` | RESOLVED | TX_ACCEPTED |
| 6 | PLATFORM_FEE_ACCRUED | 0.1 | — | 0x2 | PAYMENT | `f05d4900` | CREATED | TX_CONFIRMED |
| 7 | PLATFORM_FEE_ACCRUED | 0.1 | — | 0x1 | PAYOUT | `b6ab9111` | CREATED | TX_CONFIRMED |

<details>
<summary>Full JSON with metadata (7 records)</summary>

```json
[
  {
    "id": 1,
    "integration": "ETHEREUM",
    "platform_account_id": "42cf2c08-fe39-4933-b3ee-2ed547be9e08",
    "integration_account": "0x1",
    "amount": "5.0",
    "currency": "native",
    "type": "AMOUNT",
    "intent_type": "PAYOUT",
    "intent_id": "b6ab9111-bbf5-484d-bea4-f9e4b4b8895c",
    "status": "RESOLVED",
    "metadata": {"txId": "1", "reason": "AMOUNT", "txStatus": "TX_PREPARED", "transferIds": ["1"]},
    "metadata_hash": "1-1-PAYOUT-b6ab9111-bbf5-484d-bea4-f9e4b4b8895c"
  },
  {
    "id": 2,
    "integration": "ETHEREUM",
    "platform_account_id": "42cf2c08-fe39-4933-b3ee-2ed547be9e08",
    "integration_account": "0x1",
    "amount": "0.1",
    "currency": "native",
    "type": "FEE",
    "intent_type": "PAYOUT",
    "intent_id": "b6ab9111-bbf5-484d-bea4-f9e4b4b8895c",
    "status": "RESOLVED",
    "metadata": {"txId": "1", "reason": "FEE", "txStatus": "TX_PREPARED", "transferIds": ["1"]},
    "metadata_hash": "1-1-PAYOUT-b6ab9111-bbf5-484d-bea4-f9e4b4b8895c"
  },
  {
    "id": 3,
    "integration": "ETHEREUM",
    "platform_account_id": "42cf2c08-fe39-4933-b3ee-2ed547be9e08",
    "integration_account": "0x1",
    "amount": "0.2",
    "currency": "native",
    "type": "INTEGRATION_FEE",
    "intent_type": "PAYOUT",
    "intent_id": "b6ab9111-bbf5-484d-bea4-f9e4b4b8895c",
    "status": "RESOLVED",
    "metadata": {"txId": "1", "reason": "INTEGRATION_FEE", "txStatus": "TX_PREPARED", "transferIds": ["1"], "integrationFeeDiff": "0.1"},
    "metadata_hash": "1-1-PAYOUT-b6ab9111-bbf5-484d-bea4-f9e4b4b8895c"
  },
  {
    "id": 4,
    "integration": "ETHEREUM",
    "platform_account_id": "cf0104f7-8df8-4b4c-b456-cf165bd7d158",
    "integration_account": "0x1",
    "amount": "0.1",
    "currency": "native",
    "type": "INTEGRATION_FEE",
    "intent_type": "PAYOUT",
    "intent_id": "b6ab9111-bbf5-484d-bea4-f9e4b4b8895c",
    "status": "RESOLVED",
    "metadata": {"txId": "1", "reason": "INTEGRATION_FEE", "txStatus": "TX_PREPARED", "transferIds": ["1"], "integrationFeeDiff": "0.1"},
    "metadata_hash": "1-1-PAYOUT-b6ab9111-bbf5-484d-bea4-f9e4b4b8895c"
  },
  {
    "id": 5,
    "integration": "ETHEREUM",
    "platform_account_id": "6093e1f8-c64c-48b8-9751-e0be36f400cd",
    "integration_account": "0x2",
    "amount": "5.0",
    "currency": "native",
    "type": "AMOUNT",
    "intent_type": "PAYMENT",
    "intent_id": "f05d4900-97ae-485b-9068-00d3d58860a7",
    "status": "RESOLVED",
    "metadata": {"txId": "1", "reason": "AMOUNT", "txStatus": "TX_ACCEPTED", "transferIds": ["1"], "relatedIntentId": "b6ab9111-bbf5-484d-bea4-f9e4b4b8895c", "relatedIntentType": "PAYOUT"},
    "metadata_hash": "1-1-PAYMENT-f05d4900-97ae-485b-9068-00d3d58860a7"
  },
  {
    "id": 6,
    "integration": "ETHEREUM",
    "platform_account_id": null,
    "integration_account": "0x2",
    "amount": "0.1",
    "currency": "native",
    "type": "PLATFORM_FEE_ACCRUED",
    "intent_type": "PAYMENT",
    "intent_id": "f05d4900-97ae-485b-9068-00d3d58860a7",
    "status": "CREATED",
    "metadata": {"txId": "1", "reason": "PLATFORM_FEE_CONSOLIDATION", "txStatus": "TX_CONFIRMED", "transferIds": ["1"]},
    "metadata_hash": "1-1-PAYMENT-f05d4900-97ae-485b-9068-00d3d58860a7"
  },
  {
    "id": 7,
    "integration": "ETHEREUM",
    "platform_account_id": null,
    "integration_account": "0x1",
    "amount": "0.1",
    "currency": "native",
    "type": "PLATFORM_FEE_ACCRUED",
    "intent_type": "PAYOUT",
    "intent_id": "b6ab9111-bbf5-484d-bea4-f9e4b4b8895c",
    "status": "CREATED",
    "metadata": {"txId": "1", "reason": "PLATFORM_FEE_CONSOLIDATION", "txStatus": "TX_CONFIRMED", "transferIds": ["1"]},
    "metadata_hash": "1-1-PAYOUT-b6ab9111-bbf5-484d-bea4-f9e4b4b8895c"
  }
]
```

</details>

**Key points:**
- Records 1–4 (PAYOUT): holds placed at `TX_PREPARED`, all `RESOLVED` after confirmation.
    - id=3: `INTEGRATION_FEE` hold of 0.2 (estimated), but actual fee was 0.1 → `integrationFeeDiff: "0.1"` means estimated exceeded actual by 0.1 (refunded on CONFIRMED).
    - id=4: separate `INTEGRATION_FEE` record for the hot wallet account (`cf0104f7`) — fee payer.
- Record 5 (PAYMENT): `AMOUNT` hold placed at `TX_ACCEPTED`, `RESOLVED` after confirmation.
- Records 6–7: `PLATFORM_FEE_ACCRUED` — still `CREATED`, not yet resolved. They represent accrued platform fees waiting for consolidation. A separate payout intent with `operation_type = CONSOLIDATION` will sweep these fees to the platform treasury, at which point these records transition to `RESOLVED`.
- `metadata_hash` ensures idempotency — same event won't create duplicate escrow records.

---

## 5. Ledger — Platform Account Event Store

Service: **Ledger** · Schema: `ledger` · Table: `platform_account_es`

This is the **event sourcing log for platform accounts** (users, merchants). It tracks **platform obligations** — how much the platform owes to each account holder. This is a bookkeeping layer: when the sender's balance decreases, the platform's debt to that user decreases.

Each row is an immutable event. The `available`, `hold`, `hold_in` columns show the account state **after** this event was applied.

Account aliases: **sender** = `42cf2c08`, **hot wallet** = `cf0104f7`, **receiver** = `6093e1f8`

### t0 — Fixtures (seed balances)

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 1 | hot wallet | CREDIT | 50.0 | 50.0 | 0.0 | 0.0 | — | — | — | MANUAL_CORRECTION |
| 2 | sender | CREDIT | 20.0 | 20.0 | 0.0 | 0.0 | — | — | — | MANUAL_CORRECTION |

### t3 — PREPARED (payout holds)

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 3 | sender | HOLD | 5.0 | 15.0 | 5.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | AMOUNT |
| 4 | sender | HOLD | 0.1 | 14.9 | 5.1 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | FEE |
| 5 | sender | HOLD | 0.2 | 14.7 | 5.3 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 6 | hot wallet | HOLD | 0.1 | 49.9 | 0.1 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |

### t5 — ACCEPTED (incoming payment hold)

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 7 | receiver | HOLD_IN | 5.0 | 0.0 | 0.0 | 5.0 | PAYMENT | USER_REQUEST | `f05d4900` | AMOUNT |

### t6 — CONFIRMED (release holds + final debits/credits)

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 8 | sender | RELEASE_HOLD | 5.0 | 19.7 | 0.3 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | AMOUNT |
| 9 | sender | RELEASE_HOLD | 0.1 | 19.8 | 0.2 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | FEE |
| 10 | sender | RELEASE_HOLD | 0.2 | 20.0 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 11 | hot wallet | RELEASE_HOLD | 0.1 | 50.0 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 12 | receiver | RELEASE_HOLD_IN | 5.0 | 0.0 | 0.0 | 0.0 | PAYMENT | USER_REQUEST | `f05d4900` | AMOUNT |
| 13 | receiver | CREDIT | 5.0 | 5.0 | 0.0 | 0.0 | PAYMENT | USER_REQUEST | `f05d4900` | AMOUNT |
| 14 | receiver | DEBIT | 0.1 | 4.9 | 0.0 | 0.0 | PAYMENT | USER_REQUEST | `f05d4900` | FEE |
| 15 | sender | DEBIT | 5.0 | 15.0 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | AMOUNT |
| 16 | sender | DEBIT | 0.1 | 14.9 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | FEE |
| 17 | sender | DEBIT | 0.1 | 14.8 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 18 | hot wallet | DEBIT | 0.1 | 49.9 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |

<details>
<summary>Full JSON with metadata (18 events)</summary>

```json
[
  {"id":1, "account_id":"cf0104f7", "change_type":"CREDIT", "amount":"50.0", "available_after":"50.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":null, "intent_type":null, "intent_operation_type":null, "metadata":{"reason":"MANUAL_CORRECTION"}},
  {"id":2, "account_id":"42cf2c08", "change_type":"CREDIT", "amount":"20.0", "available_after":"20.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":null, "intent_type":null, "intent_operation_type":null, "metadata":{"reason":"MANUAL_CORRECTION"}},
  {"id":3, "account_id":"42cf2c08", "change_type":"HOLD", "amount":"5.0", "available_after":"15.0", "hold_after":"5.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_PREPARED", "transferIds":["1"]}},
  {"id":4, "account_id":"42cf2c08", "change_type":"HOLD", "amount":"0.1", "available_after":"14.9", "hold_after":"5.1", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"FEE", "txStatus":"TX_PREPARED", "transferIds":["1"]}},
  {"id":5, "account_id":"42cf2c08", "change_type":"HOLD", "amount":"0.2", "available_after":"14.7", "hold_after":"5.3", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_PREPARED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":6, "account_id":"cf0104f7", "change_type":"HOLD", "amount":"0.1", "available_after":"49.9", "hold_after":"0.1", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_PREPARED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":7, "account_id":"6093e1f8", "change_type":"HOLD_IN", "amount":"5.0", "available_after":"0.0", "hold_after":"0.0", "hold_in_after":"5.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_ACCEPTED", "transferIds":["1"], "relatedIntentId":"b6ab9111", "relatedIntentType":"PAYOUT"}},
  {"id":8, "account_id":"42cf2c08", "change_type":"RELEASE_HOLD", "amount":"5.0", "available_after":"19.7", "hold_after":"0.3", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":9, "account_id":"42cf2c08", "change_type":"RELEASE_HOLD", "amount":"0.1", "available_after":"19.8", "hold_after":"0.2", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":10, "account_id":"42cf2c08", "change_type":"RELEASE_HOLD", "amount":"0.2", "available_after":"20.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":11, "account_id":"cf0104f7", "change_type":"RELEASE_HOLD", "amount":"0.1", "available_after":"50.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":12, "account_id":"6093e1f8", "change_type":"RELEASE_HOLD_IN", "amount":"5.0", "available_after":"0.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "relatedIntentId":"b6ab9111", "relatedIntentType":"PAYOUT"}},
  {"id":13, "account_id":"6093e1f8", "change_type":"CREDIT", "amount":"5.0", "available_after":"5.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "relatedIntentId":"b6ab9111", "relatedIntentType":"PAYOUT"}},
  {"id":14, "account_id":"6093e1f8", "change_type":"DEBIT", "amount":"0.1", "available_after":"4.9", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":15, "account_id":"42cf2c08", "change_type":"DEBIT", "amount":"5.0", "available_after":"15.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":16, "account_id":"42cf2c08", "change_type":"DEBIT", "amount":"0.1", "available_after":"14.9", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":17, "account_id":"42cf2c08", "change_type":"DEBIT", "amount":"0.1", "available_after":"14.8", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":18, "account_id":"cf0104f7", "change_type":"DEBIT", "amount":"0.1", "available_after":"49.9", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "integrationFeeDiff":"0.1"}}
]
```

</details>

---

## 6. Ledger — Platform Account Projection

Service: **Ledger** · Schema: `ledger` · Table: `platform_account_projection`

This is the **materialized current state** — rebuilt from the event store above.

| account_id | role | available | hold | hold_in |
|------------|------|-----------|------|---------|
| `cf0104f7` | Hot wallet | 49.9 | 0.0 | 0.0 |
| `42cf2c08` | Sender | 14.8 | 0.0 | 0.0 |
| `6093e1f8` | Receiver | 4.9 | 0.0 | 0.0 |

---

## 7. Ledger — Integration Account Event Store

Service: **Ledger** · Schema: `ledger` · Table: `integration_account_es`

Same event sourcing pattern, but tracks **on-chain reality** — actual balances on blockchain addresses. While platform account ES records obligations ("how much do we owe the user?"), integration account ES records what's actually sitting in wallets on-chain. Multiple platform accounts can share one integration account (e.g., `0x1` holds funds of both the sender and the hot wallet — their combined balance is 70 ETH).

**Why two event stores?** A single on-chain address (`0x1`) may hold funds belonging to different platform accounts. The platform account ES breaks this down per user; the integration account ES shows the aggregate per address. Both are needed: platform ES for user-facing balances, integration ES for on-chain reconciliation.

Account aliases: **0x1** = hot wallet (holds sender + platform funds), **0x2** = receiver deposit address

### t0 — Fixtures

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 1 | 0x1 | CREDIT | 50.0 | 50.0 | 0.0 | 0.0 | — | — | — | MANUAL_CORRECTION |
| 2 | 0x1 | CREDIT | 20.0 | 70.0 | 0.0 | 0.0 | — | — | — | MANUAL_CORRECTION |

### t3 — PREPARED (payout holds)

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 3 | 0x1 | HOLD | 5.0 | 65.0 | 5.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | AMOUNT |
| 4 | 0x1 | HOLD | 0.1 | 64.9 | 5.1 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | FEE |
| 5 | 0x1 | HOLD | 0.2 | 64.7 | 5.3 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 6 | 0x1 | HOLD | 0.1 | 64.6 | 5.4 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |

### t5 — ACCEPTED (incoming payment hold)

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 7 | 0x2 | HOLD_IN | 5.0 | 0.0 | 0.0 | 5.0 | PAYMENT | USER_REQUEST | `f05d4900` | AMOUNT |

### t6 — CONFIRMED (release holds + final debits/credits + fee accrual)

| # | account | change_type | amount | available | hold | hold_in | intent_type | intent_operation_type | intent_id | reason |
|---|---------|-------------|--------|-----------|------|---------|-------------|----------------------|-----------|--------|
| 8 | 0x1 | RELEASE_HOLD | 5.0 | 69.6 | 0.4 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | AMOUNT |
| 9 | 0x1 | RELEASE_HOLD | 0.1 | 69.7 | 0.3 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | FEE |
| 10 | 0x1 | RELEASE_HOLD | 0.2 | 69.9 | 0.1 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 11 | 0x1 | RELEASE_HOLD | 0.1 | 70.0 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 12 | 0x2 | RELEASE_HOLD_IN | 5.0 | 0.0 | 0.0 | 0.0 | PAYMENT | USER_REQUEST | `f05d4900` | AMOUNT |
| 13 | 0x2 | CREDIT | 5.0 | 5.0 | 0.0 | 0.0 | PAYMENT | USER_REQUEST | `f05d4900` | AMOUNT |
| 14 | 0x1 | DEBIT | 5.0 | 65.0 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | AMOUNT |
| 15 | 0x1 | DEBIT | 0.1 | 64.9 | 0.0 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | INTEGRATION_FEE |
| 16 | 0x2 | PLATFORM_FEE_ACCRUED | 0.1 | 4.9 | 0.1 | 0.0 | PAYMENT | USER_REQUEST | `f05d4900` | PLATFORM_FEE_CONSOLIDATION |
| 17 | 0x1 | PLATFORM_FEE_ACCRUED | 0.1 | 64.8 | 0.1 | 0.0 | PAYOUT | USER_REQUEST | `b6ab9111` | PLATFORM_FEE_CONSOLIDATION |

> `PLATFORM_FEE_ACCRUED` (events 16–17) creates a `hold` on the integration account, not a `debit`. The fee is earned but not yet collected — it still sits on-chain in `0x1`/`0x2`. A separate **consolidation sweep** process will later create a payout intent with `operation_type = CONSOLIDATION` to transfer these fees to the platform treasury address, at which point the escrow records (id 6–7) transition from `CREATED` → `RESOLVED` and the hold becomes a debit.

<details>
<summary>Full JSON with metadata (17 events)</summary>

```json
[
  {"id":1, "account":"0x1", "change_type":"CREDIT", "amount":"50.0", "available_after":"50.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":null, "intent_type":null, "intent_operation_type":null, "metadata":{"reason":"MANUAL_CORRECTION"}},
  {"id":2, "account":"0x1", "change_type":"CREDIT", "amount":"20.0", "available_after":"70.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":null, "intent_type":null, "intent_operation_type":null, "metadata":{"reason":"MANUAL_CORRECTION"}},
  {"id":3, "account":"0x1", "change_type":"HOLD", "amount":"5.0", "available_after":"65.0", "hold_after":"5.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_PREPARED", "transferIds":["1"]}},
  {"id":4, "account":"0x1", "change_type":"HOLD", "amount":"0.1", "available_after":"64.9", "hold_after":"5.1", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"FEE", "txStatus":"TX_PREPARED", "transferIds":["1"]}},
  {"id":5, "account":"0x1", "change_type":"HOLD", "amount":"0.2", "available_after":"64.7", "hold_after":"5.3", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_PREPARED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":6, "account":"0x1", "change_type":"HOLD", "amount":"0.1", "available_after":"64.6", "hold_after":"5.4", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_PREPARED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":7, "account":"0x2", "change_type":"HOLD_IN", "amount":"5.0", "available_after":"0.0", "hold_after":"0.0", "hold_in_after":"5.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_ACCEPTED", "transferIds":["1"], "relatedIntentId":"b6ab9111", "relatedIntentType":"PAYOUT"}},
  {"id":8, "account":"0x1", "change_type":"RELEASE_HOLD", "amount":"5.0", "available_after":"69.6", "hold_after":"0.4", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":9, "account":"0x1", "change_type":"RELEASE_HOLD", "amount":"0.1", "available_after":"69.7", "hold_after":"0.3", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":10, "account":"0x1", "change_type":"RELEASE_HOLD", "amount":"0.2", "available_after":"69.9", "hold_after":"0.1", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":11, "account":"0x1", "change_type":"RELEASE_HOLD", "amount":"0.1", "available_after":"70.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":12, "account":"0x2", "change_type":"RELEASE_HOLD_IN", "amount":"5.0", "available_after":"0.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "relatedIntentId":"b6ab9111", "relatedIntentType":"PAYOUT"}},
  {"id":13, "account":"0x2", "change_type":"CREDIT", "amount":"5.0", "available_after":"5.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "relatedIntentId":"b6ab9111", "relatedIntentType":"PAYOUT"}},
  {"id":14, "account":"0x1", "change_type":"DEBIT", "amount":"5.0", "available_after":"65.0", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"AMOUNT", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":15, "account":"0x1", "change_type":"DEBIT", "amount":"0.1", "available_after":"64.9", "hold_after":"0.0", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"INTEGRATION_FEE", "txStatus":"TX_CONFIRMED", "transferIds":["1"], "integrationFeeDiff":"0.1"}},
  {"id":16, "account":"0x2", "change_type":"PLATFORM_FEE_ACCRUED", "amount":"0.1", "available_after":"4.9", "hold_after":"0.1", "hold_in_after":"0.0", "intent_id":"f05d4900", "intent_type":"PAYMENT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"PLATFORM_FEE_CONSOLIDATION", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}},
  {"id":17, "account":"0x1", "change_type":"PLATFORM_FEE_ACCRUED", "amount":"0.1", "available_after":"64.8", "hold_after":"0.1", "hold_in_after":"0.0", "intent_id":"b6ab9111", "intent_type":"PAYOUT", "intent_operation_type":"USER_REQUEST", "metadata":{"txId":"1", "reason":"PLATFORM_FEE_CONSOLIDATION", "txStatus":"TX_CONFIRMED", "transferIds":["1"]}}
]
```

</details>

---

## 8. Ledger — Integration Account Projection

Service: **Ledger** · Schema: `ledger` · Table: `integration_account_projection`

| account | available | hold | hold_in | note |
|---------|-----------|------|---------|------|
| `0x1` | 64.8 | 0.1 | 0.0 | 70.0 − 5.0 (payout) − 0.1 (integration fee) − 0.1 (platform fee held) |
| `0x2` | 4.9 | 0.1 | 0.0 | 5.0 received − 0.1 (platform fee held) |

---

## 9. Reference — intent_operation_type

`intent_operation_type` indicates the business purpose behind the intent that triggered a balance change. It is stored as a column on both ES tables (`platform_account_es`, `integration_account_es`) alongside `intent_type` and `intent_id`.

| Value | Description |
|-------|-------------|
| `USER_REQUEST` | Standard user-initiated payment or payout |
| `CONSOLIDATION` | System-initiated sweep of accrued platform fees to treasury |

**Enum definitions:**

```typescript
export enum PaymentOperationEntityType {
  USER_REQUEST = 1,
  CONSOLIDATION = 2,
}

export enum PayoutOperationEntityType {
  USER_REQUEST = 1,
  CONSOLIDATION = 2,
}

export enum BalanceChangeOperationType {
  USER_REQUEST = 'USER_REQUEST',
  CONSOLIDATION = 'CONSOLIDATION',
}
```

**Mapping:** `PaymentOperationEntityType` / `PayoutOperationEntityType` → `BalanceChangeOperationType` via `OperationTypeMapper.toBalanceChange()` before writing to the ledger ES.

**In this example** all events carry `USER_REQUEST` — standard user-initiated payout and payment.

`CONSOLIDATION` appears when the escrow records (id 6–7, `PLATFORM_FEE_ACCRUED`) are swept: a payout intent is created with `operation_type = CONSOLIDATION` to move the accrued fees from `0x1`/`0x2` to the platform treasury. At that point the escrow records transition `CREATED → RESOLVED` and the `PLATFORM_FEE_ACCRUED` hold becomes a debit.

---

## Balance Verification

After the full cycle, we can verify that **no money was created or lost**:

### Platform Accounts (obligations)

| Account | Before | After | Δ |
|---------|--------|-------|---|
| Sender `42cf2c08` | 20.0 | 14.8 | **-5.2** (5.0 amount + 0.1 platform fee + 0.1 integration fee) |
| Hot wallet `cf0104f7` | 50.0 | 49.9 | **-0.1** (integration fee portion) |
| Receiver `6093e1f8` | 0.0 | 4.9 | **+4.9** (5.0 received - 0.1 platform fee) |

**Sum of changes**: -5.2 - 0.1 + 4.9 = **-0.4**
**Platform fees collected**: 0.1 (from payment receiver) + 0.1 (from payout sender) = **+0.2** (accrued on integration accounts, awaiting consolidation sweep)
**Integration fee**: sender compensated 0.1 (debited from platform account) + hot wallet paid 0.1 actual gas (debited from integration account) = **+0.2**
**Balance**: -0.4 + 0.2 + 0.2 = **0.0** ✓

### Integration Accounts (on-chain reality)

| Account | Before | After (available) | Hold | Total |
|---------|--------|-------------------|------|-------|
| `0x1` | 70.0 | 64.8 | 0.1 | 64.9 |
| `0x2` | 0.0 | 4.9 | 0.1 | 5.0 |

**On-chain**: 0x1 sent 5.0 ETH + 0.1 fee = 64.9 remains. 0x2 received 5.0. Total: 69.9 (70.0 - 0.1 actual tx fee). ✓