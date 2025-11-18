import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from '../../pages/About';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'about.main': 'Main about text',
        'about.listItem1': 'List item 1',
        'about.listItem2': 'List item 2',
        'about.listItem3': 'List item 3',
        'about.listItem4': 'List item 4',
        'about.listItem5': 'List item 5',
        'about.listItem6': 'List item 6',
        'about.content1': 'Content paragraph 1',
        'about.content2': 'Content paragraph 2',
        'about.content3': 'Content paragraph 3',
        'about.content4': 'Content paragraph 4',
      };
      return translations[key] || key;
    },
  }),
}));

describe('About Page', () => {
  it('should render the about page heading', () => {
    render(<About />);

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
  });

  it('should render main content text', () => {
    render(<About />);

    expect(screen.getByText('Main about text')).toBeInTheDocument();
  });

  it('should render all list items', () => {
    render(<About />);

    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('List item 2')).toBeInTheDocument();
    expect(screen.getByText('List item 3')).toBeInTheDocument();
    expect(screen.getByText('List item 4')).toBeInTheDocument();
    expect(screen.getByText('List item 5')).toBeInTheDocument();
    expect(screen.getByText('List item 6')).toBeInTheDocument();
  });

  it('should render content paragraphs', () => {
    render(<About />);

    expect(screen.getByText('Content paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Content paragraph 2')).toBeInTheDocument();
    expect(screen.getByText('Content paragraph 3')).toBeInTheDocument();
    expect(screen.getByText('Content paragraph 4')).toBeInTheDocument();
  });

  it('should have correct CSS class', () => {
    const { container } = render(<About />);

    expect(container.querySelector('.about-page')).toBeInTheDocument();
  });
});
