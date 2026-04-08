import { NextRequest, NextResponse } from 'next/server'
import { syncConnectAccountStatus } from '@/lib/supabase/stripe-actions'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')

  if (accountId) {
    await syncConnectAccountStatus(accountId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return NextResponse.redirect(`${appUrl}/freelance/settings?stripe=success`)
}
