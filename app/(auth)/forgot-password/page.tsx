'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('email') as string
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
        })
        if (error) {
          toast.error('Une erreur est survenue. Vérifiez l\'adresse email.')
        } else {
          setSent(true)
        }
      } catch {
        toast.error('Une erreur est survenue. Veuillez réessayer.')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1B3A6B]">
            Thèse<span className="text-[#C9963A]">Pro</span>
          </Link>
        </div>
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#1B3A6B]">
              Mot de passe oublié
            </CardTitle>
            <CardDescription>
              {sent
                ? 'Consultez votre boîte email pour réinitialiser votre mot de passe.'
                : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
            </CardDescription>
          </CardHeader>
          {!sent && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#1B3A6B] hover:bg-[#2E6DB4]"
                  disabled={isPending}
                >
                  {isPending ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
              </form>
            </CardContent>
          )}
          <CardFooter>
            <p className="text-sm text-center w-full text-muted-foreground">
              <Link href="/login" className="text-[#2E6DB4] hover:underline font-medium">
                Retour à la connexion
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
