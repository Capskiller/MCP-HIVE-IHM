import { Menu, Moon, Sun, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { ModelSelector } from '@/components/model/ModelSelector';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b bg-background">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <span className="font-semibold hidden sm:inline">{APP_CONFIG.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Model selector */}
        <ModelSelector />

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
}
