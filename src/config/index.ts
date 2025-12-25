/**
 * Main configuration file
 * This file combines all modular configuration files into a single userConfig export
 * 
 * Note: Music playlists, photo albums, and notes are managed dynamically through Supabase.
 * Only SEO and theme configuration are stored here (needed for build-time meta tags).
 * 
 * To customize your website, edit the individual files in src/config/
 * instead of editing this file directly:
 * - site.ts: SEO and theme configuration
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
