import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../../components/Navigation';

// Mock the language context
const mockSwitchToEnglish = vi.fn();
const mockSwitchToGreek = vi.fn();

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    switchToEnglish: mockSwitchToEnglish,
    switchToGreek: mockSwitchToGreek,
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'menu.about': 'About',
        'menu.projects': 'Projects',
        'menu.papers': 'Papers',
        'menu.photos': 'Photos',
        'menu.blog': 'Blog',
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
    expect(screen.getByText('Papers')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('CV')).toBeInTheDocument();
  });

  it('should render language switcher buttons', () => {
    renderNavigation();

    const englishButton = screen.getByAltText('English');
    const greekButton = screen.getByAltText('Greek');

    expect(englishButton).toBeInTheDocument();
    expect(greekButton).toBeInTheDocument();
  });

  it('should call switchToEnglish when English button is clicked', async () => {
    const user = userEvent.setup();
    renderNavigation();

    const englishButton = screen.getByAltText('English').closest('button');
    await user.click(englishButton);

    expect(mockSwitchToEnglish).toHaveBeenCalled();
  });

  it('should call switchToGreek when Greek button is clicked', async () => {
    const user = userEvent.setup();
    renderNavigation();

    const greekButton = screen.getByAltText('Greek').closest('button');
    await user.click(greekButton);

    expect(mockSwitchToGreek).toHaveBeenCalled();
  });

  it('should have correct link paths', () => {
    renderNavigation();

    expect(screen.getByText('About').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Projects').closest('a')).toHaveAttribute('href', '/projects');
    expect(screen.getByText('Papers').closest('a')).toHaveAttribute('href', '/papers');
    expect(screen.getByText('Photos').closest('a')).toHaveAttribute('href', '/photos');
    expect(screen.getByText('Blog').closest('a')).toHaveAttribute('href', '/blog');
    expect(screen.getByText('CV').closest('a')).toHaveAttribute('href', '/cv');
  });
});
