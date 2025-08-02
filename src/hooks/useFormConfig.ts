import { useState, useEffect, useCallback } from 'react';
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
      
      // Use API endpoint instead of direct database access
      const response = await fetch(`/api/form/${presetId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'フォーム設定の読み込みに失敗しました');
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('フォーム設定の読み込みに失敗しました');
      }
      
      setConfig(result.data);
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