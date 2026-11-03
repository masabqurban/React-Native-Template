import { capitalize, formatPercentChange, initials } from './format';

describe('format helpers', () => {
  it('signs percentage changes', () => {
    expect(formatPercentChange(0.124)).toBe('+12.4%');
    expect(formatPercentChange(-0.013)).toBe('-1.3%');
  });

  it('builds initials and capitalises', () => {
    expect(initials('  ada  lovelace byron ')).toBe('AL');
    expect(capitalize('admin')).toBe('Admin');
  });
});
