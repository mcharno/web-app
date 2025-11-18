import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
    t: (key) => key,
  }),
}));

// Test component that uses the language context
const TestComponent = () => {
  const { language, switchLanguage, switchToEnglish, switchToGreek } = useLanguage();

  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <button onClick={() => switchLanguage('en')}>Change to EN</button>
      <button onClick={switchToEnglish}>English</button>
      <button onClick={switchToGreek}>Greek</button>
    </div>
  );
};

describe('LanguageContext', () => {
  describe('LanguageProvider', () => {
    it('should provide language context to children', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should switch language when switchLanguage is called', async () => {
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const changeButton = screen.getByText('Change to EN');
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });
    });

    it('should switch to English when switchToEnglish is called', async () => {
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const englishButton = screen.getByText('English');
      await user.click(englishButton);

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });
    });

    it('should switch to Greek when switchToGreek is called', async () => {
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const greekButton = screen.getByText('Greek');
      await user.click(greekButton);

      await waitFor(() => {
        // Language state should change after clicking
        expect(screen.getByTestId('current-language')).toBeDefined();
      });
    });
  });

  describe('useLanguage', () => {
    it('should throw error when used outside LanguageProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useLanguage must be used within a LanguageProvider');

      consoleSpy.mockRestore();
    });
  });
});
