'use client';

import React from 'react';
import {
  IconShoppingBag,
  IconToolsKitchen2,
  IconBolt,
  IconDeviceLaptop,
  IconSparkles,
  IconHome,
  IconTag,
} from '@tabler/icons-react';
import { CategoryId } from '@/types/finance';

/**
 * Props for CategoryIcon component.
 */
interface CategoryIconProps {
  /** Target category */
  category: CategoryId;
  /** Size in pixels (default: 18) */
  size?: number | string;
  /** Stroke width (default: 1.8) */
  stroke?: number | string;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Renders the representative Tabler icon for a finance category.
 */
export function CategoryIcon({
  category,
  size = 18,
  stroke = 1.8,
  className = '',
  ...props
}: CategoryIconProps) {

  const iconProps = {
    size,
    stroke,
    className: `text-[#1B1A18] shrink-0 ${className}`.trim(),
    ...props,
  };

  switch (category) {
    case 'groceries':
      return <IconShoppingBag {...iconProps} />;
    case 'food_dining':
      return <IconToolsKitchen2 {...iconProps} />;
    case 'bills':
      return <IconBolt {...iconProps} />;
    case 'electronics':
      return <IconDeviceLaptop {...iconProps} />;
    case 'personal_care':
      return <IconSparkles {...iconProps} />;
    case 'household':
      return <IconHome {...iconProps} />;
    case 'other':
    default:
      return <IconTag {...iconProps} />;
  }
}
