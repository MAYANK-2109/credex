import type { UseCase, ToolConfig } from './optimization-engine';

export interface FormState {
  teamSize: number;
  primaryUseCase: UseCase;
  selectedTools: ToolConfig[];
}

export const storageUtils = {
  loadState: (): FormState | null => {
    if (typeof window === 'undefined') return null;
    try {
      const state = localStorage.getItem('optimizerState');
      if (state) {
        return JSON.parse(state) as FormState;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return null;
  },
  saveState: (state: FormState): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('optimizerState', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }
};
