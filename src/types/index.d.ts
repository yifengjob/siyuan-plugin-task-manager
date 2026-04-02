export type DocumentId = string;
export type BlockId = string;
export type NotebookId = string;
export type PreviousID = BlockId;
export type ParentID = BlockId | DocumentId;

export interface Notebook {
  id: NotebookId;
  name: string;
  icon: string;
  sort: number;
  closed: boolean;
}

export interface NotebookConf {
  name: string;
  closed: boolean;
  refCreateSavePath: string;
  createDocNameTemplate: string;
  dailyNoteSavePath: string;
  dailyNoteTemplatePath: string;
}

export type BlockType =
  | 'd'
  | 's'
  | 'h'
  | 't'
  | 'i'
  | 'p'
  | 'f'
  | 'audio'
  | 'video'
  | 'other';

export type BlockSubType =
  | 'd1'
  | 'd2'
  | 's1'
  | 's2'
  | 's3'
  | 't1'
  | 't2'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'table'
  | 'task'
  | 'toggle'
  | 'latex'
  | 'quote'
  | 'html'
  | 'code'
  | 'footnote'
  | 'cite'
  | 'collection'
  | 'bookmark'
  | 'attachment'
  | 'comment'
  | 'mindmap'
  | 'spreadsheet'
  | 'calendar'
  | 'image'
  | 'audio'
  | 'video'
  | 'other';

export interface Block {
  id: BlockId;
  parent_id?: BlockId;
  root_id: DocumentId;
  hash: string;
  box: string;
  path: string;
  hpath: string;
  name: string;
  alias: string;
  memo: string;
  tag: string;
  content: string;
  fcontent?: string;
  markdown: string;
  length: number;
  type: BlockType;
  subtype: BlockSubType;
  /**
   * string of { [key: string]: string }
   * For instance: "{: custom-type=\"query-code\" id=\"20230613234017-zkw3pr0\" updated=\"20230613234509\"}"
   */
  ial?: string;
  sort: number;
  created: string;
  updated: string;
}
export interface File {
  path: string;
  name: string;
  icon: string;
  name1: string;
  alias: string;
  memo: string;
  bookmark: string;
  id: string;
  count: number;
  size: number;
  hSize: string;
  mtime: number;
  ctime: number;
  hMtime: string;
  hCtime: string;
  sort: number;
  subFileCount: number;
  hidden: boolean;
  newFlashcardCount: number;
  dueFlashcardCount: number;
  flashcardCount: number;
}
export interface BlockInfo {
  box: string;
  path: string;
  rootChildID?: string;
  rootID: string;
  rootIcon: string;
  rootTitle: string;
}

export interface doOperation {
  action: string;
  data: string;
  id: BlockId;
  parentID: BlockId | DocumentId;
  previousID: BlockId;
  retData: null;
}

export interface Window {
  siyuan: {
    notebooks: any;
    menus: any;
    dialogs: any;
    blockPanels: any;
    storage: any;
    user: any;
    ws: any;
    languages: any;
  };
  _sy_plugin_boilerplate: {
    [key: string]: any;
  };
}

export interface Task {
  id: string;
  box: string;
  boxTitle: string;
  hpath: string;
  rootId: string;
  rootTitle: string;
  content: string;
  markdown: string;
  created: string;
  updated: string;
  attrs: TaskAttrs;
}

export interface TaskAttrs {
  start: string;
  planDue: string;
  actualDue: string;
  priority: 'high' | 'medium' | 'normal' | 'low' | string;
  notes: string;
  completed: boolean;
}

export interface PluginConfig {
  defaultProgressGroup: 'all' | 'completed' | 'incomplete' | string;
  autoHidePopoverDelay: number;
  filteredNotebooks: string[];
  filteredBlocks: string[];
  datetimeFormatPattern: string;
}

export interface PluginInfo {
  version: string;
  author: string;
  name: string;
  description: string;
}

export interface PopoverOptions {
  taskId: string;
  referenceEl: HTMLElement;
  isEditable: boolean;
  attrs: TaskAttrs | null;
  createdDate: string | null;
  referencePoint?: {
    x: number;
    y: number;
  };
}

interface I18n {
  [key: string]: string;
}
interface RadioGroupOption {
  label: string;
  value: string | number;
  checked: boolean;
}
export enum SyFrontendTypes {
  // 桌面端
  'desktop' = 'desktop',
  'desktop-window' = 'desktop-window',
  // 移动端
  'mobile' = 'mobile',
  // 浏览器 - 桌面端
  'browser-desktop' = 'browser-desktop',
  // 浏览器 - 移动端
  'browser-mobile' = 'browser-mobile',
}

interface AppComponentMethods {
  showPopover: (options: PopoverOptions) => void;
  hidePopover: () => void;
}

type AppComponent = ComponentPublicInstance & AppComponentMethods;
