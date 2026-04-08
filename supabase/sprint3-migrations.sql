-- ============================================================
-- ThèsePro — Migrations Sprint 3 : Commandes & Paiements
-- À exécuter dans Supabase SQL Editor
--
-- IMPORTANT : Ce fichier suppose que schema.sql (Sprint 1) et
-- sprint2-migrations.sql (Sprint 2) ont déjà été exécutés.
-- La table `orders` et le type `order_status` existent déjà.
-- ============================================================


-- ============================================================
-- 1. Ajouter les nouvelles valeurs à l'enum order_status existant
--    Sprint 1 avait : pending, active, delivered, completed,
--                     disputed, cancelled, refunded
--    Sprint 3 ajoute : pending_payment, paid, in_progress,
--                      revision_requested
-- ============================================================
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'revision_requested';


-- ============================================================
-- 2. Renommer les colonnes mal nommées dans orders
--
--    price              → amount
--      (le code Sprint 3 stocke les centimes dans `amount`)
--    stripe_payment_intent → stripe_payment_intent_id
--      (le code utilise stripe_payment_intent_id partout)
--    requirements       → instructions
--      (le code utilise `instructions` pour le brief client)
-- ============================================================

-- 2a. price → amount
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'price'
  ) THEN
    ALTER TABLE orders RENAME COLUMN price TO amount;
  END IF;
END $$;

-- 2b. stripe_payment_intent → stripe_payment_intent_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent'
  ) THEN
    ALTER TABLE orders RENAME COLUMN stripe_payment_intent TO stripe_payment_intent_id;
  END IF;
END $$;

-- 2c. requirements → instructions
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE orders RENAME COLUMN requirements TO instructions;
  END IF;
END $$;


-- ============================================================
-- 3. Modifier commission_rate
--    Sprint 1 : numeric(4,2) DEFAULT 20.00  (pourcentage)
--    Sprint 3  : numeric(5,4) DEFAULT 0.20  (décimal)
--    Conversion des données existantes : 20.00 → 0.2000
-- ============================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'commission_rate'
      AND data_type = 'numeric'
      AND numeric_precision = 4
  ) THEN
    ALTER TABLE orders
      ALTER COLUMN commission_rate TYPE numeric(5,4)
        USING (commission_rate / 100);
    ALTER TABLE orders
      ALTER COLUMN commission_rate SET DEFAULT 0.20;
  END IF;
END $$;


-- ============================================================
-- 4. Ajouter les colonnes manquantes sur orders
-- ============================================================

-- Fichiers joints par le client
ALTER TABLE orders ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT '{}';

-- Fichier livré par le freelance
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_file_url TEXT;

-- Date de paiement effectif
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Date d'annulation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;


-- ============================================================
-- 5. Contrainte UNIQUE sur stripe_payment_intent_id
--    (maintenant que la colonne est renommée)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_stripe_payment_intent_id_key'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_stripe_payment_intent_id_key
      UNIQUE (stripe_payment_intent_id);
  END IF;
END $$;


-- ============================================================
-- 6. Index supplémentaires sur orders
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_service_id     ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(stripe_payment_intent_id);


-- ============================================================
-- 7. Colonne stripe_account_enabled sur profiles
--    (stripe_account_id existe déjà dans schema.sql Sprint 1)
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_enabled BOOLEAN NOT NULL DEFAULT false;


-- ============================================================
-- 8. Storage bucket — order-files
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  false,
  52428800,  -- 50 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg','image/png','image/webp',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 9. Politiques Storage — order-files
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'order_files_insert_auth' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "order_files_insert_auth" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'order-files' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'order_files_select_auth' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "order_files_select_auth" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'order-files' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'order_files_delete_owner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "order_files_delete_owner" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'order-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;


-- ============================================================
-- 10. Fonction RPC — incrémenter orders_count d'un service
-- ============================================================
CREATE OR REPLACE FUNCTION increment_service_orders(p_service_id UUID)
RETURNS void AS $$
  UPDATE services SET orders_count = orders_count + 1 WHERE id = p_service_id;
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================
-- 11. Fonction RPC — recalculer avg_rating d'un service
-- ============================================================
CREATE OR REPLACE FUNCTION update_service_avg_rating(p_service_id UUID)
RETURNS void AS $$
  UPDATE services
  SET avg_rating = (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
    FROM reviews
    WHERE service_id = p_service_id
  )
  WHERE id = p_service_id;
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================
-- VÉRIFICATION FINALE
-- Exécuter ce SELECT pour confirmer que les colonnes attendues
-- par le code Sprint 3 existent bien sur la table orders :
-- ============================================================
/*
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
*/
