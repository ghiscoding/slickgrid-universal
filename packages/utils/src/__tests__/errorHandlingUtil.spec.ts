import { describe, expect, it, vi } from 'vitest';
import { tryCatch, tryCatchWithReturn } from '../errorHandlingUtil.js';

describe('Error Handling Utilities', () => {
  describe('tryCatch()', () => {
    it('should execute operation successfully', () => {
      const operation = vi.fn();
      tryCatch(operation);
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should call onError callback when operation throws', () => {
      const error = new Error('test error');
      const operation = vi.fn(() => {
        throw error;
      });
      const onError = vi.fn();

      tryCatch(operation, onError);

      expect(operation).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should not call onError if no callback provided and operation throws', () => {
      const operation = vi.fn(() => {
        throw new Error('test error');
      });

      expect(() => tryCatch(operation)).not.toThrow();
      expect(operation).toHaveBeenCalledOnce();
    });
  });

  describe('tryCatchWithReturn()', () => {
    it('should return operation result on success', () => {
      const operation = vi.fn(() => 42);
      const result = tryCatchWithReturn(operation, 0);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should return default value and call onError when operation throws', () => {
      const error = new Error('test error');
      const operation = vi.fn(() => {
        throw error;
      });
      const onError = vi.fn();

      const result = tryCatchWithReturn(operation, 99, onError);

      expect(result).toBe(99);
      expect(operation).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should return default value when operation throws and no onError callback', () => {
      const operation = vi.fn(() => {
        throw new Error('test error');
      });

      const result = tryCatchWithReturn(operation, 'fallback');

      expect(result).toBe('fallback');
      expect(operation).toHaveBeenCalledOnce();
    });
  });
});
