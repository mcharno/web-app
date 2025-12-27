import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../../components/Navigation';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'menu.about': 'About',
        'menu.projects': 'Projects',
        'menu.photos': 'Photos',
        'menu.cv': 'CV',
      };
      return translations[key] || key;
    },
  }),
}));

const renderNavigation = () => {
  return render(
    <BrowserRouter>
      <Navigation />
    </BrowserRouter>
  );
};

describe('Navigation', () => {
  it('should render all navigation links', () => {
    renderNavigation();

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('publishings')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('archives')).toBeInTheDocument();
    expect(screen.getByText('CV')).toBeInTheDocument();
  });

  it('should have correct link paths', () => {
    renderNavigation();

    expect(screen.getByText('About').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Projects').closest('a')).toHaveAttribute('href', '/projects');
    expect(screen.getByText('publishings').closest('a')).toHaveAttribute('href', '/publishings');
    expect(screen.getByText('Photos').closest('a')).toHaveAttribute('href', '/photos');
    expect(screen.getByText('archives').closest('a')).toHaveAttribute('href', '/archives');
    expect(screen.getByText('CV').closest('a')).toHaveAttribute('href', '/cv');
  });

  it('should have navigation class', () => {
    const { container } = renderNavigation();

    expect(container.querySelector('.navigation')).toBeInTheDocument();
  });
});
