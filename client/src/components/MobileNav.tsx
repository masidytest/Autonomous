import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  activePage?: 'dashboard' | 'agents' | 'search' | 'library';
  onSearchClick?: () => void;
  onNewProject?: () => void;
  onInviteClick?: () => void;
  onSettingsClick?: () => void;
}

export function MobileNav({
  activePage,
  onSearchClick,
  onNewProject,
  onInviteClick,
  onSettingsClick,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Floating hamburger button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}
      <div
        className={`mobile-sidebar-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-out sidebar */}
      <div className={`mobile-sidebar ${open ? 'open' : ''}`}>
        <Sidebar
          activePage={activePage}
          onSearchClick={() => { onSearchClick?.(); setOpen(false); }}
          onNewProject={() => { onNewProject?.(); setOpen(false); }}
          onInviteClick={() => { onInviteClick?.(); setOpen(false); }}
          onSettingsClick={() => { onSettingsClick?.(); setOpen(false); }}
        />
      </div>
    </>
  );
}
