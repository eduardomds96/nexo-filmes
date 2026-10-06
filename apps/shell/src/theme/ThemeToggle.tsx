import { Button } from '@nexo/ui';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

import { currentTheme, setTheme } from './theme';

export function ThemeToggle() {
  const [theme, setThemeState] = useState(currentTheme);
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={isDark}
      aria-label="Tema escuro"
      title={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
      onClick={() => {
        const next = isDark ? 'light' : 'dark';
        setTheme(next);
        setThemeState(next);
      }}
    >
      {isDark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  );
}
