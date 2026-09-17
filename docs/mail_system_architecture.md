# Kapate OS — Internal Business Email Architecture Specification

This document details the normalized data model, security boundaries, and infrastructure integration roadmap for the **Kapate OS Internal Business Email System**.

---

## 1. High-Level System Architecture

```
                                ┌────────────────────────────────────────┐
                                │             Kapate OS UI               │
                                │   (Next.js 16, App Router, React 19)   │
                                └──────────────────┬─────────────────────┘
                                                   │
                                          REST / WebSocket
                                                   ▼
                                ┌────────────────────────────────────────┐
                                │         FastAPI Mail Service           │
                                │     (Auth, Quotas, Spam Filters)       │
                                └───────┬────────────────────────┬───────┘
                                        │                        │
                    Internal Delivery   │                        │ External Routing
                                        ▼                        ▼
     ┌────────────────────────────────────┐    ┌────────────────────────────────────┐
     │      PostgreSQL / SQLite DB        │    │    External Email Provider Layer   │
     │  Normalized Message & Thread Store │    │     (Amazon SES, Postmark, SMTP)   │
     └────────────────────────────────────┘    └────────────────────────────────────┘
```

---

## 2. Normalized Database Entities (Relational Schema)

### `email_accounts`
Stores personal and shared department identities.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `user_id` | `VARCHAR(36)` | `NULLABLE, FK -> users.id` | Associated employee/admin |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | e.g. `shon@kapateconsultancy.com` |
| `display_name`| `VARCHAR(255)` | `NOT NULL` | Full employee or department title |
| `department` | `VARCHAR(100)` | `NOT NULL` | `Engineering`, `HR`, `Executive`, etc. |
| `is_shared` | `BOOLEAN` | `DEFAULT FALSE` | True for `hr@`, `finance@`, `sales@` |
| `quota_used_mb`| `INTEGER` | `DEFAULT 0` | Current storage consumption |
| `quota_total_mb`| `INTEGER` | `DEFAULT 10240` | Default 10 GB quota cap |

### `email_threads`
Groups messages into conversations.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `subject` | `VARCHAR(500)` | `NOT NULL` | Base thread subject |
| `related_project_id`| `VARCHAR(36)` | `NULLABLE, FK -> projects.id` | Associated delivery workspace |
| `related_deal_id` | `VARCHAR(36)` | `NULLABLE, FK -> deals.id` | Associated CRM pipeline deal |
| `is_starred` | `BOOLEAN` | `DEFAULT FALSE` | User favorite marker |
| `is_important` | `BOOLEAN` | `DEFAULT FALSE` | High-priority flag |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Thread inception time |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | Latest activity timestamp |

### `emails`
Individual message records.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `thread_id` | `VARCHAR(36)` | `FK -> email_threads.id` | Parent conversation |
| `from_email`| `VARCHAR(255)` | `NOT NULL` | Sender address |
| `subject` | `VARCHAR(500)` | `NOT NULL` | Message subject |
| `body_html` | `TEXT` | `NOT NULL` | Formatted message body |
| `body_text` | `TEXT` | `NOT NULL` | Plaintext index for semantic search |
| `folder` | `VARCHAR(20)` | `NOT NULL` | `INBOX`, `SENT`, `DRAFTS`, `TRASH` |
| `priority` | `VARCHAR(20)` | `DEFAULT 'Normal'` | `Normal`, `Important`, `Urgent` |
| `is_read` | `BOOLEAN` | `DEFAULT FALSE` | Read state flag |

### `email_recipients`
Normalized recipient mapping (To, Cc, Bcc).
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `email_id` | `VARCHAR(36)` | `FK -> emails.id` | Target message |
| `recipient_type` | `VARCHAR(10)` | `NOT NULL` | `TO`, `CC`, `BCC` |
| `email_address` | `VARCHAR(255)` | `NOT NULL` | Recipient address |
| `display_name` | `VARCHAR(255)` | `NOT NULL` | Recipient name |

### `email_attachments`
Uploaded documents and assets with tokenized secure URLs.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `email_id` | `VARCHAR(36)` | `FK -> emails.id` | Associated message |
| `filename` | `VARCHAR(255)` | `NOT NULL` | Original filename |
| `file_size_bytes` | `BIGINT` | `NOT NULL` | Byte size |
| `mime_type` | `VARCHAR(100)` | `NOT NULL` | File MIME type |
| `storage_key`| `VARCHAR(500)` | `NOT NULL` | S3 / Local encrypted blob path |

---

## 3. Real Email Infrastructure Adapter Roadmap

To connect live production mail infrastructure:

1. **Outbound Provider Interface (`MailTransportInterface`)**:
   - `send_message(payload: OutboundMessageSchema) -> DeliveryReceipt`
   - Implementations:
     - `AmazonSESAdapter` (AWS SES API v2)
     - `PostmarkAdapter` (High-reputation transactional delivery)
     - `SMTPAdapter` (Generic TLS on port 587)
     - `SimulatedDevAdapter` (Local simulation for demo & testing)

2. **Inbound Webhook Processor**:
   - Webhook receiver at `/api/v1/mail/inbound` parsing MIME multipart payloads from SES SNS topics or SendGrid Inbound Parse.
   - Extracts SPF, DKIM, DMARC validation headers before insertion into database.

3. **External Domain DNS Records**:
   - `MX`: `10 feedback-smtp.ap-south-1.amazonses.com`
   - `SPF`: `v=spf1 include:amazonses.com ~all`
   - `DKIM`: Custom CNAME records
   - `DMARC`: `v=DMARC1; p=quarantine; pct=100;`

---

## 4. Security & Privacy Guarantees

- **Client Portal Isolation**: Users assigned the `CLIENT` role are strictly prohibited from accessing internal mailbox routes or receiving internal mail payloads.
- **Admin Privilege Governance**: Administrators can manage accounts and storage quotas, but private employee mail content requires explicit audited warrant protocols.
- **Attachment Tokenization**: Files cannot be accessed by guessing sequential IDs; download requests require valid JWT session claims matching recipient or sender IDs.
