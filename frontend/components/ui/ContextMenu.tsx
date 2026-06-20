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
        className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label={ariaLabel}
      >
        <MoreHorizontal size={16} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-7 z-20 min-w-27.5 rounded-lg border border-gray-200 bg-white shadow-lg">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => { action.onClick(); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${index === 0 ? 'rounded-t-lg' : ''} ${index === actions.length - 1 ? 'rounded-b-lg' : ''} ${action.danger ? 'text-red-600' : 'text-gray-700'}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
