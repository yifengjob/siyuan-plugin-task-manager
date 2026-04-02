import { fetchSyncPost, IWebSocketData } from 'siyuan';
import {
  Block,
  BlockId,
  BlockInfo,
  DocumentId,
  Notebook,
  NotebookConf,
  NotebookId,
  ParentID,
  PreviousID,
} from '@/types';
import {
  DataType,
  IResBootProgress,
  IResdoOperations,
  IResExportMdContent,
  IResExportResources,
  IResForwardProxy,
  IResGetBlockKramdown,
  IResGetChildBlock,
  IResGetNotebookConf,
  IResGetTemplates,
  IResListDocs,
  IReslsNotebooks,
  IResReadDir,
  IResUpload,
  PandocArgs,
} from '@/types/api.ts';

export class ApiService {
  /**
   * 转义字符串以防止 SQL 注入
   * @param str 需要转义的字符串
   * @returns 转义后的字符串
   */
  private escapeSql(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }
    // SQLite 特殊字符转义
    return str
      .replace(/'/g, "''") // 单引号转双单引号
      .replace(/"/g, '""') // 双引号转双双引号
      .replace(/\\/g, '\\\\') // 反斜杠转双反斜杠
      .replace(/\0/g, '\\0'); // 空字符转义
  }
  async request(url: string, data: any) {
    const response: IWebSocketData = await fetchSyncPost(url, data);
    return response.code === 0 ? response.data : null;
  }

  async flushTransaction() {
    const url = '/api/sqlite/flushTransaction';
    await fetchSyncPost(url, '');
  }

  // **************************************** Noteboook ****************************************
  async lsNotebooks(): Promise<IReslsNotebooks> {
    const url = '/api/notebook/lsNotebooks';
    return this.request(url, '');
  }

  async openNotebook(notebook: NotebookId) {
    const url = '/api/notebook/openNotebook';
    return this.request(url, { notebook });
  }

  async closeNotebook(notebook: NotebookId) {
    const url = '/api/notebook/closeNotebook';
    return this.request(url, { notebook });
  }

  async renameNotebook(notebook: NotebookId, name: string) {
    const url = '/api/notebook/renameNotebook';
    return this.request(url, {
      notebook,
      name,
    });
  }

  async createNotebook(name: string): Promise<Notebook> {
    const url = '/api/notebook/createNotebook';
    return this.request(url, { name });
  }

  async removeNotebook(notebook: NotebookId) {
    const url = '/api/notebook/removeNotebook';
    return this.request(url, { notebook });
  }

  async getNotebookConf(notebook: NotebookId): Promise<IResGetNotebookConf> {
    const data = { notebook };
    const url = '/api/notebook/getNotebookConf';
    return this.request(url, data);
  }

  async setNotebookConf(
    notebook: NotebookId,
    conf: NotebookConf
  ): Promise<NotebookConf> {
    const data = {
      notebook,
      conf,
    };
    const url = '/api/notebook/setNotebookConf';
    return this.request(url, data);
  }

  // **************************************** File Tree ****************************************
  async createDocWithMd(
    notebook: NotebookId,
    path: string,
    markdown: string
  ): Promise<DocumentId> {
    const data = {
      notebook,
      path,
      markdown,
    };
    const url = '/api/filetree/createDocWithMd';
    return this.request(url, data);
  }

  async renameDoc(
    notebook: NotebookId,
    path: string,
    title: string
  ): Promise<DocumentId> {
    const data = {
      doc: notebook,
      path,
      title,
    };
    const url = '/api/filetree/renameDoc';
    return this.request(url, data);
  }

  async removeDoc(notebook: NotebookId, path: string) {
    const data = {
      notebook,
      path,
    };
    const url = '/api/filetree/removeDoc';
    return this.request(url, data);
  }

  async moveDocs(fromPaths: string[], toNotebook: NotebookId, toPath: string) {
    const data = {
      fromPaths,
      toNotebook,
      toPath,
    };
    const url = '/api/filetree/moveDocs';
    return this.request(url, data);
  }

  async getHPathByPath(notebook: NotebookId, path: string): Promise<string> {
    const data = {
      notebook,
      path,
    };
    const url = '/api/filetree/getHPathByPath';
    return this.request(url, data);
  }

  async getHPathByID(id: BlockId): Promise<string> {
    const data = {
      id,
    };
    const url = '/api/filetree/getHPathByID';
    return this.request(url, data);
  }

  async getIDsByHPath(notebook: NotebookId, path: string): Promise<BlockId[]> {
    const data = {
      notebook,
      path,
    };
    const url = '/api/filetree/getIDsByHPath';
    return this.request(url, data);
  }

  async listDocsByPath(
    notebook: NotebookId,
    path: string
  ): Promise<IResListDocs> {
    const data = {
      notebook,
      path,
    };
    const url = '/api/filetree/listDocsByPath';
    return this.request(url, data);
  }

  // **************************************** Asset Files ****************************************

  async upload(assetsDirPath: string, files: any[]): Promise<IResUpload> {
    const form = new FormData();
    form.append('assetsDirPath', assetsDirPath);
    for (const file of files) {
      form.append('file[]', file);
    }
    const url = '/api/asset/upload';
    return this.request(url, form);
  }

  // **************************************** Block ****************************************

  async insertBlock(
    dataType: DataType,
    data: string,
    nextID?: BlockId,
    previousID?: BlockId,
    parentID?: BlockId
  ): Promise<IResdoOperations[]> {
    const payload = {
      dataType,
      data,
      nextID,
      previousID,
      parentID,
    };
    const url = '/api/block/insertBlock';
    return this.request(url, payload);
  }

  async prependBlock(
    dataType: DataType,
    data: string,
    parentID: BlockId | DocumentId
  ): Promise<IResdoOperations[]> {
    const payload = {
      dataType,
      data,
      parentID,
    };
    const url = '/api/block/prependBlock';
    return this.request(url, payload);
  }

  async appendBlock(
    dataType: DataType,
    data: string,
    parentID: BlockId | DocumentId
  ): Promise<IResdoOperations[]> {
    const payload = {
      dataType,
      data,
      parentID,
    };
    const url = '/api/block/appendBlock';
    return this.request(url, payload);
  }

  async updateBlock(
    dataType: DataType,
    data: string,
    id: BlockId
  ): Promise<IResdoOperations[]> {
    const payload = {
      dataType,
      data,
      id,
    };
    const url = '/api/block/updateBlock';
    return this.request(url, payload);
  }

  async deleteBlock(id: BlockId): Promise<IResdoOperations[]> {
    const data = {
      id,
    };
    const url = '/api/block/deleteBlock';
    return this.request(url, data);
  }

  async moveBlock(
    id: BlockId,
    previousID?: PreviousID,
    parentID?: ParentID
  ): Promise<IResdoOperations[]> {
    const data = {
      id,
      previousID,
      parentID,
    };
    const url = '/api/block/moveBlock';
    return this.request(url, data);
  }

  async getBlockKramdown(id: BlockId): Promise<IResGetBlockKramdown> {
    const data = {
      id,
    };
    const url = '/api/block/getBlockKramdown';
    return this.request(url, data);
  }

  async getBlockMarkdown(blockId: string) {
    // ✅ 使用转义防止 SQL 注入
    const result = await this.sql(
      `SELECT markdown FROM blocks WHERE id = {{id}}`,
      { id: blockId }
    );
    return (result[0]?.markdown as string) ?? null;
  }

  async getBlockCreated(blockId: BlockId) {
    // ✅ 使用转义防止 SQL 注入
    const result = await this.sql(
      `SELECT created FROM blocks WHERE id = {{id}}`,
      { id: blockId }
    );
    return (result[0]?.created as string) ?? null;
  }

  async getBlockInfo(blockId: BlockId): Promise<BlockInfo | null> {
    const data = {
      id: blockId,
    };
    const url = '/api/block/getBlockInfo';
    return this.request(url, data);
  }

  async getChildBlocks(id: BlockId): Promise<IResGetChildBlock[]> {
    const data = {
      id,
    };
    const url = '/api/block/getChildBlocks';
    return this.request(url, data);
  }

  async transferBlockRef(fromID: BlockId, toID: BlockId, refIDs: BlockId[]) {
    const data = {
      fromID,
      toID,
      refIDs,
    };
    const url = '/api/block/transferBlockRef';
    return this.request(url, data);
  }

  async openBlock(blockId: BlockId) {
    window.open(`siyuan://blocks/${blockId}`, '_blank');
  }

  // **************************************** Attributes ****************************************
  async setBlockAttrs(id: BlockId, attrs: { [key: string]: string }) {
    const data = {
      id,
      attrs,
    };
    const url = '/api/attr/setBlockAttrs';
    return this.request(url, data);
  }

  async getBlockAttrs(id: BlockId): Promise<{ [key: string]: string }> {
    const data = {
      id,
    };
    const url = '/api/attr/getBlockAttrs';
    return this.request(url, data);
  }

  // **************************************** SQL ****************************************

  /**
   * 执行 SQL 查询
   * ⚠️ 注意：思源笔记 API 不支持参数化查询，需要手动转义用户输入
   * @param sql SQL 语句模板，使用 {{value}} 作为占位符
   * @param params 参数对象，key 为占位符名称，value 为实际值（会自动转义）
   *
   * @example
   * await sql("SELECT * FROM blocks WHERE id = '{{id}}'", { id: blockId })
   */
  async sql(sql: string, params?: Record<string, any>): Promise<any[]> {
    let finalSql = sql;

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        const escapedValue = this.escapeSql(value);
        finalSql = finalSql.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          `'${escapedValue}'`
        );
      }
    }
    const sqlData = {
      stmt: finalSql,
    };
    const url = '/api/query/sql';
    return this.request(url, sqlData);
  }

  async getBlockByID(blockId: string): Promise<Block> {
    const result = await this.sql(`SELECT * FROM blocks WHERE id = {{id}}`, {
      id: blockId,
    });
    return result[0];
  }

  // **************************************** Template ****************************************

  async render(id: DocumentId, path: string): Promise<IResGetTemplates> {
    const data = {
      id,
      path,
    };
    const url = '/api/template/render';
    return this.request(url, data);
  }

  async renderSprig(template: string): Promise<string> {
    const url = '/api/template/renderSprig';
    return this.request(url, { template });
  }

  // **************************************** File ****************************************

  async getFile(path: string): Promise<any> {
    const data = {
      path,
    };
    const url = '/api/file/getFile';
    try {
      return await fetchSyncPost(url, data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error_msg) {
      return null;
    }
  }

  async putFile(path: string, isDir: boolean, file: any) {
    const form = new FormData();
    form.append('path', path);
    form.append('isDir', isDir.toString());
    form.append('modTime', Math.floor(Date.now() / 1000).toString());
    form.append('file', file);
    const url = '/api/file/putFile';
    return this.request(url, form);
  }

  async removeFile(path: string) {
    const data = {
      path,
    };
    const url = '/api/file/removeFile';
    return this.request(url, data);
  }

  async readDir(path: string): Promise<IResReadDir> {
    const data = {
      path,
    };
    const url = '/api/file/readDir';
    return this.request(url, data);
  }

  // **************************************** Export ****************************************

  async exportMdContent(id: DocumentId): Promise<IResExportMdContent> {
    const data = {
      id,
    };
    const url = '/api/export/exportMdContent';
    return this.request(url, data);
  }

  async exportResources(
    paths: string[],
    name: string
  ): Promise<IResExportResources> {
    const data = {
      paths,
      name,
    };
    const url = '/api/export/exportResources';
    return this.request(url, data);
  }

  // **************************************** Convert ****************************************

  async pandoc(args: PandocArgs[]) {
    const data = {
      args,
    };
    const url = '/api/convert/pandoc';
    return this.request(url, data);
  }

  // **************************************** Notification ****************************************

  async pushMsg(msg: string, timeout: number = 7000) {
    const payload = {
      msg,
      timeout,
    };
    const url = '/api/notification/pushMsg';
    return this.request(url, payload);
  }

  async pushErrMsg(msg: string, timeout: number = 7000) {
    const payload = {
      msg,
      timeout,
    };
    const url = '/api/notification/pushErrMsg';
    return this.request(url, payload);
  }

  // **************************************** Network ****************************************
  async forwardProxy(
    url: string,
    method: string = 'GET',
    payload: any = {},
    headers: any[] = [],
    timeout: number = 7000,
    contentType: string = 'text/html'
  ): Promise<IResForwardProxy> {
    const data = {
      url,
      method,
      timeout,
      contentType,
      headers,
      payload,
    };
    const url1 = '/api/network/forwardProxy';
    return this.request(url1, data);
  }

  // **************************************** System ****************************************

  async bootProgress(): Promise<IResBootProgress> {
    return this.request('/api/system/bootProgress', {});
  }

  async version(): Promise<string> {
    return this.request('/api/system/version', {});
  }

  async currentTime(): Promise<number> {
    return this.request('/api/system/currentTime', {});
  }
}

export const apiService = new ApiService();
