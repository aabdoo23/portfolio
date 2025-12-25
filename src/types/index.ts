/**
 * Type definitions for the portfolio application
 * These types ensure type safety across the application
 */

// ============================================
// Image & Media Types
// ============================================

export interface Image {
  /** Image URL (can be external or local path) */
  url: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Optional description displayed below the image */
  description?: string;
}

// ============================================
// Configuration Types
// ============================================

export interface MusicConfig {
  playlistId: string;
  playlistName: string;
}

export interface PhotoAlbumConfig {
  albumUrl: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: readonly string[];
}

// ============================================
// Main Config Type
// ============================================

export interface UserConfig {
  // SEO Configuration (music/photoAlbum are fetched from Supabase at runtime)
  seo: SEOConfig;
}

// ============================================
// Component Prop Types
// ============================================

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface DraggableWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: WindowPosition;
  initialSize?: WindowSize;
  className?: string;
}

export interface AppLayoutProps {
  initialBg: string;
  backgroundMap: Record<string, string>;
}

// ============================================
// Chat/Terminal Types
// ============================================

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatHistory {
  messages: Message[];
  input: string;
}

// ============================================
// Photo Album Types
// ============================================

export interface PhotoAlbum {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  photos: readonly Image[];
}

// ============================================
// App State Types
// ============================================

export type AppId = 'notes' | 'music' | 'photoAlbum';

export interface ActiveApps {
  notes: boolean;
  music: boolean;
  photoAlbum: boolean;
}
