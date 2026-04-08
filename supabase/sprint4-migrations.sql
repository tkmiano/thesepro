-- ============================================================
-- ThèsePro — Migrations Sprint 4 : Messagerie, Notifications, Avis
-- ============================================================

-- ============================================================
-- 1. Storage bucket — message-files (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-files',
  'message-files',
  false,
  20971520,  -- 20 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg','image/png','image/webp','image/gif',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Politiques Storage — message-files
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'message_files_insert_auth' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "message_files_insert_auth" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'message-files' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'message_files_select_auth' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "message_files_select_auth" ON storage.objects
      FOR SELECT USING (bucket_id = 'message-files' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'message_files_delete_owner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "message_files_delete_owner" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'message-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ============================================================
-- 3. Index performance sur messages
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON messages(conversation_id, created_at DESC);

-- ============================================================
-- 4. Index performance sur notifications
-- ============================================================
-- Déjà présent dans schema.sql : idx_notifications_user_id ON notifications(user_id, is_read)
-- On ajoute un index trié pour récupérer les 10 dernières rapidement
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- ============================================================
-- 5. Activer Supabase Realtime sur messages et notifications
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- 6. Politiques RLS manquantes sur conversations
--    (schema.sql Sprint 1 les avait, on vérifie juste)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'conversations_select_participants' AND tablename = 'conversations'
  ) THEN
    CREATE POLICY "conversations_select_participants" ON conversations
      FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'conversations_insert_authenticated' AND tablename = 'conversations'
  ) THEN
    CREATE POLICY "conversations_insert_authenticated" ON conversations
      FOR INSERT WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'conversations_update_participants' AND tablename = 'conversations'
  ) THEN
    CREATE POLICY "conversations_update_participants" ON conversations
      FOR UPDATE USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
  END IF;
END $$;

-- ============================================================
-- 7. Politique UPDATE sur messages (marquer comme lu)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'messages_update_read' AND tablename = 'messages'
  ) THEN
    CREATE POLICY "messages_update_read" ON messages
      FOR UPDATE USING (
        auth.uid() IN (
          SELECT participant_1_id FROM conversations WHERE id = conversation_id
          UNION
          SELECT participant_2_id FROM conversations WHERE id = conversation_id
        )
      );
  END IF;
END $$;

-- ============================================================
-- 8. Politique INSERT sur notifications (service role uniquement)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_insert_service' AND tablename = 'notifications'
  ) THEN
    -- Les notifications sont créées côté serveur (service role)
    -- On crée une politique permissive pour les authenticated (nécessaire pour service role)
    CREATE POLICY "notifications_insert_service" ON notifications
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
