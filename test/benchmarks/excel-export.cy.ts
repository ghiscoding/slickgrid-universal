interface BenchmarkWindow extends Window {
  ExcelExportBenchmark: {
    runBenchmark(rows: number, columns: number, chunkSize?: number): Promise<unknown>;
  };
}

describe('Excel export browser profiling', () => {
  before(() => {
    cy.visit('test/benchmarks/excel-export.html');
  });

  for (const label of ['before', 'after']) {
    it(`profiles ${label} with the same workload`, () => {
      cy.readFile(`test/benchmarks/dist/excel-export-${label}.js`).then((source) => {
        cy.window().then((win) => {
          win.eval(source);
        });
      });
      cy.window().then({ timeout: 120000 }, async (win) => {
        const benchmark = (win as unknown as BenchmarkWindow).ExcelExportBenchmark;
        const chunkSize = label === 'before' ? 1000 : undefined;
        await benchmark.runBenchmark(100, 20, chunkSize);
      });
      cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Profiler.enable' }));
      cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Profiler.start' }));
      cy.window()
        .then({ timeout: 120000 }, async (win) => {
          const benchmark = (win as unknown as BenchmarkWindow).ExcelExportBenchmark;
          const samples = [];
          for (let sample = 0; sample < 3; sample++) {
            samples.push(await benchmark.runBenchmark(5000, 20, label === 'before' ? 1000 : undefined));
          }
          return samples;
        })
        .then((samples) => {
          expect(samples).to.have.length(3);
          cy.writeFile(`test/benchmarks/dist/excel-export-browser-${label}.json`, samples);
        });
      cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Profiler.stop' })).then(({ profile }) => {
        cy.writeFile(`test/benchmarks/dist/excel-export-browser-${label}.cpuprofile`, profile);
      });
    });
  }
});
