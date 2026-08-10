import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { defineConfig } from 'cypress';

interface ReadLatestXlsxTaskOptions {
  downloadsFolder: string;
  minModifiedTime?: number;
  timeoutMs?: number;
  maxDataRows?: number;
}

interface ParsedXlsxExport {
  fileName: string;
  sheetName: string;
  rowCount: number;
  header: string[];
  firstDataRow: string[];
  dataRows: string[][];
}

function isExcelExportFile(fileName: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  return lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xlxs');
}

function decodeXmlEntities(input: string): string {
  return input.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'");
}

function extractZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  const eocdSignature = 0x06054b50;
  const centralSignature = 0x02014b50;
  const localSignature = 0x04034b50;

  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset < 0) {
    throw new Error('Invalid XLSX file: end of central directory not found');
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let cursor = centralDirectoryOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (buffer.readUInt32LE(cursor) !== centralSignature) {
      throw new Error('Invalid XLSX file: central directory entry signature mismatch');
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const fileName = buffer.toString('utf8', cursor + 46, cursor + 46 + fileNameLength);

    if (buffer.readUInt32LE(localHeaderOffset) !== localSignature) {
      throw new Error(`Invalid XLSX file: local header signature mismatch for "${fileName}"`);
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);

    let fileData: Buffer;
    if (compressionMethod === 0) {
      fileData = Buffer.from(compressedData);
    } else if (compressionMethod === 8) {
      fileData = zlib.inflateRawSync(compressedData);
    } else {
      throw new Error(`Unsupported XLSX compression method "${compressionMethod}" in "${fileName}"`);
    }

    entries.set(fileName, fileData);
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function parseSharedStrings(sharedStringsXml: string): string[] {
  const output: string[] = [];
  const regex = /<si[\s\S]*?<\/si>/g;
  const textRegex = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  const stringItems = sharedStringsXml.match(regex) || [];

  for (const item of stringItems) {
    const textParts: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = textRegex.exec(item)) !== null) {
      textParts.push(decodeXmlEntities(match[1]));
    }
    output.push(textParts.join(''));
  }

  return output;
}

function parseSheetRowValues(sheetXml: string, sharedStrings: string[], rowNumber: number): string[] {
  const rowRegex = new RegExp(`<row[^>]*r="${rowNumber}"[^>]*>([\\s\\S]*?)<\\/row>`);
  const rowMatch = sheetXml.match(rowRegex);
  if (!rowMatch) {
    return [];
  }

  const rowBody = rowMatch[1];
  const cellRegex = /<c([^>]*)>([\s\S]*?)<\/c>/g;
  const values: string[] = [];
  let cellMatch: RegExpExecArray | null;

  while ((cellMatch = cellRegex.exec(rowBody)) !== null) {
    const attrs = cellMatch[1] || '';
    const body = cellMatch[2] || '';
    const cellTypeMatch = attrs.match(/\st="([^"]+)"/);
    const cellType = cellTypeMatch?.[1] || '';

    if (cellType === 's') {
      const valueMatch = body.match(/<v>(\d+)<\/v>/);
      const stringIndex = valueMatch ? Number(valueMatch[1]) : NaN;
      values.push(Number.isFinite(stringIndex) ? sharedStrings[stringIndex] || '' : '');
      continue;
    }

    if (cellType === 'inlineStr') {
      const inlineMatch = body.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/);
      values.push(inlineMatch ? decodeXmlEntities(inlineMatch[1]) : '');
      continue;
    }

    if (cellType === 'b') {
      const boolValueMatch = body.match(/<v>([01])<\/v>/);
      values.push(boolValueMatch?.[1] === '1' ? 'TRUE' : 'FALSE');
      continue;
    }

    const rawValueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
    values.push(rawValueMatch ? decodeXmlEntities(rawValueMatch[1]) : '');
  }

  return values;
}

function parseXlsxExport(filePath: string, maxDataRows = 10): ParsedXlsxExport {
  const zipBuffer = fs.readFileSync(filePath);
  const entries = extractZipEntries(zipBuffer);

  const workbookXml = entries.get('xl/workbook.xml')?.toString('utf8') || '';
  const sheetNameMatch = workbookXml.match(/<sheet[^>]*name="([^"]+)"/);
  const sheetName = decodeXmlEntities(sheetNameMatch?.[1] || '');
  if (!sheetName) {
    throw new Error(`No worksheet found in exported file "${path.basename(filePath)}"`);
  }

  const firstSheetXml = entries.get('xl/worksheets/sheet1.xml')?.toString('utf8') || '';
  if (!firstSheetXml) {
    throw new Error(`Missing worksheet payload "xl/worksheets/sheet1.xml" in "${path.basename(filePath)}"`);
  }

  const sharedStringsXml = entries.get('xl/sharedStrings.xml')?.toString('utf8') || '';
  const sharedStrings = sharedStringsXml ? parseSharedStrings(sharedStringsXml) : [];

  const header = parseSheetRowValues(firstSheetXml, sharedStrings, 1);
  const firstDataRow = parseSheetRowValues(firstSheetXml, sharedStrings, 2);
  const rowCountMatches = [...firstSheetXml.matchAll(/<row\b/g)];
  const dataRows = Array.from({ length: Math.max(0, maxDataRows) }, (_unused, index) =>
    parseSheetRowValues(firstSheetXml, sharedStrings, index + 2)
  );

  return {
    fileName: path.basename(filePath),
    sheetName,
    rowCount: rowCountMatches.length,
    header,
    firstDataRow,
    dataRows,
  };
}

function getLatestXlsxFile(downloadsFolder: string, minModifiedTime = 0): string | undefined {
  if (!fs.existsSync(downloadsFolder)) {
    return undefined;
  }

  const xlsxEntries = fs
    .readdirSync(downloadsFolder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isExcelExportFile(entry.name))
    .map((entry) => {
      const filePath = path.join(downloadsFolder, entry.name);
      return {
        filePath,
        mtimeMs: fs.statSync(filePath).mtimeMs,
      };
    })
    .filter((entry) => entry.mtimeMs >= minModifiedTime)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return xlsxEntries[0]?.filePath;
}

export default defineConfig({
  allowCypressEnv: false,
  video: false,
  projectId: 'p5zxx6',
  viewportWidth: 1200,
  viewportHeight: 1050,
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  defaultCommandTimeout: 5000,
  pageLoadTimeout: 90000,
  // In headless/CI runs, keeping snapshots in memory can accumulate across many specs.
  // Use 0 to keep memory usage lower and reduce flaky runner stalls.
  numTestsKeptInMemory: 0,
  experimentalMemoryManagement: true,
  scrollBehavior: 'nearest',
  retries: {
    experimentalStrategy: 'detect-flake-and-pass-on-threshold',
    experimentalOptions: {
      maxRetries: 2,
      passesRequired: 1,
    },

    // you must also explicitly set openMode and runMode to
    // either true or false when using experimental retries
    openMode: false, // Cypress UI
    runMode: true, // run in CI
  },
  e2e: {
    baseUrl: 'http://localhost:8888/#',
    experimentalRunAllSpecs: true,
    supportFile: 'test/cypress/support/index.ts',
    specPattern: 'test/cypress/e2e/**/*.cy.ts',
    testIsolation: false,
    setupNodeEvents(on) {
      on('task', {
        clearXlsxDownloads({ downloadsFolder }: { downloadsFolder: string }) {
          if (!fs.existsSync(downloadsFolder)) {
            return 0;
          }

          let removedCount = 0;
          const files = fs.readdirSync(downloadsFolder, { withFileTypes: true });
          for (const file of files) {
            if (file.isFile() && isExcelExportFile(file.name)) {
              try {
                fs.unlinkSync(path.join(downloadsFolder, file.name));
                removedCount += 1;
              } catch (error) {
                const errorCode = (error as NodeJS.ErrnoException)?.code;
                if (errorCode !== 'EBUSY' && errorCode !== 'EPERM') {
                  throw error;
                }
              }
            }
          }

          return removedCount;
        },

        async readLatestXlsxExport({
          downloadsFolder,
          minModifiedTime = 0,
          timeoutMs = 10000,
          maxDataRows = 10,
        }: ReadLatestXlsxTaskOptions): Promise<ParsedXlsxExport> {
          const startTime = Date.now();

          while (Date.now() - startTime <= timeoutMs) {
            const latestFilePath =
              getLatestXlsxFile(downloadsFolder, minModifiedTime) ||
              // Fallback for Windows/CI timestamp precision or delayed metadata updates.
              getLatestXlsxFile(downloadsFolder, 0);
            if (latestFilePath) {
              return parseXlsxExport(latestFilePath, maxDataRows);
            }

            await new Promise((resolve) => setTimeout(resolve, 250));
          }

          throw new Error(`No .xlsx export found in "${downloadsFolder}" within ${timeoutMs}ms`);
        },
      });

      on('before:browser:launch', (browser, launchOptions) => {
        if (['chrome', 'edge'].includes(browser.name)) {
          if (browser.isHeadless) {
            launchOptions.args.push('--no-sandbox');
            launchOptions.args.push('--disable-gl-drawing-for-tests');
            launchOptions.args.push('--disable-gpu');
            launchOptions.args.push('--disable-dev-shm-usage');
          }
        }
        return launchOptions;
      });
    },
  },
});
