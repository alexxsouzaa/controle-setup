import { useState, type FormEvent, type HTMLAttributes } from "react"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SetFlowLogo } from "@/components/SetFlowLogo"

interface LoginFormProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitting?: boolean
  error?: string | null
  resetting?: boolean
  resetSent?: boolean
  onForgotPassword: () => void
}

export function LoginForm({
  className,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  submitting,
  error,
  resetting,
  resetSent,
  onForgotPassword,
  ...props
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <SetFlowLogo className="h-5 w-auto md:hidden" />
                <h1 className="font-heading text-2xl font-bold">Bem-vindo de volta</h1>
                <p className="text-balance text-muted-foreground">
                  Acesse o SetFlow com suas credenciais
                </p>
              </div>
              {resetSent && (
                <div
                  id="login-notice"
                  role="status"
                  className="flex items-center gap-2 rounded-2xl bg-[var(--success-muted)] px-3 py-2 text-sm text-[var(--success)] animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2Icon className="size-4 shrink-0" />
                  Link de redefinição enviado. Confira sua caixa de entrada.
                </div>
              )}
              {error && (
                <FieldError
                  id="login-error"
                  className="rounded-2xl bg-destructive/15 px-3 py-2 text-destructive animate-in fade-in slide-in-from-top-1">
                  {error}
                </FieldError>
              )}
              <Field>
                <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  autoComplete="email"
                  required
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined} />
              </Field>
              <Field>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    disabled={resetting}
                    className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-50">
                    {resetting ? "Enviando..." : "Esqueceu a senha?"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "login-error" : undefined} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/70">
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
              </Field>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </FieldGroup>
          </form>
          <div className="relative hidden flex-col items-center justify-center gap-6 bg-foreground p-8 text-background md:flex">
            <SetFlowLogo className="h-5 w-auto" />
            <p className="text-center text-sm text-balance opacity-80">
              Controle de setup de máquinas — fluxos, produtos, peças e formatos em um só lugar.
            </p>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Acesso restrito a usuários autorizados.
      </FieldDescription>
    </div>
  );
}
