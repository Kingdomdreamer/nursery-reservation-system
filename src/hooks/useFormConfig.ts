import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '@/lib/services/DatabaseService';
import type { FormConfigResponse } from '@/types';

export interface UseFormConfigOptions {
  enabled?: boolean;
  onError?: (error: string) => void;
}

export interface UseFormConfigReturn {
  config: FormConfigResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFormConfig = (
  presetId: number,
  options: UseFormConfigOptions = {}
): UseFormConfigReturn => {
  const { enabled = true, onError } = options;
  
  const [config, setConfig] = useState<FormConfigResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!enabled || presetId < 1) return;

    try {
      setLoading(true);
      setError(null);
      
      const formConfig = await DatabaseService.getFormConfig(presetId);
      
      if (!formConfig) {
        throw new Error('フォーム設定の読み込みに失敗しました');
      }
      
      setConfig(formConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [presetId, enabled, onError]);

  const refetch = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (enabled) {
      fetchConfig();
    }
  }, [fetchConfig, enabled]);

  return {
    config,
    loading,
    error,
    refetch,
  };
};