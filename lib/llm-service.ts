import type { UseCase } from './optimization-engine';

export async function generateOptimizationSummary(
  result: any,
  teamSize: number,
  primaryUseCase: UseCase,
  timeoutMs: number = 5000
): Promise<{ text: string }> {
  // Mock response for the time being
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: `Based on your team size of ${teamSize} and primary use case of ${primaryUseCase}, we have analyzed your tool stack. You can save up to $${result.totalMonthlySavings}/month by optimizing your configuration.`
      });
    }, 500);
  });
}
