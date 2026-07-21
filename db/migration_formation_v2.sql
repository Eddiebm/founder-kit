-- Formation orders v2: Delaware-direct integration
-- Replaces Doola columns with DE SOS, Northwest RA, and IRS EIN tracking

ALTER TABLE formation_orders
  -- Registered agent
  ADD COLUMN IF NOT EXISTS northwest_order_id     TEXT,
  ADD COLUMN IF NOT EXISTS northwest_agent_name   TEXT DEFAULT 'Northwest Registered Agent, LLC',
  ADD COLUMN IF NOT EXISTS northwest_agent_address TEXT,

  -- Delaware SOS
  ADD COLUMN IF NOT EXISTS de_sos_filing_id       TEXT,
  ADD COLUMN IF NOT EXISTS de_sos_entity_number   TEXT,
  ADD COLUMN IF NOT EXISTS de_sos_submitted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS de_sos_approved_at     TIMESTAMPTZ,

  -- IRS EIN
  ADD COLUMN IF NOT EXISTS ein_application_id     TEXT,
  ADD COLUMN IF NOT EXISTS ein_number             TEXT,
  ADD COLUMN IF NOT EXISTS ein_applied_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ein_received_at        TIMESTAMPTZ,

  -- Generated document URLs (stored in R2 or similar)
  ADD COLUMN IF NOT EXISTS doc_articles_url       TEXT,
  ADD COLUMN IF NOT EXISTS doc_operating_url      TEXT,
  ADD COLUMN IF NOT EXISTS doc_ein_letter_url     TEXT,
  ADD COLUMN IF NOT EXISTS doc_ss4_url            TEXT,

  -- Error tracking
  ADD COLUMN IF NOT EXISTS last_error             TEXT,
  ADD COLUMN IF NOT EXISTS retry_count            INTEGER NOT NULL DEFAULT 0;

-- Indexes for webhook lookups
CREATE INDEX IF NOT EXISTS formation_orders_de_sos_filing_id
  ON formation_orders (de_sos_filing_id)
  WHERE de_sos_filing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS formation_orders_northwest_order_id
  ON formation_orders (northwest_order_id)
  WHERE northwest_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS formation_orders_ein_application_id
  ON formation_orders (ein_application_id)
  WHERE ein_application_id IS NOT NULL;

-- Status values (for reference):
-- pending_payment       → Stripe not yet paid
-- paid                  → payment captured, filing not yet started
-- ra_ordered            → Northwest RA order placed
-- filing_submitted      → DE SOS DECIS submission sent
-- filing_approved       → DE SOS approved, entity number assigned
-- ein_pending           → IRS SS-4 submitted
-- ein_received          → EIN assigned
-- documents_ready       → all docs generated and uploaded
-- complete              → everything done
-- failed                → unrecoverable error (see last_error)
