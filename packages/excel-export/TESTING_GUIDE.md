# Web Worker Excel Export Testing Guide

This guide provides comprehensive testing strategies for the web worker functionality implemented in SlickGrid Universal's Excel Export Service.

## 🧪 Test Suite Overview

### Test Files Structure
```
packages/excel-export/src/__tests__/
├── formatterSerializer.spec.ts      # Unit tests for formatter serialization
├── workerManager.spec.ts            # Unit tests for worker management
├── webWorkerIntegration.spec.ts     # Integration tests for complete workflow
├── performance.spec.ts              # Performance benchmarking tests
├── browserCompatibility.spec.ts     # Cross-browser compatibility tests
└── realWorldTesting.spec.ts         # Real-world scenario tests
```

## 🔧 Running Tests

### 1. Unit Testing

**Run all web worker tests:**
```bash
pnpm test excel-export
```

**Run specific test files:**
```bash
# Formatter serialization tests
pnpm vitest packages/excel-export/src/__tests__/formatterSerializer.spec.ts

# Worker manager tests
pnpm vitest packages/excel-export/src/__tests__/workerManager.spec.ts

# Integration tests
pnpm vitest packages/excel-export/src/__tests__/webWorkerIntegration.spec.ts
```

**Run tests in watch mode:**
```bash
pnpm vitest packages/excel-export/src/__tests__/ --watch
```

### 2. Performance Testing

**Run performance benchmarks:**
```bash
pnpm vitest packages/excel-export/src/__tests__/performance.spec.ts --reporter=verbose
```

**Generate performance reports:**
```bash
pnpm vitest packages/excel-export/src/__tests__/performance.spec.ts --reporter=json --outputFile=performance-results.json
```

### 3. Browser Compatibility Testing

**Run compatibility tests:**
```bash
pnpm vitest packages/excel-export/src/__tests__/browserCompatibility.spec.ts
```

**Test with different environments:**
```bash
# Test with jsdom (default)
pnpm vitest packages/excel-export/src/__tests__/browserCompatibility.spec.ts --environment=jsdom

# Test with happy-dom
pnpm vitest packages/excel-export/src/__tests__/browserCompatibility.spec.ts --environment=happy-dom
```

## 📊 Performance Testing

### Benchmarking Commands

**Compare synchronous vs web worker performance:**
```bash
# Run performance comparison
pnpm vitest packages/excel-export/src/__tests__/performance.spec.ts --testNamePattern="benchmark"

# Run with memory profiling
pnpm vitest packages/excel-export/src/__tests__/performance.spec.ts --testNamePattern="memory"
```

### Performance Metrics to Monitor

1. **Processing Time**: Total time to process datasets
2. **Memory Usage**: Peak memory consumption during processing
3. **UI Responsiveness**: Simulated UI update frequency during processing
4. **Chunk Processing**: Time per chunk and optimal chunk sizes
5. **Concurrent Processing**: Performance with multiple concurrent chunks

### Expected Performance Improvements

| Dataset Size | Synchronous Time | Web Worker Time | UI Blocking |
|-------------|------------------|-----------------|-------------|
| 1,000 rows  | ~50ms           | ~80ms           | None        |
| 10,000 rows | ~500ms          | ~300ms          | Minimal     |
| 50,000 rows | ~2.5s           | ~1.2s           | None        |
| 100,000 rows| ~5s             | ~2.5s           | None        |

## 🌐 Browser Testing

### Manual Browser Testing

**Test in different browsers:**
```bash
# Chrome
pnpm dev
# Navigate to http://localhost:3000/demos/vanilla
# Test large dataset export

# Firefox
# Same steps in Firefox

# Safari
# Same steps in Safari

# Edge
# Same steps in Edge
```

### Automated Browser Testing

**Run cross-browser tests:**
```bash
pnpm vitest packages/excel-export/src/__tests__/browserCompatibility.spec.ts
```

### Browser-Specific Issues to Test

1. **Web Worker Support**: Verify worker creation and communication
2. **CSP Restrictions**: Test with strict Content Security Policy
3. **Memory Limits**: Test with browser memory constraints
4. **Performance Variations**: Compare processing times across browsers

## 🔍 Debugging Web Worker Issues

### Debug Tools and Techniques

**1. Enable Debug Logging:**
```typescript
// In your test or demo code
(service as any)._excelExportOptions = {
  useWebWorker: true,
  workerChunkSize: 1000,
  debug: true // Enable debug logging
};
```

**2. Monitor Worker Communication:**
```javascript
// Add to browser console
const originalWorker = window.Worker;
window.Worker = class extends originalWorker {
  constructor(...args) {
    super(...args);
    console.log('Worker created:', args);
    
    const originalPostMessage = this.postMessage;
    this.postMessage = function(data) {
      console.log('Worker message sent:', data);
      return originalPostMessage.call(this, data);
    };
    
    this.addEventListener('message', (event) => {
      console.log('Worker message received:', event.data);
    });
  }
};
```

**3. Test Worker Isolation:**
```bash
# Test individual worker components
pnpm vitest packages/excel-export/src/__tests__/workerManager.spec.ts --testNamePattern="single chunk"
```

### Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Worker not supported | Falls back to sync processing | Check browser compatibility |
| CSP blocking workers | Worker creation fails | Update CSP headers |
| Serialization errors | Formatter not working in worker | Check formatter compatibility |
| Memory issues | Browser crashes/freezes | Reduce chunk size |
| Timeout errors | Worker processing hangs | Increase timeout or reduce data |

## 📈 Real-World Testing

### Large Dataset Testing

**Generate test data:**
```typescript
// Use the DataGenerator from realWorldTesting.spec.ts
const testData = DataGenerator.generateLargeDataset(50000);
const columns = DataGenerator.generateComplexColumns();
```

**Test with actual data:**
```bash
# Run real-world scenarios
pnpm vitest packages/excel-export/src/__tests__/realWorldTesting.spec.ts
```

### Production-Like Testing

**1. Create Production Dataset:**
```typescript
// Create a dataset similar to your production data
const productionLikeData = Array.from({ length: 75000 }, (_, i) => ({
  // Your actual data structure
  id: i,
  // ... other fields with realistic data
}));
```

**2. Test with Production Formatters:**
```typescript
const productionColumns = [
  { 
    id: 'customField', 
    field: 'customField', 
    formatter: (row, cell, value, columnDef, dataContext) => {
      // Your actual custom formatter logic
      return `Custom: ${value}`;
    }
  }
];
```

**3. Stress Testing:**
```bash
# Run stress tests
pnpm vitest packages/excel-export/src/__tests__/realWorldTesting.spec.ts --testNamePattern="stress"
```

## 🚨 Error Scenario Testing

### Test Fallback Mechanisms

**1. Worker Failure Simulation:**
```typescript
// Mock worker that always fails
global.Worker = class FailingWorker {
  constructor() {
    throw new Error('Worker creation failed');
  }
};
```

**2. CSP Restriction Simulation:**
```typescript
// Mock CSP-blocked environment
global.Worker = class CSPBlockedWorker {
  constructor() {
    throw new Error('Content Security Policy: worker-src blocked');
  }
};
```

**3. Memory Pressure Testing:**
```bash
# Run with limited memory simulation
pnpm vitest packages/excel-export/src/__tests__/browserCompatibility.spec.ts --testNamePattern="memory"
```

## 📋 Test Checklist

### Before Release

- [ ] All unit tests pass
- [ ] Performance benchmarks meet expectations
- [ ] Cross-browser compatibility verified
- [ ] Error scenarios handled gracefully
- [ ] Memory usage within acceptable limits
- [ ] Large dataset processing works (50k+ rows)
- [ ] Fallback mechanisms function correctly
- [ ] Custom formatters serialize properly
- [ ] CSP compliance verified

### Continuous Integration

**Add to CI pipeline:**
```yaml
# .github/workflows/test.yml
- name: Run Excel Export Tests
  run: |
    pnpm test excel-export
    pnpm vitest packages/excel-export/src/__tests__/performance.spec.ts --run
    pnpm vitest packages/excel-export/src/__tests__/browserCompatibility.spec.ts --run
```

## 🔧 Custom Test Setup

### Creating Your Own Tests

**1. Basic Test Template:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ExcelExportService } from '../excelExport.service.js';

describe('Custom Excel Export Tests', () => {
  let service: ExcelExportService;
  
  beforeEach(() => {
    service = new ExcelExportService();
    // Setup your mocks and data
  });
  
  it('should handle your specific use case', async () => {
    // Your test implementation
  });
});
```

**2. Performance Test Template:**
```typescript
it('should process your data efficiently', async () => {
  const startTime = performance.now();
  
  // Your processing code
  
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  
  console.log(`Processing time: ${processingTime.toFixed(2)}ms`);
  expect(processingTime).toBeLessThan(5000); // 5 second limit
});
```

This comprehensive testing guide ensures thorough validation of the web worker Excel export functionality across all scenarios and environments.
