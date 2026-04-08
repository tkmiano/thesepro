-- ============================================================
-- ThèsePro — Migrations Sprint 2 (CORRIGÉES)
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Extension unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- 2. Colonne slug sur profiles — TEXT simple (pas GENERATED)
--    Le slug est calculé côté applicatif (lib/slugify.ts)
--    et inséré via updateProfile() ou le trigger handle_new_user
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Générer les slugs pour les profils existants
UPDATE profiles
SET slug = lower(
  regexp_replace(
    regexp_replace(
      unaccent(full_name),
      '[^a-zA-Z0-9\s]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- ============================================================
-- 3. Trigger handle_new_user — avec slug initial à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_slug  TEXT;
  final_slug TEXT;
  counter    INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(
    regexp_replace(
      unaccent(COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))),
      '[^a-zA-Z0-9\s]', '', 'g'
    ),
    '\s+', '-', 'g'
  ));
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    counter    := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.profiles (id, full_name, role, slug)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    final_slug
  );
  RETURN new;
EXCEPTION WHEN others THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. Colonne fts sur services — via TRIGGER (pas GENERATED)
--    GENERATED ALWAYS AS échoue car to_tsvector() avec un nom
--    de config TEXT n'est pas immutable pour PostgreSQL.
--    Solution : trigger BEFORE INSERT OR UPDATE.
-- ============================================================
ALTER TABLE services ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION update_service_fts()
RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('french',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_fts_update ON services;
CREATE TRIGGER services_fts_update
  BEFORE INSERT OR UPDATE OF title, tags ON services
  FOR EACH ROW EXECUTE FUNCTION update_service_fts();

-- Remplir fts pour les services existants
UPDATE services
SET fts = to_tsvector('french',
  coalesce(title, '') || ' ' || coalesce(array_to_string(tags, ' '), '')
);

CREATE INDEX IF NOT EXISTS idx_services_fts ON services USING gin(fts);

-- ============================================================
-- 5. Fonction RPC — incrémenter les vues d'un service
-- ============================================================
CREATE OR REPLACE FUNCTION increment_service_views(p_service_id UUID)
RETURNS void AS $$
  UPDATE services SET views_count = views_count + 1 WHERE id = p_service_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 6. Storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',        'avatars',        true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('service-images', 'service-images', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('diplomas',       'diplomas',       false, 10485760, ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Politiques Storage — avatars (public)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_select_public' AND tablename = 'objects') THEN
    CREATE POLICY "avatars_select_public" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_insert_owner' AND tablename = 'objects') THEN
    CREATE POLICY "avatars_insert_owner" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_update_owner' AND tablename = 'objects') THEN
    CREATE POLICY "avatars_update_owner" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_delete_owner' AND tablename = 'objects') THEN
    CREATE POLICY "avatars_delete_owner" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ============================================================
-- 8. Politiques Storage — service-images (public)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_images_select_public' AND tablename = 'objects') THEN
    CREATE POLICY "service_images_select_public" ON storage.objects
      FOR SELECT USING (bucket_id = 'service-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_images_insert_auth' AND tablename = 'objects') THEN
    CREATE POLICY "service_images_insert_auth" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'service-images' AND auth.role() = 'authenticated'
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_images_delete_owner' AND tablename = 'objects') THEN
    CREATE POLICY "service_images_delete_owner" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'service-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ============================================================
-- 9. Politiques Storage — diplomas (privé)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'diplomas_select_owner' AND tablename = 'objects') THEN
    CREATE POLICY "diplomas_select_owner" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'diplomas' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'diplomas_insert_owner' AND tablename = 'objects') THEN
    CREATE POLICY "diplomas_insert_owner" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'diplomas' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'diplomas_update_owner' AND tablename = 'objects') THEN
    CREATE POLICY "diplomas_update_owner" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'diplomas' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
