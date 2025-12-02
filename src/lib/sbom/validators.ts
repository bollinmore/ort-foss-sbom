import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

let spdxValidator: ValidateFunction | null = null;
let cycloneDxValidator: ValidateFunction | null = null;

function createAjv(): Ajv {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

// Minimal schemas to gate obvious shape issues; replace with full official schemas when available.
const spdxSchema = {
  $id: 'https://spdx.dev/schema/v2.3',
  type: 'object',
  required: ['spdxVersion', 'documentNamespace', 'files'],
  properties: {
    spdxVersion: { type: 'string' },
    dataLicense: { type: 'string' },
    documentName: { type: 'string' },
    documentNamespace: { type: 'string' },
    files: {
      type: 'array',
      items: {
        type: 'object',
        required: ['fileName', 'checksums'],
        properties: {
          fileName: { type: 'string' },
          checksums: {
            type: 'array',
            items: {
              type: 'object',
              required: ['algorithm', 'checksumValue'],
              properties: {
                algorithm: { type: 'string' },
                checksumValue: { type: 'string' }
              }
            }
          },
          licenseConcluded: { type: 'string' }
        }
      }
    }
  }
};

const cycloneDxSchema = {
  $id: 'https://cyclonedx.org/schema/bom-1.6',
  type: 'object',
  required: ['bomFormat', 'specVersion', 'version', 'components'],
  properties: {
    bomFormat: { type: 'string', const: 'CycloneDX' },
    specVersion: { type: 'string' },
    serialNumber: { type: 'string' },
    version: { type: 'integer' },
    components: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'version', 'type'],
        properties: {
          name: { type: 'string' },
          version: { type: 'string' },
          type: { type: 'string' },
          hashes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['alg', 'content'],
              properties: {
                alg: { type: 'string' },
                content: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

export function getSpdxValidator(): ValidateFunction {
  if (!spdxValidator) {
    const ajv = createAjv();
    spdxValidator = ajv.compile(spdxSchema);
  }
  return spdxValidator;
}

export function getCycloneDxValidator(): ValidateFunction {
  if (!cycloneDxValidator) {
    const ajv = createAjv();
    cycloneDxValidator = ajv.compile(cycloneDxSchema);
  }
  return cycloneDxValidator;
}

export function validateSpdx(doc: unknown): boolean {
  const validator = getSpdxValidator();
  return validator(doc) as boolean;
}

export function validateCycloneDx(doc: unknown): boolean {
  const validator = getCycloneDxValidator();
  return validator(doc) as boolean;
}
