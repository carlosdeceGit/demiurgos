-- Campos de gestión administrativa en profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'blocked', 'limited', 'suspended')),
  ADD COLUMN IF NOT EXISTS usage_limit integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS spend_limit numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS blocked_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS blocked_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz DEFAULT NULL;

-- Tabla de auditoría de acciones administrativas
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id text NOT NULL,
  admin_email text NOT NULL,
  target_user_id text NOT NULL,
  action_type text NOT NULL,
  previous_value jsonb DEFAULT NULL,
  new_value jsonb DEFAULT NULL,
  reason text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo accesible con service_role (createAdminClient)

CREATE INDEX IF NOT EXISTS admin_actions_target_idx ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS admin_actions_admin_idx ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);
