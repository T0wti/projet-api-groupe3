"use client";

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ContextMenuAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  actions: ContextMenuAction[];
  ariaLabel?: string;
}

export default function ContextMenu({ actions, ariaLabel = 'Options' }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="app-text-muted hover:app-text p-1 rounded-full app-hover-surface transition-colors"
        aria-label={ariaLabel}
      >
        <MoreHorizontal size={16} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-7 z-20 min-w-27.5 rounded-lg border app-border app-surface-elevated shadow-lg">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => { action.onClick(); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm app-hover-surface ${index === 0 ? 'rounded-t-lg' : ''} ${index === actions.length - 1 ? 'rounded-b-lg' : ''} ${action.danger ? 'text-red-600' : 'app-text'}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
