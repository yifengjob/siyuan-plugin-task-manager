// src/utils/FrontendDetector.ts
import { getFrontend } from 'siyuan';
import { SyFrontendTypes } from '@/types';

export interface FrontendInfo {
  platform: SyFrontendTypes;
  isMobile: boolean;
  isBrowser: boolean;
  isLocal: boolean;
  isInWindow: boolean;
  isElectron: boolean;
}

export class FrontendDetector {
  static detect(): FrontendInfo {
    const frontEnd = getFrontend() as SyFrontendTypes;

    const isElectron =
      typeof navigator !== 'undefined' &&
      navigator.userAgent.toLowerCase().includes('electron');

    return {
      platform: frontEnd,
      isMobile: frontEnd === 'mobile' || frontEnd === 'browser-mobile',
      isBrowser: frontEnd.includes('browser'),
      isLocal:
        location.href.includes('127.0.0.1') ||
        location.href.includes('localhost'),
      isInWindow: location.href.includes('window.html'),
      isElectron,
    };
  }
}
