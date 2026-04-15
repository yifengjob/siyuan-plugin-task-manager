import { Placement } from '@floating-ui/dom';
import { ComponentPublicInstance } from 'vue';

import { FilterStatus } from '@/constants';

export enum SyFrontendTypes {
  // 浏览器 - 桌面端
  'browser-desktop' = 'browser-desktop',
  // 浏览器 - 移动端
  'browser-mobile' = 'browser-mobile',
  // 桌面端
  'desktop' = 'desktop',
  'desktop-window' = 'desktop-window',
  // 移动端
  'mobile' = 'mobile',
}
export type AppComponent = AppComponentMethods & ComponentPublicInstance;
export interface Block {
  alias: string;
  box: string;
  content: string;
  created: string;
  fcontent?: string;
  hash: string;
  hpath: string;
  ial?: string;
  id: BlockId;
  length: number;
  markdown: string;
  memo: string;
  name: string;
  parent_id?: BlockId;
  path: string;
  root_id: DocumentId;
  sort: number;
  subtype: BlockSubType;
  tag: string;
  type: BlockType;
  updated: string;
}
export type BlockId = string;
export interface BlockInfo {
  box: string;
  path: string;
  rootChildID?: string;
  rootIcon: string;
  rootID: string;
  rootTitle: string;
}

export type BlockSubType =
  | 'attachment'
  | 'audio'
  | 'bookmark'
  | 'calendar'
  | 'cite'
  | 'code'
  | 'collection'
  | 'comment'
  | 'd1'
  | 'd2'
  | 'footnote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'html'
  | 'image'
  | 'latex'
  | 'mindmap'
  | 'other'
  | 'quote'
  | 's1'
  | 's2'
  | 's3'
  | 'spreadsheet'
  | 't1'
  | 't2'
  | 'table'
  | 'task'
  | 'toggle'
  | 'video';

export type BlockType = 'audio' | 'd' | 'f' | 'h' | 'i' | 'other' | 'p' | 's' | 't' | 'video';

export type DocumentId = string;

export interface doOperation {
  action: string;
  data: string;
  id: BlockId;
  parentID: BlockId | DocumentId;
  previousID: BlockId;
  retData: null;
}

export interface File {
  alias: string;
  bookmark: string;
  count: number;
  ctime: number;
  dueFlashcardCount: number;
  flashcardCount: number;
  hCtime: string;
  hidden: boolean;
  hMtime: string;
  hSize: string;
  icon: string;
  id: string;
  memo: string;
  mtime: number;
  name: string;
  name1: string;
  newFlashcardCount: number;
  path: string;
  size: number;
  sort: number;
  subFileCount: number;
}
export interface I18n {
  [key: string]: string;
}
export interface Notebook {
  closed: boolean;
  icon: string;
  id: NotebookId;
  name: string;
  sort: number;
}

export interface NotebookConf {
  closed: boolean;
  createDocNameTemplate: string;
  dailyNoteSavePath: string;
  dailyNoteTemplatePath: string;
  name: string;
  refCreateSavePath: string;
}

export type NotebookId = string;

export type ParentID = BlockId | DocumentId;

export interface PluginConfig {
  autoHidePopoverDelay: number;
  datetimeFormatPattern: string;
  defaultProgressGroup: FilterStatus;
  filteredBlocks: string[];
  filteredNotebooks: string[];
  virtualScrollThreshold: number;
}

export interface PluginInfo {
  author: string;
  description: string;
  name: string;
  version: string;
}

export interface PopoverOptions {
  attrs: null | TaskAttrs;
  createdDate: null | string;
  isEditable: boolean;
  offset?: number;
  placement: Placement;
  referenceEl: HTMLElement;
  referencePoint?: {
    x: number;
    y: number;
  };
  taskId: string;
}

export type PreviousID = BlockId;

export interface RadioGroupOption {
  checked: boolean;
  label: string;
  value: number | string;
}
export interface Task {
  attrs: TaskAttrs;
  box: string;
  boxTitle: string;
  content: string;
  created: string;
  hpath: string;
  id: string;
  markdown: string;
  rootId: string;
  rootTitle: string;
  updated: string;
}
export interface TaskAttrs {
  actualDue: string;
  completed: boolean;
  notes: string;
  planDue: string;
  priority: 'high' | 'low' | 'medium' | 'normal' | string;
  start: string;
}

export interface Window {
  _sy_plugin_boilerplate: {
    [key: string]: any;
  };
  siyuan: {
    blockPanels: any;
    dialogs: any;
    languages: any;
    menus: any;
    notebooks: any;
    storage: any;
    user: any;
    ws: any;
  };
}

interface AppComponentMethods {
  hidePopover: () => void;
  showPopover: (options: PopoverOptions) => void;
}

export * from './api';
export * from './task';
