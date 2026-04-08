-- ============================================================
-- ThèsePro — Migrations Sprint 5
-- ============================================================

-- ============================================================
-- 1. BUGFIX: trigger update_profile_rating — SECURITY DEFINER
--    Sans SECURITY DEFINER, la mise à jour de profiles par un
--    client (via INSERT sur reviews) est bloquée par RLS car
--    auth.uid() ≠ freelance_id. Le trigger doit s'exécuter en
--    tant que son propriétaire (service role) pour contourner RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour avg_rating + total_reviews sur le profil freelance
  UPDATE profiles SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE freelance_id = NEW.freelance_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE freelance_id = NEW.freelance_id
    )
  WHERE id = NEW.freelance_id;

  -- Mettre à jour avg_rating sur le service
  UPDATE services SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger si besoin (idempotent)
DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- Recalculer les moyennes existantes (pour les avis déjà insérés)
UPDATE profiles p SET
  avg_rating = sub.avg,
  total_reviews = sub.cnt
FROM (
  SELECT
    freelance_id,
    ROUND(AVG(rating)::numeric, 2) AS avg,
    COUNT(*) AS cnt
  FROM reviews
  GROUP BY freelance_id
) sub
WHERE p.id = sub.freelance_id;

UPDATE services s SET
  avg_rating = sub.avg
FROM (
  SELECT service_id, ROUND(AVG(rating)::numeric, 2) AS avg
  FROM reviews
  GROUP BY service_id
) sub
WHERE s.id = sub.service_id;

-- ============================================================
-- 2. TABLE : withdrawal_requests (demandes de retrait)
-- ============================================================

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  freelance_id uuid           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount       integer        NOT NULL CHECK (amount >= 2000),  -- min 20 € (en centimes)
  iban         text,
  status       text           NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note   text,
  created_at   timestamptz    DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'wr_select_own' AND tablename = 'withdrawal_requests'
  ) THEN
    CREATE POLICY "wr_select_own" ON withdrawal_requests
      FOR SELECT USING (auth.uid() = freelance_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'wr_insert_own' AND tablename = 'withdrawal_requests'
  ) THEN
    CREATE POLICY "wr_insert_own" ON withdrawal_requests
      FOR INSERT WITH CHECK (auth.uid() = freelance_id);
  END IF;
END $$;

-- ============================================================
-- 3. INDEX sur withdrawal_requests
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wr_freelance_created
  ON withdrawal_requests(freelance_id, created_at DESC);
