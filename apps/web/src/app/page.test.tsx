import { render, screen } from '@testing-library/react';
import Page from './page';

// Mock fetch for server components logic if any
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, data: [] }),
  })
) as jest.Mock;

describe('Landing Page', () => {
  it('renders the hero title', () => {
    render(<Page />);
    // Use getByRole for heading to be specific
    expect(screen.getByRole('heading', { name: /Understand the Election Process Like Never Before/i })).toBeInTheDocument();
  });

  it('renders the core feature sections', () => {
    render(<Page />);
    expect(screen.getByText(/Interactive Timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/Knowledge Quizzes/i)).toBeInTheDocument();
  });

  it('renders stats', () => {
    render(<Page />);
    const sixElements = screen.getAllByText(/6/);
    expect(sixElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Election Stages/i)).toBeInTheDocument();
  });
});
