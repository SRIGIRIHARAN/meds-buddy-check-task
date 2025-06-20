import { render, screen, waitFor, within } from './test-utils';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import PatientDashboard from '@/components/PatientDashboard';
import { useAuth } from '@/hooks/useAuth';
import * as medicationApi from '@/lib/medicationApi';
import * as medicationLogApi from '@/lib/medicationLogApi';
import { format } from 'date-fns';

// Mock hooks and APIs
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('@/lib/medicationApi');
vi.mock('@/lib/medicationLogApi');

const today = new Date();
const mockMedications = [
  { id: 'med1', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', user_id: 'test-user-id', inserted_at: today.toISOString() },
  { id: 'med2', name: 'Aspirin', dosage: '100mg', frequency: 'Once daily', user_id: 'test-user-id', inserted_at: today.toISOString() },
];
const mockLogs = [
    { id: 'log1', medication_id: 'med1', date: format(today, 'yyyy-MM-dd'), taken: true, user_id: 'test-user-id', proof_photo_url: null, inserted_at: today.toISOString() }
];

describe('PatientDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows a loading state initially', () => {
    (medicationApi.fetchMedications as Mock).mockReturnValue(new Promise(() => {}));
    (medicationLogApi.fetchMedicationLogsForMonth as Mock).mockReturnValue(new Promise(() => {}));
    
    render(<PatientDashboard />);
    expect(screen.getByText(/loading dashboard.../i)).toBeInTheDocument();
  });

  it('shows an error state if data fetching fails', async () => {
    (medicationApi.fetchMedications as Mock).mockRejectedValue(new Error('Failed to fetch'));
    (medicationLogApi.fetchMedicationLogsForMonth as Mock).mockResolvedValue({ data: [], error: null });
    
    render(<PatientDashboard />);
    expect(await screen.findByText(/failed to load data/i)).toBeInTheDocument();
  });

  it('renders the dashboard with data after successful fetching', async () => {
    (medicationApi.fetchMedications as Mock).mockResolvedValue({ data: mockMedications, error: null });
    (medicationLogApi.fetchMedicationLogsForMonth as Mock).mockResolvedValue({ data: mockLogs, error: null });

    render(<PatientDashboard />);

    await screen.findByText(/monthly adherence/i);
      
    const adherenceWidget = screen.getByText(/monthly adherence/i).closest('div.bg-white\\/10') as HTMLElement;
    expect(adherenceWidget).toHaveTextContent(/\d+\s*%/);

    const medicationsWidget = screen.getByText(/medications/i).closest('div.bg-white\\/10') as HTMLElement;
    expect(within(medicationsWidget).getByText(mockMedications.length.toString())).toBeInTheDocument();
  });
}); 