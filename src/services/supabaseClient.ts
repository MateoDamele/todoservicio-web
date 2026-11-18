import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConnectionConfig } from '../types/todoservicio';

const CONFIG_STORAGE_KEY = 'todoservicio_supabase_config_v1';

export function getSavedSupabaseConfig(): SupabaseConnectionConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (envUrl && envAnon) {
    return { url: envUrl, anonKey: envAnon, enabled: true };
  }

  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseConnectionConfig;
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        enabled: Boolean(parsed.enabled && parsed.url && parsed.anonKey),
      };
    }
  } catch {
    // ignore storage parse error
  }

  return { url: '', anonKey: '', enabled: false };
}

export function saveSupabaseConfig(config: SupabaseConnectionConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSavedSupabaseConfig();
  if (!cfg.enabled || !cfg.url || !cfg.anonKey) {
    cachedClient = null;
    cachedKey = '';
    return null;
  }

  const key = `${cfg.url}::${cfg.anonKey}`;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    cachedKey = key;
  }

  return cachedClient;
}
