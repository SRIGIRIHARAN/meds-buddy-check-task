import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import MedicationForm from '@/components/MedicationForm';
import { useAuth } from '@/hooks/useAuth';
import * as medicationApi from '@/lib/medicationApi';
import { toast } from '@/components/ui/use-toast';

// Mock hooks and modules
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('@/lib/medicationApi');

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('MedicationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with all fields', () => {
    render(<MedicationForm />);

    expect(screen.getByLabelText(/medication name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dosage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add medication/i })).toBeInTheDocument();
  });

  it('shows a toast notification if fields are empty on submission', async () => {
    render(<MedicationForm />);
    fireEvent.click(screen.getByRole('button', { name: /add medication/i }));

    await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'All fields are required',
          variant: 'destructive',
        });
    });
    
    expect(medicationApi.addMedication).not.toHaveBeenCalled();
  });

  it('calls the mutation function with correct data on successful submission', async () => {
    (medicationApi.addMedication as Mock).mockResolvedValue({ error: null });

    render(<MedicationForm />);

    fireEvent.change(screen.getByLabelText(/medication name/i), { target: { value: 'Aspirin' } });
    fireEvent.change(screen.getByLabelText(/dosage/i), { target: { value: '100mg' } });
    fireEvent.change(screen.getByLabelText(/frequency/i), { target: { value: 'Once daily' } });

    fireEvent.click(screen.getByRole('button', { name: /add medication/i }));

    await waitFor(() => {
      expect(medicationApi.addMedication).toHaveBeenCalledWith({
        name: 'Aspirin',
        dosage: '100mg',
        frequency: 'Once daily',
        user_id: 'test-user-id',
      });
    });
  });
}); 