import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock canvas-confetti cleanly in jsdom test environment
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));
