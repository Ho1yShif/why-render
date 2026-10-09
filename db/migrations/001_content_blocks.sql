CREATE TABLE content_blocks (
  key text PRIMARY KEY,
  html text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
