'use client'

import { useEffect } from 'react'
import { incrementServiceViews } from '@/lib/supabase/service-actions'

export function ViewTracker({ serviceId }: { serviceId: string }) {
  useEffect(() => {
    incrementServiceViews(serviceId)
  }, [serviceId])
  return null
}
