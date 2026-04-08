'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { register, loginWithGoogle } from '@/lib/supabase/actions'
import { toast } from 'sonner'
const roles = [
  { value: 'client', label: 'Client', description: "Je cherche des services académiques" },
  { value: 'freelance', label: 'Freelance', description: "Je propose des services académiques" },
  { value: 'both', label: 'Les deux', description: "Je cherche et propose des services" },
] as const

type Role = 'client' | 'freelance' | 'both'

export default function RegisterPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('client')
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, setIsGooglePending] = useState(false)

  async function handleSubmit(formData: FormData) {
    formData.set('role', selectedRole)
    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Compte créé avec succès ! Connectez-vous.')
        router.push('/login')
      }
    })
  }

  async function handleGoogleLogin() {
    setIsGooglePending(true)
    await loginWithGoogle()
    setIsGooglePending(false)
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-[#1B3A6B]">Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez la référence de l&apos;accompagnement académique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isGooglePending || isPending}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isGooglePending ? 'Connexion...' : "S'inscrire avec Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Ou</span>
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Je suis</Label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedRole === role.value
                      ? 'border-[#1B3A6B] bg-[#E8F0FB]'
                      : 'border-gray-200 hover:border-[#2E6DB4]'
                  }`}
                >
                  <div className="font-medium text-sm text-[#1B3A6B]">{role.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{role.description}</div>
                </button>
              ))}
            </div>
            <input type="hidden" name="role" value={selectedRole} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" name="full_name" type="text" placeholder="Jean Dupont" required autoComplete="name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="vous@exemple.com" required autoComplete="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" placeholder="8 caractères minimum" required autoComplete="new-password" />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#1B3A6B] hover:bg-[#2E6DB4]"
            disabled={isPending || isGooglePending}
          >
            {isPending ? 'Création...' : 'Créer mon compte'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/cgu" className="text-[#2E6DB4] hover:underline">CGU</Link>
          </p>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#2E6DB4] hover:underline font-medium">Se connecter</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
