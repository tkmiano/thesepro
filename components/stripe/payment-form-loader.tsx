'use client'

import dynamic from 'next/dynamic'

// PaymentForm uses @stripe/react-stripe-js → browser only
const PaymentForm = dynamic(
  () => import('./payment-form').then(m => m.PaymentForm),
  {
    ssr: false,
    loading: () => <div className="h-64 border rounded-xl bg-gray-50 animate-pulse" />,
  }
)

interface PaymentFormLoaderProps {
  clientSecret: string
  orderId:      string
  amountCents:  number
  serviceTitle: string
}

export function PaymentFormLoader(props: PaymentFormLoaderProps) {
  return <PaymentForm {...props} />
}
