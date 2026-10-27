import { useAuth } from '../context/AuthContext.jsx';
import AuthForm from './AuthForm.jsx';

export default function Login() {
  const { login } = useAuth();
  return (
    <AuthForm
      title="Welcome back"
      subtitle="The story kept going without you."
      submitLabel="Log in"
      fields={[
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
      ]}
      onSubmit={({ email, password }) => login(email, password)}
      footer={{ text: 'New here?', link: 'Create an account', to: '/register' }}
    />
  );
}
