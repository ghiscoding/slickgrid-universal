import { describe, expect, it } from 'vitest';

import { FieldType } from '../../enums/index';
import { mapTempoDateFormatWithFieldType, parseUtcDate } from '../dateUtils';

describe('Service/Utilies', () => {
  describe('mapTempoDateFormatWithFieldType method', () => {
    it('should return a Date in dateTime/dateTimeIso format', () => {
      const output1 = mapTempoDateFormatWithFieldType(FieldType.dateTime);
      const output2 = mapTempoDateFormatWithFieldType(FieldType.dateTimeIso);
      expect(output1).toBe('YYYY-MM-DD HH:mm:ss');
      expect(output2).toBe('YYYY-MM-DD HH:mm:ss');
    });

    it('should return a Date in dateTimeShortIso format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeShortIso);
      expect(output).toBe('YYYY-MM-DD HH:mm');
    });

    it('should return a Date in dateTimeIsoAmPm format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeIsoAmPm);
      expect(output).toBe('YYYY-MM-DD hh:mm:ss a');
    });

    it('should return a Date in dateTimeIsoAM_PM format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeIsoAM_PM);
      expect(output).toBe('YYYY-MM-DD hh:mm:ss A');
    });

    it('should return a Date in dateEuro format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateEuro);
      expect(output).toBe('DD/MM/YYYY');
    });

    it('should return a Date in dateEuroShort format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateEuroShort);
      expect(output).toEqual('D/M/YY');
    });

    it('should return a Date in dateEuroShort format with zero padding', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateEuroShort, true);
      expect(output).toEqual('DD/MM/YY');
    });

    it('should return a Date in dateTimeEuro format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeEuro);
      expect(output).toBe('DD/MM/YYYY HH:mm:ss');
    });

    it('should return a Date in dateTimeShortEuro format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeShortEuro);
      expect(output).toEqual('D/M/YYYY H:m');
    });

    it('should return a Date in dateTimeShortEuro format with zero padding', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeShortEuro, true);
      expect(output).toEqual('DD/MM/YYYY HH:mm');
    });

    it('should return a Date in dateTimeEuroAmPm format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeEuroAmPm);
      expect(output).toBe('DD/MM/YYYY hh:mm:ss a');
    });

    it('should return a Date in dateTimeEuroAM_PM format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeEuroAM_PM);
      expect(output).toBe('DD/MM/YYYY hh:mm:ss A');
    });

    it('should return a Date in dateTimeEuroShort format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeEuroShort);
      expect(output).toEqual('D/M/YY H:m:s');
    });

    it('should return a Date in dateTimeEuroShort format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeEuroShort, true);
      expect(output).toEqual('DD/MM/YY HH:mm:ss');
    });

    it('should return a Date in dateTimeEuroShortAmPm format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeEuroShortAmPm);
      expect(output).toEqual('D/M/YY h:m:s a');
    });

    it('should return a Date in dateTimeEuroShortAmPm format with zero padding', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeEuroShortAmPm, true);
      expect(output).toEqual('DD/MM/YY hh:mm:ss a');
    });

    it('should return a Date in dateUs format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateUs);
      expect(output).toBe('MM/DD/YYYY');
    });

    it('should return a Date in dateUsShort format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateUsShort);
      expect(output).toEqual('M/D/YY');
    });

    it('should return a Date in dateUsShort format with zero padding', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateUsShort, true);
      expect(output).toEqual('MM/DD/YY');
    });

    it('should return a Date in dateTimeUs format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeUs);
      expect(output).toBe('MM/DD/YYYY HH:mm:ss');
    });

    it('should return a Date in dateTimeShortUs format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeShortUs);
      expect(output).toEqual('M/D/YYYY H:m');
    });

    it('should return a Date in dateTimeShortUs format with zero padding', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeShortUs, true);
      expect(output).toEqual('MM/DD/YYYY HH:mm');
    });

    it('should return a Date in dateTimeUsAmPm format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeUsAmPm);
      expect(output).toBe('MM/DD/YYYY hh:mm:ss a');
    });

    it('should return a Date in dateTimeUsAM_PM format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeUsAM_PM);
      expect(output).toBe('MM/DD/YYYY hh:mm:ss A');
    });

    it('should return a Date in dateTimeUsShort format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeUsShort);
      expect(output).toEqual('M/D/YY H:m:s');
    });

    it('should return a Date in dateTimeUsShort format with zero padding', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeUsShort, true);
      expect(output).toEqual('MM/DD/YY HH:mm:ss');
    });

    it('should return a Date in dateTimeUsShortAmPm format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeUsShortAmPm);
      expect(output).toEqual('M/D/YY h:m:s a');
    });

    it('should return a Date in dateTimeUsShortAmPm format with zero padding', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateTimeUsShortAmPm, true);
      expect(output).toEqual('MM/DD/YY hh:mm:ss a');
    });

    it('should return a Date in dateUtc format', () => {
      const output = mapTempoDateFormatWithFieldType(FieldType.dateUtc);
      expect(output).toBe('ISO8601');
    });

    it('should return a Date in date/dateIso format', () => {
      const output1 = mapTempoDateFormatWithFieldType(FieldType.date);
      const output2 = mapTempoDateFormatWithFieldType(FieldType.dateIso);
      expect(output1).toBe('YYYY-MM-DD');
      expect(output2).toBe('YYYY-MM-DD');
    });
  });

  describe('parseUtcDate method', () => {
    it('should return a TZ date parsed as UTC but without milliseconds', () => {
      const input = '2012-01-01';
      const output = parseUtcDate(input);
      expect(output).toBe('2012-01-01T00:00:00Z');
    });
  });
});
