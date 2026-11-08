import { describe, it, expect } from 'vitest';
import { validateFileType, REGISTERED_FILE_TYPES } from '@/lib/scanner/file-registry';

describe('Artifact Coverage & 21 Registered Extensions', () => {
  it('contains at least 21 registered extensions', () => {
    const keys = Object.keys(REGISTERED_FILE_TYPES);
    expect(keys.length).toBeGreaterThanOrEqual(21);
  });

  it('marks PDF and package-lock.json as EXPERIMENTAL', () => {
    const pdfRes = validateFileType('contract.pdf');
    expect(pdfRes.valid).toBe(true);
    expect(pdfRes.coverage).toBe('EXPERIMENTAL');

    const lockRes = validateFileType('package-lock.json');
    expect(lockRes.valid).toBe(true);
    expect(lockRes.coverage).toBe('EXPERIMENTAL');
  });

  it('marks standard source and config files as FULL coverage', () => {
    const fullExtensions = ['.txt', '.md', '.json', '.yaml', '.py', '.js', '.ts', '.env', '.sh', '.sql', '.dockerfile'];
    for (const ext of fullExtensions) {
      const res = validateFileType(`sample${ext}`);
      expect(res.valid).toBe(true);
      expect(res.coverage).toBe('FULL');
    }
  });

  it('rejects unregistered binary extensions', () => {
    const res = validateFileType('malware.exe');
    expect(res.valid).toBe(false);
    expect(res.coverage).toBe('UNSUPPORTED');
  });

  it('rejects files exceeding size limits', () => {
    const oversized = 15 * 1024 * 1024; // 15MB
    const res = validateFileType('huge.json', oversized);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('safety limit');
  });
});

