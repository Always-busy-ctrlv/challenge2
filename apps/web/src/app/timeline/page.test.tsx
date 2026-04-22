import { render, screen, fireEvent } from '@testing-library/react';
import TimelinePage from './page';

describe('Timeline Page', () => {
  it('renders all 6 stages', () => {
    render(<TimelinePage />);
    // Check for stage headings specifically
    expect(screen.getByRole('heading', { name: /Voter Registration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Primary Elections/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Candidate Nomination/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Campaign Period/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Election Day/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Results & Certification/i })).toBeInTheDocument();
  });

  it('expands a stage when clicked', () => {
    render(<TimelinePage />);
    // Use part of the button text or aria label
    const stageButton = screen.getByText(/Stage 1 of 6/i).closest('button');
    if (!stageButton) throw new Error('Stage button not found');
    
    expect(screen.queryByText(/Who Can Register?/i)).not.toBeInTheDocument();
    
    fireEvent.click(stageButton);
    
    expect(screen.getByText(/Who Can Register?/i)).toBeInTheDocument();
    expect(stageButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('expands a detail when clicked inside an expanded stage', () => {
    render(<TimelinePage />);
    const stageButton = screen.getByText(/Stage 1 of 6/i).closest('button');
    if (!stageButton) throw new Error('Stage button not found');
    fireEvent.click(stageButton);
    
    const detailButton = screen.getByRole('button', { name: /Who Can Register?/i });
    expect(screen.queryByText(/You must be a U.S. citizen/i)).not.toBeInTheDocument();
    
    fireEvent.click(detailButton);
    expect(screen.getByText(/You must be a U.S. citizen/i)).toBeInTheDocument();
    
    // Close it
    fireEvent.click(detailButton);
    expect(screen.queryByText(/You must be a U.S. citizen/i)).not.toBeInTheDocument();
  });

  it('closes a stage when clicked again', () => {
    render(<TimelinePage />);
    const stageButton = screen.getByText(/Stage 1 of 6/i).closest('button');
    if (!stageButton) throw new Error('Stage button not found');
    
    fireEvent.click(stageButton);
    expect(screen.getByText(/Who Can Register?/i)).toBeInTheDocument();
    
    fireEvent.click(stageButton);
    expect(screen.queryByText(/Who Can Register?/i)).not.toBeInTheDocument();
  });
});
