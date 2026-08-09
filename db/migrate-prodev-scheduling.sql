-- Apply on existing kos_dev databases that already ran the earlier schema.
-- Fresh installs only need db/schema.sql.

ALTER TABLE prodev_checklist_items ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE prodev_checklist_items ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS prodev_time_entries (
  id SERIAL PRIMARY KEY,
  checklist_item_id INTEGER NOT NULL REFERENCES prodev_checklist_items(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS prodev_time_entries_item ON prodev_time_entries(checklist_item_id);
CREATE INDEX IF NOT EXISTS prodev_time_entries_open ON prodev_time_entries(user_id, checklist_item_id) WHERE clock_out IS NULL;
