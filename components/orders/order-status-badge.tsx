import { Badge } from '@/components/ui/badge'

type OrderStatus =
  | 'pending_payment'
  | 'pending'        // Sprint 1 legacy
  | 'paid'
  | 'active'         // Sprint 1 legacy (= paid + in_progress)
  | 'in_progress'
  | 'delivered'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed'       // Sprint 1 legacy

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment:   { label: 'En attente de paiement', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  pending:           { label: 'En attente',             className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  paid:              { label: 'Payée',                  className: 'bg-blue-100 text-blue-800 border-blue-200' },
  active:            { label: 'En cours',               className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  in_progress:       { label: 'En cours',               className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  delivered:         { label: 'Livrée',                 className: 'bg-purple-100 text-purple-800 border-purple-200' },
  revision_requested:{ label: 'Révision demandée',      className: 'bg-orange-100 text-orange-800 border-orange-200' },
  completed:         { label: 'Terminée',               className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:         { label: 'Annulée',                className: 'bg-red-100 text-red-800 border-red-200' },
  refunded:          { label: 'Remboursée',             className: 'bg-gray-100 text-gray-800 border-gray-200' },
  disputed:          { label: 'En litige',              className: 'bg-red-100 text-red-800 border-red-200' },
}

interface OrderStatusBadgeProps {
  status: OrderStatus | string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status as OrderStatus] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  )
}
