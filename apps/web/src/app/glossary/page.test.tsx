import { render, screen, fireEvent } from '@testing-library/react';
import GlossaryPage from './page';

describe('Glossary Page', () => {
  it('renders correctly and lists terms', () => {
    render(<GlossaryPage />);
    expect(screen.getByText(/Election Glossary/i)).toBeInTheDocument();
    expect(screen.getByText(/Absentee Ballot/i)).toBeInTheDocument();
    expect(screen.getByText(/Electoral College/i)).toBeInTheDocument();
  });

  it('filters terms based on search input', () => {
    render(<GlossaryPage />);
    const searchInput = screen.getByLabelText(/Search glossary terms/i);
    
    fireEvent.change(searchInput, { target: { value: 'Gerrymandering' } });
    
    expect(screen.getByText(/Gerrymandering/i)).toBeInTheDocument();
    expect(screen.queryByText(/Absentee Ballot/i)).not.toBeInTheDocument();
  });

  it('filters terms based on category button', () => {
    render(<GlossaryPage />);
    const votingMethodsButton = screen.getByRole('button', { name: /Voting Methods \(4\)/i });
    
    fireEvent.click(votingMethodsButton);
    
    expect(screen.getByText(/Absentee Ballot/i)).toBeInTheDocument();
    expect(screen.queryByText(/Gerrymandering/i)).not.toBeInTheDocument();
    
    // Click "All" button
    const allButton = screen.getByRole('button', { name: /All \(24\)/i });
    fireEvent.click(allButton);
    expect(screen.getByText(/Gerrymandering/i)).toBeInTheDocument();
    
    // Toggle off by clicking same category
    fireEvent.click(votingMethodsButton);
    expect(screen.queryByText(/Gerrymandering/i)).not.toBeInTheDocument();
    fireEvent.click(votingMethodsButton);
    expect(screen.getByText(/Gerrymandering/i)).toBeInTheDocument();
  });

  it('expands a term when clicked', () => {
    render(<GlossaryPage />);
    const termButton = screen.getByRole('button', { name: /Absentee Ballot/i });
    
    expect(screen.queryByText(/A ballot cast by mail or in person/i)).not.toBeInTheDocument();
    
    fireEvent.click(termButton);
    
    expect(screen.getByText(/A ballot cast by mail or in person/i)).toBeInTheDocument();
    expect(termButton).toHaveAttribute('aria-expanded', 'true');
    
    // Close it
    fireEvent.click(termButton);
    expect(screen.queryByText(/A ballot cast by mail or in person/i)).not.toBeInTheDocument();
  });

  it('shows no results message for non-matching search', () => {
    render(<GlossaryPage />);
    const searchInput = screen.getByLabelText(/Search glossary terms/i);
    
    fireEvent.change(searchInput, { target: { value: 'xyz123abc' } });
    
    expect(screen.getByText(/No terms found for "xyz123abc"/i)).toBeInTheDocument();
  });
});
