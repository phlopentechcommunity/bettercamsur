ALTER TABLE reports ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS reports_owner_created_idx ON reports(owner_user_id,created_at DESC);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS severity varchar(20) NOT NULL DEFAULT 'NORMAL' CHECK(severity IN ('LOW','NORMAL','HIGH','URGENT'));
UPDATE reports SET severity=priority WHERE severity='NORMAL' AND priority<>'NORMAL';
CREATE TABLE IF NOT EXISTS problems(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference varchar(32) NOT NULL UNIQUE,title varchar(160) NOT NULL,description text,category varchar(60) NOT NULL,status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','MONITORING','RESOLVED','CLOSED')),province_id uuid REFERENCES provinces(id),municipality_id uuid REFERENCES municipalities(id),latitude double precision,longitude double precision,created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS problem_reports(problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,linked_by uuid REFERENCES app_users(id) ON DELETE SET NULL,linked_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(problem_id,report_id));
CREATE INDEX IF NOT EXISTS problem_reports_report_idx ON problem_reports(report_id);
CREATE INDEX IF NOT EXISTS problems_scope_status_idx ON problems(province_id,municipality_id,status);
