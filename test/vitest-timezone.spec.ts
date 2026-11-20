import { describe, expect, it } from 'vitest';

describe('Vitest timezone', () => {
  it('uses the same EST timezone for local Date methods and Intl formatting', () => {
    const date = new Date('2019-05-03T00:00:01Z');
    const formattedHour = new Intl.DateTimeFormat('en-US', { hour: '2-digit', hourCycle: 'h23' }).format(date);

    expect(date.getTimezoneOffset()).toBe(300);
    expect(date.getHours()).toBe(19);
    expect(formattedHour).toBe('19');
  });
});
