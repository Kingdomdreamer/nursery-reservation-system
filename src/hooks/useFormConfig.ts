import { useState, useEffect, useCallback } from 'react';
import type { FormConfigResponse } from '@/types';
import { logger, loggedFetch } from '@/lib/utils/logger';

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
    if (!enabled || presetId < 1) {
      logger.debug('FormConfig fetch skipped', { presetId, enabled });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      logger.debug('Fetching form config', { presetId });
      
      // Use logged fetch for automatic monitoring
      const response = await loggedFetch(`/api/form/${presetId}`, undefined, {
        presetId,
        operation: 'fetchFormConfig'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'フォーム設定の読み込みに失敗しました';
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('フォーム設定の読み込みに失敗しました');
      }
      
      logger.debug('Form config loaded successfully', {
        presetId,
        hasProducts: !!result.data.products?.length,
        productsCount: result.data.products?.length || 0,
        hasFormSettings: !!result.data.form_settings
      });
      
      setConfig(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      
      logger.error('Form config fetch failed', err, {
        presetId,
        operation: 'fetchFormConfig'
      });
      
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