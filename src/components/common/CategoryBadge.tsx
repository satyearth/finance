'use client';

import React from 'react';
import { CategoryId } from '@/types/finance';
import { CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from './CategoryIcon';

/**
 * Props for CategoryBadge component.
 */
interface CategoryBadgeProps {
  /** Category identifier */
  category: CategoryId;
  /** Whether to render text label alongside the icon (default: true) */
  showLabel?: boolean;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Visual badge displaying category icon and label styled with Satyfinance utilitarian aesthetic.
 */
export function CategoryBadge({
  category,
  showLabel = true,
  className = '',
}: CategoryBadgeProps) {
  const meta = CATEGORIES[category] || CATEGORIES.other;

  if (!showLabel) {
    return (
      <span
        className={`w-7 h-7 rounded-[2px] border border-[#DED9D2] bg-[#F7F5F2] text-[#1B1A18] flex items-center justify-center shrink-0 ${className}`}
        title={meta.label}
      >
        <CategoryIcon category={category} size={14} stroke={2} className="text-[#E65B3F]" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] border border-[#DED9D2] bg-[#F7F5F2] text-[#1B1A18] text-[11px] font-mono font-bold uppercase tracking-wider ${className}`}
    >
      <CategoryIcon category={category} size={12} stroke={2} className="text-[#E65B3F]" />
      <span>{meta.label}</span>
    </span>
  );
}

