/**
 * Main configuration file
 * This file combines all modular configuration files into a single userConfig export
 * 
 * Note: Music playlists, photo albums, notes, and SEO config are managed dynamically through Supabase.
 * The config values here serve as fallback defaults if database values are not available.
 * 
 * To customize your website, edit the individual files in src/config/
 * instead of editing this file directly:
 * - site.ts: SEO and theme configuration (fallback defaults)
 */

import type { UserConfig } from '../types';
import { seo } from './site';

/**
 * Combined user configuration
 * This is the main configuration object used throughout the application.
 * Dynamic content (music, photos, notes) is fetched from Supabase at runtime.
 */
export const userConfig: UserConfig = {
  seo,
} as const;

// Export individual modules for granular imports if needed
export { seo };
