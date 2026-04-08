export type UserRole = 'client' | 'freelance' | 'both' | 'admin'
export type OrderStatus = 'pending' | 'active' | 'delivered' | 'completed' | 'disputed' | 'cancelled' | 'refunded'
export type DisputeStatus = 'open' | 'investigating' | 'resolved'
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  avatar_url: string | null
  bio: string | null
  academic_title: string | null
  disciplines: string[]
  languages: string[]
  diploma_verified: boolean
  diploma_url: string | null
  stripe_account_id: string | null
  stripe_customer_id: string | null
  avg_rating: number
  total_reviews: number
  created_at: string
}

export interface Service {
  id: string
  freelance_id: string
  title: string
  slug: string
  category: string
  subcategory: string | null
  description: string
  basic_price: number
  standard_price: number | null
  premium_price: number | null
  basic_delivery_days: number
  standard_delivery_days: number | null
  premium_delivery_days: number | null
  basic_description: string | null
  standard_description: string | null
  premium_description: string | null
  tags: string[]
  is_active: boolean
  is_featured: boolean
  views_count: number
  orders_count: number
  avg_rating: number
  created_at: string
}

export interface ServiceImage {
  id: string
  service_id: string
  url: string
  position: number
  created_at: string
}

export interface ServiceExtra {
  id: string
  service_id: string
  title: string
  description: string | null
  price: number
  delivery_days: number
}

export interface Order {
  id: string
  service_id: string
  client_id: string
  freelance_id: string
  formula: 'basic' | 'standard' | 'premium'
  status: OrderStatus
  price: number
  commission_rate: number
  commission_amount: number
  freelance_amount: number
  delivery_days: number
  deadline: string | null
  requirements: string | null
  delivery_message: string | null
  revision_count: number
  stripe_payment_intent: string | null
  stripe_transfer_id: string | null
  delivered_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Conversation {
  id: string
  order_id: string | null
  participant_1_id: string
  participant_2_id: string
  last_message_at: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  order_id: string
  client_id: string
  freelance_id: string
  service_id: string
  rating: number
  quality_rating: number | null
  communication_rating: number | null
  delay_rating: number | null
  comment: string | null
  freelance_reply: string | null
  created_at: string
}

export interface Dispute {
  id: string
  order_id: string
  opened_by: string
  reason: string
  description: string | null
  status: DisputeStatus
  resolution: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  link: string | null
  created_at: string
}

export interface WithdrawalRequest {
  id: string
  freelance_id: string
  amount: number
  stripe_transfer_id: string | null
  status: WithdrawalStatus
  created_at: string
}
