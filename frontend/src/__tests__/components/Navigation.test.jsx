import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, useNavigate } from 'react-router-dom';
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
        'menu.open': 'open menu',
        'menu.close': 'close menu',
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

  it('should mark archives link as active when on /archives', () => {
    render(
      <MemoryRouter initialEntries={['/archives']}>
        <Navigation />
      </MemoryRouter>
    );

    expect(screen.getByText('archives').closest('a')).toHaveClass('active');
  });
});

describe('Navigation mobile menu', () => {
  const openMenu = () => {
    fireEvent.click(screen.getByRole('button', { name: 'open menu' }));
  };
  const toggle = () => screen.getByRole('button');

  afterEach(() => {
    delete window.matchMedia;
  });

  it('should be closed by default', () => {
    const { container } = renderNavigation();

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.navigation')).not.toHaveClass('open');
  });

  it('should open and close with the toggle and lock page scroll', () => {
    const { container } = renderNavigation();
    openMenu();

    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.navigation')).toHaveClass('open');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'close menu' }));

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('');
  });

  it('should close when a link is clicked', () => {
    for (const label of ['About', 'Projects', 'publishings', 'Photos', 'archives', 'CV']) {
      const { unmount } = renderNavigation();
      openMenu();
      fireEvent.click(screen.getByText(label));

      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
      unmount();
    }
  });

  it('should close when the route changes without a link click', () => {
    let navigate;
    const Navigator = () => {
      navigate = useNavigate();
      return null;
    };
    render(
      <MemoryRouter>
        <Navigation />
        <Navigator />
      </MemoryRouter>
    );
    openMenu();
    act(() => navigate('/cv'));

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('should close on Escape and return focus to the toggle', () => {
    renderNavigation();
    openMenu();
    fireEvent.keyDown(document, { key: 'a' });
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveFocus();
  });

  it('should keep Tab focus inside the open menu', () => {
    renderNavigation();
    openMenu();
    const last = screen.getByText('CV');

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(toggle()).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('should close when the window grows to desktop width', () => {
    let onChange;
    window.matchMedia = vi.fn(() => ({
      addEventListener: (_, handler) => { onChange = handler; },
      removeEventListener: vi.fn(),
    }));
    renderNavigation();
    openMenu();

    act(() => onChange({ matches: false }));
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');

    act(() => onChange({ matches: true }));
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });
});
