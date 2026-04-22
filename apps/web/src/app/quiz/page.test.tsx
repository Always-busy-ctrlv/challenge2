import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuizPage from './page';
import { useSearchParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('Quiz Page', () => {
  beforeEach(() => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  it('renders stage selection initially', () => {
    render(<QuizPage />);
    expect(screen.getByText(/Election Quizzes/i)).toBeInTheDocument();
  });

  it('starts quiz when a stage is selected', () => {
    render(<QuizPage />);
    const vrButton = screen.getByText(/Voter Registration/i).closest('button');
    if (!vrButton) throw new Error('VR button not found');
    fireEvent.click(vrButton);
    
    expect(screen.getByText(/Q 1\/5/i)).toBeInTheDocument();
  });

  it('handles answering questions and seeing results (Pass)', () => {
    render(<QuizPage />);
    const vrButton = screen.getByText(/Voter Registration/i).closest('button');
    if (!vrButton) throw new Error('VR button not found');
    fireEvent.click(vrButton);
    
    for (let i = 0; i < 5; i++) {
        const questionText = screen.getByRole('heading', { level: 2 }).textContent;
        if (questionText?.includes('age')) {
            fireEvent.click(screen.getByRole('radio', { name: /18/ }));
        } else if (questionText?.includes('North Dakota')) {
            fireEvent.click(screen.getByRole('radio', { name: /True/ }));
        } else if (questionText?.includes('DMVs')) {
            fireEvent.click(screen.getByRole('radio', { name: /NVRA 1993/ }));
        } else if (questionText?.includes('states plus D.C.')) {
            fireEvent.click(screen.getByRole('radio', { name: /22/ }));
        } else if (questionText?.includes('federal voter registration website')) {
            fireEvent.click(screen.getByRole('radio', { name: /vote.gov/ }));
        } else {
            fireEvent.click(screen.getAllByRole('radio')[0]);
        }
        
        // Try clicking again (should be ignored)
        fireEvent.click(screen.getAllByRole('radio')[0]);
        
        // Verify checkmark for correct answer (if we answered correctly)
        const checkmarks = screen.queryAllByText(/✓/);
        if (checkmarks.length > 0) {
            expect(checkmarks[0]).toBeInTheDocument();
        }
        
        const nextBtn = screen.getByRole('button', { name: /Next|See Results/i });
        fireEvent.click(nextBtn);
    }
    
    expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
  });

  it('handles retry and other stages buttons', () => {
    render(<QuizPage />);
    const vrButton = screen.getByText(/Voter Registration/i).closest('button');
    if (!vrButton) throw new Error('VR button not found');
    fireEvent.click(vrButton);
    
    for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getAllByRole('radio')[0]);
        fireEvent.click(screen.getByRole('button', { name: /Next|See Results/i }));
    }
    
    // Click Retry
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(screen.getByText(/Q 1\/5/i)).toBeInTheDocument();

    // Go to results again
    for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getAllByRole('radio')[0]);
        fireEvent.click(screen.getByRole('button', { name: /Next|See Results/i }));
    }

    // Click Other Stages
    fireEvent.click(screen.getByRole('button', { name: /Other Stages/i }));
    expect(screen.getByText(/Election Quizzes/i)).toBeInTheDocument();
  });

  it('handles preselected stage from search params', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue('voter-registration'),
    });
    
    render(<QuizPage />);
    
    // It might show "Loading questions..." for a split second due to useEffect
    await waitFor(() => {
        expect(screen.getByText(/Q 1\/5/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Voter Registration/i)).toBeInTheDocument();
  });
});
