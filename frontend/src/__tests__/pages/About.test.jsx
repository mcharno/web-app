import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from '../../pages/About';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('About Page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the about page heading', () => {
    render(<About />);

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
  });

  it('should render welcome message', () => {
    render(<About />);

    expect(screen.getByText(/Welcome! I'm a researcher and developer/)).toBeInTheDocument();
  });

  it('should render content about digital tools', () => {
    render(<About />);

    expect(screen.getByText(/I specialize in creating digital tools/)).toBeInTheDocument();
  });

  it('should render personal interests', () => {
    render(<About />);

    expect(screen.getByText(/When I'm not coding or researching/)).toBeInTheDocument();
  });

  it('should render call to action', () => {
    render(<About />);

    expect(screen.getByText(/Feel free to explore my projects/)).toBeInTheDocument();
  });

  it('should render time zones', () => {
    render(<About />);

    expect(screen.getByText(/York, UK:/)).toBeInTheDocument();
    expect(screen.getByText(/Portland, OR:/)).toBeInTheDocument();
    expect(screen.getByText(/Vasiliko, Cyprus:/)).toBeInTheDocument();
  });

  it('should have correct CSS class', () => {
    const { container } = render(<About />);

    expect(container.querySelector('.about-page')).toBeInTheDocument();
  });
});
