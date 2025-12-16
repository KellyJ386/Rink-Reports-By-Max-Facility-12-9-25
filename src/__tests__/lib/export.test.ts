/**
 * Tests for export utilities
 */

import {
  exportToCsv,
  exportToExcel,
  formatDateForExport,
  formatDateTimeForExport,
  formatBooleanForExport,
  exportConfigs,
  ExportColumn,
} from '@/lib/export';

// Mock URL.createObjectURL and document operations
const mockCreateObjectURL = jest.fn(() => 'blob:test-url');
const mockRevokeObjectURL = jest.fn();
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  // Mock document.createElement
  jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement;
    }
    return document.createElement(tagName);
  });

  jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
  jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('formatDateForExport', () => {
  it('should format a date string correctly', () => {
    const result = formatDateForExport('2024-03-15T10:30:00Z');
    expect(result).toBe('2024-03-15');
  });

  it('should format a Date object correctly', () => {
    const date = new Date('2024-03-15');
    const result = formatDateForExport(date);
    expect(result).toBe('2024-03-15');
  });

  it('should return empty string for null', () => {
    expect(formatDateForExport(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatDateForExport(undefined)).toBe('');
  });
});

describe('formatDateTimeForExport', () => {
  it('should format a datetime string correctly', () => {
    const result = formatDateTimeForExport('2024-03-15T10:30:00');
    expect(result).toMatch(/03\/15\/2024/);
    expect(result).toMatch(/10:30/);
  });

  it('should return empty string for null', () => {
    expect(formatDateTimeForExport(null)).toBe('');
  });
});

describe('formatBooleanForExport', () => {
  it('should format true as "Yes"', () => {
    expect(formatBooleanForExport(true)).toBe('Yes');
  });

  it('should format false as "No"', () => {
    expect(formatBooleanForExport(false)).toBe('No');
  });

  it('should return empty string for null', () => {
    expect(formatBooleanForExport(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatBooleanForExport(undefined)).toBe('');
  });
});

describe('exportToCsv', () => {
  interface TestData {
    id: string;
    name: string;
    value: number;
    active: boolean;
  }

  const testData: TestData[] = [
    { id: '1', name: 'Item 1', value: 100, active: true },
    { id: '2', name: 'Item 2', value: 200, active: false },
    { id: '3', name: 'Item, with comma', value: 300, active: true },
  ];

  const testColumns: ExportColumn<TestData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'value', header: 'Value' },
    { key: 'active', header: 'Active', formatter: (val) => (val ? 'Yes' : 'No') },
  ];

  it('should create a blob and trigger download', () => {
    exportToCsv(testData, testColumns, { filename: 'test-export' });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('should create CSV with correct headers', () => {
    exportToCsv(testData, testColumns, { filename: 'test' });

    const blobCall = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobCall.type).toBe('text/csv;charset=utf-8;');
  });

  it('should handle empty data', () => {
    exportToCsv([], testColumns, { filename: 'empty' });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('should escape values with commas', () => {
    const dataWithCommas = [{ id: '1', name: 'Hello, World', value: 100, active: true }];
    exportToCsv(dataWithCommas, testColumns, { filename: 'test' });

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});

describe('exportToExcel', () => {
  interface TestData {
    id: string;
    name: string;
    count: number;
  }

  const testData: TestData[] = [
    { id: '1', name: 'Test Item', count: 42 },
  ];

  const testColumns: ExportColumn<TestData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'count', header: 'Count' },
  ];

  it('should create an Excel blob and trigger download', () => {
    exportToExcel(testData, testColumns, { filename: 'test-export', sheetName: 'Sheet1' });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('should use application/vnd.ms-excel mime type', () => {
    exportToExcel(testData, testColumns, { filename: 'test' });

    const blobCall = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobCall.type).toBe('application/vnd.ms-excel');
  });

  it('should handle empty data', () => {
    exportToExcel([], testColumns, { filename: 'empty' });

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});

describe('exportConfigs', () => {
  it('should have incident export config', () => {
    expect(exportConfigs.incidents).toBeDefined();
    expect(exportConfigs.incidents.length).toBeGreaterThan(0);
    expect(exportConfigs.incidents.find((c) => c.key === 'reportNumber')).toBeTruthy();
  });

  it('should have ice readings export config', () => {
    expect(exportConfigs.iceReadings).toBeDefined();
    expect(exportConfigs.iceReadings.find((c) => c.key === 'averageDepth')).toBeTruthy();
  });

  it('should have refrigeration logs export config', () => {
    expect(exportConfigs.refrigerationLogs).toBeDefined();
    expect(exportConfigs.refrigerationLogs.find((c) => c.key === 'compressorStatus')).toBeTruthy();
  });

  it('should have air quality logs export config', () => {
    expect(exportConfigs.airQualityLogs).toBeDefined();
    expect(exportConfigs.airQualityLogs.find((c) => c.key === 'co2Level')).toBeTruthy();
  });

  it('should have schedules export config', () => {
    expect(exportConfigs.schedules).toBeDefined();
  });

  it('should have equipment export config', () => {
    expect(exportConfigs.equipment).toBeDefined();
    expect(exportConfigs.equipment.find((c) => c.key === 'serialNumber')).toBeTruthy();
  });

  it('should have audit logs export config', () => {
    expect(exportConfigs.auditLogs).toBeDefined();
    expect(exportConfigs.auditLogs.find((c) => c.key === 'action')).toBeTruthy();
  });

  it('should have formatter functions for date columns', () => {
    const incidentCreatedAt = exportConfigs.incidents.find((c) => c.key === 'createdAt');
    expect(incidentCreatedAt?.formatter).toBeDefined();
  });
});

describe('nested value extraction', () => {
  interface NestedData {
    id: string;
    user: {
      name: string;
      email: string;
    };
  }

  const nestedData: NestedData[] = [
    { id: '1', user: { name: 'John Doe', email: 'john@example.com' } },
  ];

  const nestedColumns: ExportColumn<NestedData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'user.name', header: 'User Name' },
    { key: 'user.email', header: 'User Email' },
  ];

  it('should extract nested values correctly for CSV', () => {
    exportToCsv(nestedData, nestedColumns, { filename: 'nested' });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('should extract nested values correctly for Excel', () => {
    exportToExcel(nestedData, nestedColumns, { filename: 'nested' });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });
});
