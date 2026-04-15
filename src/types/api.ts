import {
  BlockId,
  BlockSubType,
  BlockType,
  doOperation,
  File,
  Notebook,
  NotebookConf,
  NotebookId,
} from '@/types';

export enum DataType {
  dom = 'dom',
  markdown = 'markdown',
}

export interface IResBootProgress {
  details: string;
  progress: number;
}

export interface IResdoOperations {
  doOperations: doOperation[];
  undoOperations: doOperation[] | null;
}

export interface IResExportMdContent {
  content: string;
  hPath: string;
}

export interface IResExportResources {
  path: string;
}

export interface IResForwardProxy {
  body: string;
  contentType: string;
  elapsed: number;
  headers: { [key: string]: string };
  status: number;
  url: string;
}

export interface IResGetBlockKramdown {
  id: BlockId;
  kramdown: string;
}

export interface IResGetChildBlock {
  id: BlockId;
  subtype?: BlockSubType;
  type: BlockType;
}

export interface IResGetNotebookConf {
  box: string;
  conf: NotebookConf;
  name: string;
}
export interface IResGetTemplates {
  content: string;
  path: string;
}
export interface IResListDocs {
  box: NotebookId;
  files: File[];
}

export interface IReslsNotebooks {
  notebooks: Notebook[];
}

export interface IResOpFile {
  code: number;
  data: null;
  msg: string;
}

export interface IResReadDir {
  isDir: boolean;
  isSymlink: boolean;
  name: string;
}

export interface IResUpload {
  errFiles: string[];
  succMap: { [key: string]: string };
}

export type PandocArgs = string;
