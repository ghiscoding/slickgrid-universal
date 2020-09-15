import { Column } from '../../interfaces/index';
import { centerFormatter } from '../centerFormatter';

describe('the Uppercase Formatter', () => {
  it('should return an empty string when no value is passed', () => {
    const output = centerFormatter(1, 1, '', {} as Column, {});
    expect(output).toBe('<center></center>');
  });

  it('should return a string all in uppercase', () => {
    const output = centerFormatter(1, 1, 'hello', {} as Column, {});
    expect(output).toBe('<center>hello</center>');
  });

  it('should return a number as a string', () => {
    const output = centerFormatter(1, 1, 99, {} as Column, {});
    expect(output).toBe('<center>99</center>');
  });

  it('should return a boolean as a string all in uppercase', () => {
    const output = centerFormatter(1, 1, false, {} as Column, {});
    expect(output).toBe('<center>false</center>');
  });
});
