export type CoverageStatus = 'FULL' | 'PARTIAL' | 'EXPERIMENTAL' | 'UNSUPPORTED';

export interface RegisteredFileType {
  extension: string;
  name: string;
  category: 'code' | 'config' | 'data' | 'document' | 'credentials';
  coverage: CoverageStatus;
  notes?: string;
}

export const REGISTERED_FILE_TYPES: Record<string, RegisteredFileType> = {
  '.txt': { extension: '.txt', name: 'Plain Text', category: 'document', coverage: 'FULL' },
  '.md': { extension: '.md', name: 'Markdown Document', category: 'document', coverage: 'FULL' },
  '.json': { extension: '.json', name: 'JSON Document', category: 'data', coverage: 'FULL' },
  '.yaml': { extension: '.yaml', name: 'YAML Manifest', category: 'config', coverage: 'FULL' },
  '.yml': { extension: '.yml', name: 'YAML Manifest', category: 'config', coverage: 'FULL' },
  '.py': { extension: '.py', name: 'Python Script', category: 'code', coverage: 'FULL' },
  '.js': { extension: '.js', name: 'JavaScript File', category: 'code', coverage: 'FULL' },
  '.ts': { extension: '.ts', name: 'TypeScript File', category: 'code', coverage: 'FULL' },
  '.env': { extension: '.env', name: 'Environment Secrets', category: 'credentials', coverage: 'FULL' },
  '.sh': { extension: '.sh', name: 'Shell Script', category: 'code', coverage: 'FULL' },
  '.sql': { extension: '.sql', name: 'SQL Query / Schema', category: 'data', coverage: 'FULL' },
  '.csv': { extension: '.csv', name: 'CSV Table', category: 'data', coverage: 'FULL' },
  '.xml': { extension: '.xml', name: 'XML Data', category: 'data', coverage: 'FULL' },
  '.html': { extension: '.html', name: 'HTML Document', category: 'document', coverage: 'FULL' },
  '.dockerfile': { extension: '.dockerfile', name: 'Dockerfile', category: 'config', coverage: 'FULL' },
  '.toml': { extension: '.toml', name: 'TOML Config', category: 'config', coverage: 'FULL' },
  '.ini': { extension: '.ini', name: 'INI Config', category: 'config', coverage: 'FULL' },
  '.log': { extension: '.log', name: 'Log Output', category: 'data', coverage: 'FULL' },
  '.pem': { extension: '.pem', name: 'PEM Certificate / Key', category: 'credentials', coverage: 'FULL' },
  '.crt': { extension: '.crt', name: 'Certificate', category: 'credentials', coverage: 'FULL' },
  '.pdf': {
    extension: '.pdf',
    name: 'Portable Document Format',
    category: 'document',
    coverage: 'EXPERIMENTAL',
    notes: 'Experimental text stream extraction; complex binary streams or embedded fonts may produce partial tokens.'
  },
  'package-lock.json': {
    extension: 'package-lock.json',
    name: 'NPM Lockfile',
    category: 'config',
    coverage: 'EXPERIMENTAL',
    notes: 'Experimental dependency tree scanning; integrity hash verification active.'
  }
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface FileValidationResult {
  valid: boolean;
  coverage: CoverageStatus;
  detectedExtension: string;
  error?: string;
  fileTypeInfo?: RegisteredFileType;
}

export function validateFileType(fileName: string, size?: number): FileValidationResult {
  if (size !== undefined && size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      coverage: 'UNSUPPORTED',
      detectedExtension: '',
      error: `File size exceeds 10MB safety limit (${(size / (1024 * 1024)).toFixed(2)}MB).`
    };
  }

  const normalized = fileName.toLowerCase();

  // Check special file names like package-lock.json or Dockerfile
  if (normalized === 'package-lock.json' || normalized.endsWith('/package-lock.json') || normalized.endsWith('\\package-lock.json')) {
    return {
      valid: true,
      coverage: 'EXPERIMENTAL',
      detectedExtension: 'package-lock.json',
      fileTypeInfo: REGISTERED_FILE_TYPES['package-lock.json']
    };
  }

  if (normalized === 'dockerfile' || normalized.endsWith('.dockerfile')) {
    return {
      valid: true,
      coverage: 'FULL',
      detectedExtension: '.dockerfile',
      fileTypeInfo: REGISTERED_FILE_TYPES['.dockerfile']
    };
  }

  const dotIdx = normalized.lastIndexOf('.');
  if (dotIdx === -1) {
    return {
      valid: false,
      coverage: 'UNSUPPORTED',
      detectedExtension: 'unknown',
      error: `File without recognized extension is unsupported for sandboxed text review.`
    };
  }

  const ext = normalized.substring(dotIdx);
  const registered = REGISTERED_FILE_TYPES[ext];

  if (!registered) {
    return {
      valid: false,
      coverage: 'UNSUPPORTED',
      detectedExtension: ext,
      error: `Extension "${ext}" is not one of the 21 registered inspectable file formats.`
    };
  }

  return {
    valid: true,
    coverage: registered.coverage,
    detectedExtension: ext,
    fileTypeInfo: registered
  };
}

/**
 * Guarantee: 0 Uploaded Files Executed.
 * Extract text from payload using safe memory decoding without invoking any interpreter or shell.
 */
export async function safeExtractText(
  input: string | ArrayBuffer | Uint8Array,
  fileName: string
): Promise<{ text: string; coverage: CoverageStatus; byteLength: number }> {
  const validation = validateFileType(fileName);
  let rawText = '';
  let byteLength = 0;

  if (typeof input === 'string') {
    rawText = input;
    byteLength = new TextEncoder().encode(input).length;
  } else if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
    const uint8 = input instanceof Uint8Array ? input : new Uint8Array(input);
    byteLength = uint8.byteLength;
    const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
    rawText = decoder.decode(uint8);
  }

  // Handle PDF experimental extraction safely (strip binary markers, isolate plain ASCII/UTF8 strings)
  if (validation.detectedExtension === '.pdf') {
    // Basic safe stream extraction: filter printable ASCII / UTF8 text streams without executing PDF javascript
    const printableOnly = rawText.replace(/[^\x20-\x7E\t\r\n]/g, ' ');
    return {
      text: printableOnly,
      coverage: 'EXPERIMENTAL',
      byteLength
    };
  }

  return {
    text: rawText,
    coverage: validation.coverage,
    byteLength
  };
}

