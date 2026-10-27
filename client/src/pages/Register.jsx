import { useAuth } from '../context/AuthContext.jsx';
import AuthForm from './AuthForm.jsx';

export default function Register() {
  const { register } = useAuth();
  return (
    <AuthForm
      title="Join the room"
      subtitle="Pick a pen name. Your paragraphs will carry it."
      submitLabel="Create account"
      fields={[
        { name: 'username', label: 'Pen name', autoComplete: 'username' },
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        { name: 'password', label: 'Password (min 6 characters)', type: 'password', autoComplete: 'new-password' },
      ]}
      onSubmit={({ username, email, password }) => register(username, email, password)}
      footer={{ text: 'Already have an account?', link: 'Log in', to: '/login' }}
    />
  );
}
