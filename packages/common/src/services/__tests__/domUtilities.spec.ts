import 'jest-extended';
import { GridOption } from '../../interfaces';
import { sanitizeTextByAvailableSanitizer, } from '../domUtilities';

describe('Service/domUtilies', () => {
  describe('sanitizeTextByAvailableSanitizer method', () => {
    describe('use default DOMPurify sanitizer when no sanitizer exist', () => {
      const gridOptions = {} as GridOption;

      it('should return original value when input does not include any HTML tags', () => {
        const input = 'foo bar';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('foo bar');
      });

      it('should return original value when input does not include any bad HTML tags', () => {
        const input = '<div class="color: blue">Something</div>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<div class="color: blue">Something</div>');
      });

      it('should return empty string when some javascript script tags are included', () => {
        const input = '<script>alert("Hello World")</script>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('');
      });

      it('should return an empty <a> link tag when "javascript:" is part of the dirty html', () => {
        const input = '<a href="javascript:alert(\"Hello World\")"></a>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<a></a>');
      });
    });

    describe('use custom sanitizer when provided in the grid options', () => {
      const gridOptions = {
        sanitizer: (dirtyHtml) => (dirtyHtml.replace(/(\b)(on\S+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script([<>]*)/gi, '')),
      } as GridOption;

      it('should return original value when input does not include any HTML tags', () => {
        const input = 'foo bar';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('foo bar');
      });

      it('should return original value when input does not include any bad HTML tags', () => {
        const input = '<div class="color: blue">Something</div>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<div class="color: blue">Something</div>');
      });

      it('should return empty string when some javascript script tags are included', () => {
        const input = '<script>alert("Hello World")</script>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('');
      });

      it('should return text without the word "javascript:" when that is part of the dirty html', () => {
        const input = 'javascript:alert("Hello World")';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('');
      });

      it('should return an empty <a> link tag when "javascript:" is part of the dirty html', () => {
        const input = '<a href="javascript:alert(\"Hello World\")"></a>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<a href="></a>');
      });
    });
  });
});
