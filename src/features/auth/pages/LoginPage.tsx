import { useState, useEffect, useContext, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { MoonIcon, SunIcon } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../stores/authStore';
import { LoginForm } from '../../../components/login-form';

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos.';
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.';
    case 'auth/operation-not-allowed':
      return 'Autenticação por e-mail/senha não está habilitada no Firebase Console.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

export function LoginPage() {
  const { theme, toggle } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { status, signIn } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Entrar · SetFlow';
  }, []);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setResetSent(false);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setError(authErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Informe seu e-mail para recuperar a senha.');
      return;
    }
    setResetting(true);
    setResetSent(false);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/user-not-found') {
        setError('Se o e-mail estiver cadastrado, você receberá o link de redefinição.');
      } else if (code === 'auth/invalid-email') {
        setError('Informe um e-mail válido.');
      } else if (code === 'auth/network-request-failed') {
        setError('Falha de conexão. Verifique sua internet.');
      } else {
        setError('Não foi possível enviar o link. Tente novamente.');
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <main className="relative flex h-dvh overflow-y-auto bg-background px-4 py-8">
      <button
        type="button"
        onClick={toggle}
        className="absolute top-5 right-5 flex size-10 items-center justify-center rounded-2xl text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/70"
        aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      >
        {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
      </button>

      <LoginForm
        className="m-auto w-full max-w-3xl"
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        resetting={resetting}
        resetSent={resetSent}
        onForgotPassword={handleForgotPassword}
      />
    </main>
  );
}
