import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Column } from '@slickgrid-universal/common';
import { Formatters } from '@slickgrid-universal/common';
import { ExcelExportService } from '../excelExport.service.js';

// Real-world data generators
class DataGenerator {
  static generateLargeDataset(size: number) {
    const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Automotive'];
    const statuses = ['Active', 'Inactive', 'Pending', 'Discontinued'];
    const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Global Corp', 'Local Ltd'];
    
    return Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      sku: `SKU-${String(i + 1).padStart(6, '0')}`,
      name: `Product ${i + 1}`,
      description: `This is a detailed description for product ${i + 1}. It contains multiple sentences with various details about the product features, specifications, and benefits. This text is intentionally long to simulate real-world product descriptions that can be quite verbose and contain special characters like & < > " ' and unicode characters like ñ, é, ü, 中文, العربية, русский.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.round((Math.random() * 999.99 + 0.01) * 100) / 100,
      cost: Math.round((Math.random() * 499.99 + 0.01) * 100) / 100,
      margin: Math.round(Math.random() * 50 * 100) / 100,
      stock: Math.floor(Math.random() * 1000),
      reserved: Math.floor(Math.random() * 100),
      available: Math.floor(Math.random() * 900),
      reorderPoint: Math.floor(Math.random() * 50),
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      supplierCode: `SUP-${Math.floor(Math.random() * 9999)}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      active: Math.random() > 0.3,
      featured: Math.random() > 0.8,
      onSale: Math.random() > 0.7,
      discount: Math.round(Math.random() * 30 * 100) / 100,
      weight: Math.round((Math.random() * 10 + 0.1) * 100) / 100,
      dimensions: `${Math.floor(Math.random() * 50 + 1)}x${Math.floor(Math.random() * 50 + 1)}x${Math.floor(Math.random() * 50 + 1)}`,
      createdDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      updatedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      lastSoldDate: Math.random() > 0.5 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
      rating: Math.round(Math.random() * 5 * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500),
      tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => 
        ['new', 'popular', 'bestseller', 'limited', 'premium', 'eco-friendly'][Math.floor(Math.random() * 6)]
      ),
      metadata: {
        color: ['Red', 'Blue', 'Green', 'Black', 'White'][Math.floor(Math.random() * 5)],
        size: ['XS', 'S', 'M', 'L', 'XL'][Math.floor(Math.random() * 5)],
        material: ['Cotton', 'Polyester', 'Leather', 'Metal', 'Plastic'][Math.floor(Math.random() * 5)]
      }
    }));
  }

  static generateComplexColumns(): Column[] {
    return [
      { id: 'id', field: 'id', name: 'ID', width: 60 },
      { id: 'sku', field: 'sku', name: 'SKU', width: 120 },
      { id: 'name', field: 'name', name: 'Product Name', width: 200 },
      { id: 'description', field: 'description', name: 'Description', width: 300 },
      { id: 'category', field: 'category', name: 'Category', width: 120 },
      { 
        id: 'price', 
        field: 'price', 
        name: 'Price', 
        formatter: Formatters.currency,
        params: { currencyPrefix: '$', decimalPlaces: 2 },
        width: 100 
      },
      { 
        id: 'cost', 
        field: 'cost', 
        name: 'Cost', 
        formatter: Formatters.currency,
        params: { currencyPrefix: '$', decimalPlaces: 2 },
        width: 100 
      },
      { 
        id: 'margin', 
        field: 'margin', 
        name: 'Margin %', 
        formatter: Formatters.percent,
        width: 100 
      },
      { id: 'stock', field: 'stock', name: 'Stock', formatter: Formatters.decimal, width: 80 },
      { id: 'reserved', field: 'reserved', name: 'Reserved', formatter: Formatters.decimal, width: 80 },
      { id: 'available', field: 'available', name: 'Available', formatter: Formatters.decimal, width: 80 },
      { id: 'reorderPoint', field: 'reorderPoint', name: 'Reorder Point', width: 100 },
      { id: 'supplier', field: 'supplier', name: 'Supplier', width: 150 },
      { id: 'supplierCode', field: 'supplierCode', name: 'Supplier Code', width: 120 },
      { id: 'status', field: 'status', name: 'Status', width: 100 },
      { 
        id: 'active', 
        field: 'active', 
        name: 'Active', 
        formatter: Formatters.translateBoolean,
        width: 80 
      },
      { 
        id: 'featured', 
        field: 'featured', 
        name: 'Featured', 
        formatter: Formatters.checkmarkMaterial,
        width: 80 
      },
      { 
        id: 'onSale', 
        field: 'onSale', 
        name: 'On Sale', 
        formatter: Formatters.checkmarkMaterial,
        width: 80 
      },
      { 
        id: 'discount', 
        field: 'discount', 
        name: 'Discount %', 
        formatter: Formatters.percent,
        width: 100 
      },
      { 
        id: 'weight', 
        field: 'weight', 
        name: 'Weight (kg)', 
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        width: 100 
      },
      { id: 'dimensions', field: 'dimensions', name: 'Dimensions', width: 120 },
      { 
        id: 'createdDate', 
        field: 'createdDate', 
        name: 'Created Date', 
        formatter: Formatters.dateIso,
        width: 120 
      },
      { 
        id: 'updatedDate', 
        field: 'updatedDate', 
        name: 'Updated Date', 
        formatter: Formatters.dateIso,
        width: 120 
      },
      { 
        id: 'lastSoldDate', 
        field: 'lastSoldDate', 
        name: 'Last Sold Date', 
        formatter: Formatters.dateIso,
        width: 120 
      },
      { 
        id: 'rating', 
        field: 'rating', 
        name: 'Rating', 
        formatter: Formatters.decimal,
        params: { decimalPlaces: 1 },
        width: 80 
      },
      { id: 'reviewCount', field: 'reviewCount', name: 'Reviews', formatter: Formatters.decimal, width: 80 },
      { 
        id: 'tags', 
        field: 'tags', 
        name: 'Tags', 
        formatter: (row, cell, value) => Array.isArray(value) ? value.join(', ') : '',
        width: 150 
      },
      { 
        id: 'color', 
        field: 'metadata.color', 
        name: 'Color', 
        formatter: Formatters.complexObject,
        width: 80 
      },
      { 
        id: 'size', 
        field: 'metadata.size', 
        name: 'Size', 
        formatter: Formatters.complexObject,
        width: 80 
      },
      { 
        id: 'material', 
        field: 'metadata.material', 
        name: 'Material', 
        formatter: Formatters.complexObject,
        width: 100 
      }
    ];
  }
}

describe('Real-World Testing Scenarios', () => {
  let service: ExcelExportService;
  
  const mockGrid = {
    getOptions: vi.fn(),
    getColumns: vi.fn(),
    getData: vi.fn(),
    getDataItem: vi.fn(),
    getDataLength: vi.fn(),
    getUID: vi.fn(() => 'test-grid'),
    getContainerNode: vi.fn(() => document.createElement('div')),
  } as any;

  const mockDataView = {
    getLength: vi.fn(),
    getItem: vi.fn(),
    getItems: vi.fn(),
    getItemMetadata: vi.fn(),
  } as any;

  const mockTranslateService = {
    translate: vi.fn((key: string) => key),
    getCurrentLanguage: vi.fn(() => 'en'),
  } as any;

  beforeEach(() => {
    service = new ExcelExportService();
    (service as any)._grid = mockGrid;
    (service as any)._dataView = mockDataView;
    (service as any)._translateService = mockTranslateService;

    // Mock successful worker
    global.Worker = class MockWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      
      constructor() {}
      
      postMessage(data: any) {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { 
              data: { 
                type: 'CHUNK_PROCESSED', 
                chunkId: data.chunkId, 
                processedRows: data.rows.map((row: any[]) => 
                  row.map((cell, colIndex) => {
                    // Simulate formatter processing
                    const column = data.columns[colIndex];
                    if (column?.formatter === 'BUILTIN:currency') {
                      return `$${Number(cell).toFixed(2)}`;
                    } else if (column?.formatter === 'BUILTIN:percent') {
                      return `${Number(cell).toFixed(1)}%`;
                    } else if (column?.formatter === 'BUILTIN:decimal') {
                      return Number(cell).toFixed(2);
                    } else if (column?.formatter === 'BUILTIN:dateIso') {
                      return cell ? new Date(cell).toISOString().split('T')[0] : '';
                    } else if (column?.formatter === 'BUILTIN:translateBoolean') {
                      return cell ? 'Yes' : 'No';
                    } else if (column?.formatter === 'BUILTIN:checkmarkMaterial') {
                      return cell ? '✓' : '';
                    }
                    return String(cell || '');
                  })
                ) 
              } 
            }));
          }
        }, Math.random() * 50 + 10); // Simulate variable processing time
      }
      
      terminate() {}
    } as any;

    global.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    } as any;
  });

  afterEach(() => {
    service.dispose();
    vi.clearAllMocks();
  });

  describe('Large Dataset Scenarios', () => {
    it('should handle 50,000 rows with complex formatters', async () => {
      const largeData = DataGenerator.generateLargeDataset(50000);
      const complexColumns = DataGenerator.generateComplexColumns();

      mockGrid.getColumns.mockReturnValue(complexColumns);
      mockDataView.getLength.mockReturnValue(largeData.length);
      mockDataView.getItem.mockImplementation((index: number) => largeData[index]);

      const startTime = performance.now();
      
      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, complexColumns, {
        useWebWorker: true,
        workerChunkSize: 2000,
        maxConcurrentChunks: 4,
        exportWithFormatter: true
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      console.log(`Processed 50,000 rows in ${processingTime.toFixed(2)}ms`);
      console.log(`Average: ${(processingTime / largeData.length * 1000).toFixed(3)}ms per row`);

      expect(outputData.length).toBe(largeData.length);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
    }, 60000); // 60 second timeout

    it('should handle 100,000 rows with minimal formatters', async () => {
      const veryLargeData = DataGenerator.generateLargeDataset(100000);
      const minimalColumns: Column[] = [
        { id: 'id', field: 'id', name: 'ID' },
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'price', field: 'price', name: 'Price', formatter: Formatters.currency },
        { id: 'active', field: 'active', name: 'Active', formatter: Formatters.translateBoolean }
      ];

      mockGrid.getColumns.mockReturnValue(minimalColumns);
      mockDataView.getLength.mockReturnValue(veryLargeData.length);
      mockDataView.getItem.mockImplementation((index: number) => veryLargeData[index]);

      const startTime = performance.now();
      
      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, minimalColumns, {
        useWebWorker: true,
        workerChunkSize: 5000,
        maxConcurrentChunks: 6,
        exportWithFormatter: true
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      console.log(`Processed 100,000 rows in ${processingTime.toFixed(2)}ms`);
      
      expect(outputData.length).toBe(veryLargeData.length);
      expect(processingTime).toBeLessThan(60000); // Should complete within 60 seconds
    }, 120000); // 120 second timeout
  });

  describe('Complex Data Type Scenarios', () => {
    it('should handle special characters and unicode in data', async () => {
      const specialData = [
        { 
          id: 1, 
          name: 'Product with "quotes" & <tags>', 
          description: 'Contains special chars: ñ, é, ü, 中文, العربية, русский, 🚀',
          price: 99.99 
        },
        { 
          id: 2, 
          name: 'Line\nBreak\tTab', 
          description: 'Multi\nline\ndescription\twith\ttabs',
          price: 149.50 
        },
        { 
          id: 3, 
          name: 'Null & Undefined Test', 
          description: null,
          price: undefined 
        }
      ];

      const columns: Column[] = [
        { id: 'id', field: 'id', name: 'ID' },
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'description', field: 'description', name: 'Description' },
        { id: 'price', field: 'price', name: 'Price', formatter: Formatters.currency }
      ];

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(specialData.length);
      mockDataView.getItem.mockImplementation((index: number) => specialData[index]);

      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, columns, {
        useWebWorker: true,
        exportWithFormatter: true
      });

      expect(outputData.length).toBe(specialData.length);
      
      // Verify special characters are handled
      expect(outputData[0][1]).toContain('quotes');
      expect(outputData[0][2]).toContain('中文');
      expect(outputData[1][1]).toContain('Line');
      expect(outputData[2][3]).toBe('$0.00'); // undefined price should become $0.00
    });

    it('should handle deeply nested object properties', async () => {
      const nestedData = [
        {
          id: 1,
          product: {
            details: {
              specifications: {
                weight: 2.5,
                dimensions: { width: 10, height: 20, depth: 5 }
              }
            }
          },
          supplier: {
            company: { name: 'ACME Corp', location: { country: 'USA', city: 'New York' } }
          }
        }
      ];

      const columns: Column[] = [
        { id: 'id', field: 'id', name: 'ID' },
        { 
          id: 'weight', 
          field: 'product.details.specifications.weight', 
          name: 'Weight',
          formatter: Formatters.complexObject
        },
        { 
          id: 'company', 
          field: 'supplier.company.name', 
          name: 'Supplier',
          formatter: Formatters.complexObject
        }
      ];

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(nestedData.length);
      mockDataView.getItem.mockImplementation((index: number) => nestedData[index]);

      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, columns, {
        useWebWorker: true,
        exportWithFormatter: true
      });

      expect(outputData.length).toBe(nestedData.length);
      expect(outputData[0][1]).toBe('2.5');
      expect(outputData[0][2]).toBe('ACME Corp');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle memory pressure scenarios', async () => {
      // Simulate memory pressure by creating large objects
      const memoryIntensiveData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        largeText: 'A'.repeat(1000), // 1KB per row
        moreText: 'B'.repeat(500),
        evenMoreText: 'C'.repeat(500)
      }));

      const columns: Column[] = [
        { id: 'id', field: 'id', name: 'ID' },
        { id: 'largeText', field: 'largeText', name: 'Large Text' },
        { id: 'moreText', field: 'moreText', name: 'More Text' },
        { id: 'evenMoreText', field: 'evenMoreText', name: 'Even More Text' }
      ];

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(memoryIntensiveData.length);
      mockDataView.getItem.mockImplementation((index: number) => memoryIntensiveData[index]);

      const outputData: any[] = [];
      await expect(
        (service as any).pushAllGridRowDataToArray(outputData, columns, {
          useWebWorker: true,
          workerChunkSize: 500, // Smaller chunks for memory management
          maxConcurrentChunks: 2,
          exportWithFormatter: true
        })
      ).resolves.not.toThrow();

      expect(outputData.length).toBe(memoryIntensiveData.length);
    });

    it('should handle concurrent export requests', async () => {
      const data = DataGenerator.generateLargeDataset(5000);
      const columns = DataGenerator.generateComplexColumns().slice(0, 10); // Limit columns

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(data.length);
      mockDataView.getItem.mockImplementation((index: number) => data[index]);

      // Start 3 concurrent exports
      const exportPromises = Array.from({ length: 3 }, async (_, i) => {
        const outputData: any[] = [];
        await (service as any).pushAllGridRowDataToArray(outputData, columns, {
          useWebWorker: true,
          workerChunkSize: 1000,
          maxConcurrentChunks: 2,
          exportWithFormatter: true
        });
        return { exportId: i, rowCount: outputData.length };
      });

      const results = await Promise.all(exportPromises);
      
      results.forEach((result, index) => {
        expect(result.exportId).toBe(index);
        expect(result.rowCount).toBe(data.length);
      });
    });
  });
});
