-- ============================================================
-- ThèsePro — Schéma de base de données complet
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('client', 'freelance', 'both', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'active', 'delivered', 'completed', 'disputed', 'cancelled', 'refunded');
CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================
-- TABLE : profiles
-- ============================================================

CREATE TABLE profiles (
  id                uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role              user_role   NOT NULL DEFAULT 'client',
  full_name         text        NOT NULL,
  avatar_url        text,
  bio               text,
  academic_title    text,
  disciplines       text[]      DEFAULT '{}',
  languages         text[]      DEFAULT '{}',
  diploma_verified  boolean     DEFAULT false,
  diploma_url       text,
  stripe_account_id text,
  stripe_customer_id text,
  avg_rating        numeric(3,2) DEFAULT 0,
  total_reviews     integer     DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABLE : services
-- ============================================================

CREATE TABLE services (
  id                     uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  freelance_id           uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                  text    NOT NULL,
  slug                   text    UNIQUE NOT NULL,
  category               text    NOT NULL,
  subcategory            text,
  description            text    NOT NULL,
  basic_price            integer NOT NULL,
  standard_price         integer,
  premium_price          integer,
  basic_delivery_days    integer NOT NULL,
  standard_delivery_days integer,
  premium_delivery_days  integer,
  basic_description      text,
  standard_description   text,
  premium_description    text,
  tags                   text[]  DEFAULT '{}',
  is_active              boolean DEFAULT true,
  is_featured            boolean DEFAULT false,
  views_count            integer DEFAULT 0,
  orders_count           integer DEFAULT 0,
  avg_rating             numeric(3,2) DEFAULT 0,
  created_at             timestamptz DEFAULT now()
);

CREATE INDEX idx_services_freelance_id ON services(freelance_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);

-- ============================================================
-- TABLE : service_images
-- ============================================================

CREATE TABLE service_images (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid    NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url        text    NOT NULL,
  position   integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- TABLE : service_extras
-- ============================================================

CREATE TABLE service_extras (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id     uuid    NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  title          text    NOT NULL,
  description    text,
  price          integer NOT NULL,
  delivery_days  integer NOT NULL
);

-- ============================================================
-- TABLE : conversations
-- ============================================================

CREATE TABLE conversations (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid,
  participant_1_id uuid    NOT NULL REFERENCES profiles(id),
  participant_2_id uuid    NOT NULL REFERENCES profiles(id),
  last_message_at  timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id);

-- ============================================================
-- TABLE : orders
-- ============================================================

CREATE TABLE orders (
  id                     uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id             uuid         NOT NULL REFERENCES services(id),
  client_id              uuid         NOT NULL REFERENCES profiles(id),
  freelance_id           uuid         NOT NULL REFERENCES profiles(id),
  formula                text         NOT NULL CHECK (formula IN ('basic', 'standard', 'premium')),
  status                 order_status NOT NULL DEFAULT 'pending',
  price                  integer      NOT NULL,
  commission_rate        numeric(4,2) NOT NULL DEFAULT 20.00,
  commission_amount      integer      NOT NULL,
  freelance_amount       integer      NOT NULL,
  delivery_days          integer      NOT NULL,
  deadline               timestamptz,
  requirements           text,
  delivery_message       text,
  revision_count         integer      DEFAULT 0,
  stripe_payment_intent  text,
  stripe_transfer_id     text,
  delivered_at           timestamptz,
  completed_at           timestamptz,
  created_at             timestamptz  DEFAULT now()
);

CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_freelance_id ON orders(freelance_id);
CREATE INDEX idx_orders_status ON orders(status);

ALTER TABLE conversations ADD CONSTRAINT fk_conversation_order
  FOREIGN KEY (order_id) REFERENCES orders(id);

-- ============================================================
-- TABLE : messages
-- ============================================================

CREATE TABLE messages (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid    NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid    NOT NULL REFERENCES profiles(id),
  content         text,
  file_url        text,
  file_name       text,
  file_size       integer,
  is_read         boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- TABLE : reviews
-- ============================================================

CREATE TABLE reviews (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid    NOT NULL UNIQUE REFERENCES orders(id),
  client_id             uuid    NOT NULL REFERENCES profiles(id),
  freelance_id          uuid    NOT NULL REFERENCES profiles(id),
  service_id            uuid    NOT NULL REFERENCES services(id),
  rating                integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  quality_rating        integer CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating  integer CHECK (communication_rating BETWEEN 1 AND 5),
  delay_rating          integer CHECK (delay_rating BETWEEN 1 AND 5),
  comment               text,
  freelance_reply       text,
  created_at            timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE freelance_id = NEW.freelance_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM reviews WHERE freelance_id = NEW.freelance_id
    )
  WHERE id = NEW.freelance_id;

  UPDATE services SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- ============================================================
-- TABLE : disputes
-- ============================================================

CREATE TABLE disputes (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid           NOT NULL REFERENCES orders(id),
  opened_by   uuid           NOT NULL REFERENCES profiles(id),
  reason      text           NOT NULL,
  description text,
  status      dispute_status DEFAULT 'open',
  resolution  text,
  created_at  timestamptz    DEFAULT now()
);

-- ============================================================
-- TABLE : notifications
-- ============================================================

CREATE TABLE notifications (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text    NOT NULL,
  title      text    NOT NULL,
  message    text    NOT NULL,
  is_read    boolean DEFAULT false,
  link       text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);

-- ============================================================
-- TABLE : withdrawal_requests
-- ============================================================

CREATE TABLE withdrawal_requests (
  id                 uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  freelance_id       uuid               NOT NULL REFERENCES profiles(id),
  amount             integer            NOT NULL,
  stripe_transfer_id text,
  status             withdrawal_status  DEFAULT 'pending',
  created_at         timestamptz        DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_extras      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_owner" ON profiles FOR UPDATE USING (auth.uid() = id);

-- services
CREATE POLICY "services_select_public" ON services
  FOR SELECT USING (is_active = true OR freelance_id = auth.uid());
CREATE POLICY "services_insert_owner" ON services
  FOR INSERT WITH CHECK (auth.uid() = freelance_id);
CREATE POLICY "services_update_owner" ON services
  FOR UPDATE USING (auth.uid() = freelance_id);
CREATE POLICY "services_delete_owner" ON services
  FOR DELETE USING (auth.uid() = freelance_id);

-- service_images
CREATE POLICY "service_images_select_public" ON service_images FOR SELECT USING (true);
CREATE POLICY "service_images_insert_owner" ON service_images
  FOR INSERT WITH CHECK (auth.uid() = (SELECT freelance_id FROM services WHERE id = service_id));
CREATE POLICY "service_images_delete_owner" ON service_images
  FOR DELETE USING (auth.uid() = (SELECT freelance_id FROM services WHERE id = service_id));

-- service_extras
CREATE POLICY "service_extras_select_public" ON service_extras FOR SELECT USING (true);
CREATE POLICY "service_extras_insert_owner" ON service_extras
  FOR INSERT WITH CHECK (auth.uid() = (SELECT freelance_id FROM services WHERE id = service_id));
CREATE POLICY "service_extras_delete_owner" ON service_extras
  FOR DELETE USING (auth.uid() = (SELECT freelance_id FROM services WHERE id = service_id));

-- orders
CREATE POLICY "orders_select_participants" ON orders
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = freelance_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "orders_insert_client" ON orders
  FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "orders_update_participants" ON orders
  FOR UPDATE USING (
    auth.uid() = client_id OR auth.uid() = freelance_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- conversations
CREATE POLICY "conversations_select_participants" ON conversations
  FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
CREATE POLICY "conversations_insert_authenticated" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- messages
CREATE POLICY "messages_select_participants" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT participant_1_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT participant_2_id FROM conversations WHERE id = conversation_id
    )
  );
CREATE POLICY "messages_insert_participants" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT participant_1_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT participant_2_id FROM conversations WHERE id = conversation_id
    )
  );

-- reviews
CREATE POLICY "reviews_select_public" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_client" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND status = 'completed' AND client_id = auth.uid())
  );
CREATE POLICY "reviews_update_freelance_reply" ON reviews
  FOR UPDATE USING (auth.uid() = freelance_id) WITH CHECK (auth.uid() = freelance_id);

-- notifications
CREATE POLICY "notifications_select_owner" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_owner" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- withdrawal_requests
CREATE POLICY "withdrawals_select_owner_or_admin" ON withdrawal_requests
  FOR SELECT USING (
    auth.uid() = freelance_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "withdrawals_insert_owner" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = freelance_id);

-- disputes
CREATE POLICY "disputes_select_participants_or_admin" ON disputes
  FOR SELECT USING (
    auth.uid() = opened_by OR
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.client_id = auth.uid() OR o.freelance_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "disputes_insert_participants" ON disputes
  FOR INSERT WITH CHECK (
    auth.uid() = opened_by AND
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.client_id = auth.uid() OR o.freelance_id = auth.uid()))
  );

-- ============================================================
-- REALTIME
-- Activer dans : Supabase Dashboard > Database > Replication
-- Tables : messages, notifications, orders, conversations
-- ============================================================
