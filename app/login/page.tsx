import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Inicia sesión como empleado o administrador.',
};

export default function LoginPage() {
  return <LoginForm />;
}
