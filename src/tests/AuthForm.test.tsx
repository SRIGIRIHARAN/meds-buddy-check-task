import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook to return promises, simulating a real API call
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    user: null,
    signOut: vi.fn(),
    loading: false,
  }),
}));

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks between tests
  });

  it('renders the login form by default', () => {
    render(<AuthForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('switches to the sign-up form when the link is clicked', () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('calls the signIn function on form submission in login mode', async () => {
    const { signIn } = useAuth();
    render(<AuthForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });
  });

  it('calls the signUp function on form submission in sign-up mode', async () => {
    const { signUp } = useAuth();
    render(<AuthForm />);

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'newpassword123' });
    });
  });
}); 