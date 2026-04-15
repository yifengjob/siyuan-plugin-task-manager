// src/utils/FrontendDetector.ts
import { getFrontend } from 'siyuan';

import { SyFrontendTypes } from '@/types';

export interface FrontendInfo {
  isBrowser: boolean;
  isElectron: boolean;
  isInWindow: boolean;
  isLocal: boolean;
  isMobile: boolean;
  platform: SyFrontendTypes;
}

export class FrontendDetector {
  static detect(): FrontendInfo {
    const frontEnd = getFrontend() as SyFrontendTypes;

    const isElectron =
      typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');

    return {
      isBrowser: frontEnd.includes('browser'),
      isElectron,
      isInWindow: location.href.includes('window.html'),
      isLocal: location.href.includes('127.0.0.1') || location.href.includes('localhost'),
      isMobile: frontEnd === 'mobile' || frontEnd === 'browser-mobile',
      platform: frontEnd,
    };
  }
}
