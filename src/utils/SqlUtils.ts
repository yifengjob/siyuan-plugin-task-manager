/**
 * SQL 工具函数
 * 提供 SQL 相关的通用工具方法
 */

/**
 * 构建过滤条件，自动选择最佳方案
 * - 小列表 (< 100): 使用 NOT IN (兼容性更好)
 * - 大列表 (>= 100): 使用 NOT EXISTS + VALUES (性能更好)
 *
 * @param column - 列名
 * @param values - 值数组
 * @param useExists - 强制使用 NOT EXISTS (默认自动选择)
 * @returns WHERE 子句片段
 */
export function buildFilterClause(column: string, values: string[], useExists?: boolean): string {
  if (!values || values.length === 0) {
    return '';
  }

  // 自动选择策略：小列表用 NOT IN，大列表用 NOT EXISTS
  const shouldUseExists = useExists ?? values.length >= 100;

  if (shouldUseExists) {
    const valuesClause = buildValuesClause(values);
    return `AND NOT EXISTS (
      SELECT 1 FROM (VALUES ${valuesClause}) AS t(id)
      WHERE t.id = ${column}
    )`;
  } else {
    return `AND ${buildNotInClause(column, values)}`;
  }
}

/**
 * 安全地构建 SQL IN 子句
 * 自动转义所有值
 *
 * @param column - 列名
 * @param values - 值数组
 * @returns IN 子句字符串
 *
 * @example
 * ```typescript
 * const clause = buildInClause('id', ['1', '2', '3']);
 * // 返回: id IN ('1','2','3')
 * ```
 */
export function buildInClause(column: string, values: string[]): string {
  if (!values || values.length === 0) {
    return '1=0'; // 返回永假条件
  }

  const escapedValues = values.map((v) => `'${escapeSql(v)}'`).join(',');
  return `${column} IN (${escapedValues})`;
}

/**
 * 安全地构建 SQL NOT IN 子句
 * 自动转义所有值
 *
 * @param column - 列名
 * @param values - 值数组
 * @returns NOT IN 子句字符串
 *
 * @example
 * ```typescript
 * const clause = buildNotInClause('id', ['1', '2', '3']);
 * // 返回: id NOT IN ('1','2','3')
 * ```
 */
export function buildNotInClause(column: string, values: string[]): string {
  if (!values || values.length === 0) {
    return '1=1'; // 返回永真条件
  }

  const escapedValues = values.map((v) => `'${escapeSql(v)}'`).join(',');
  return `${column} NOT IN (${escapedValues})`;
}

/**
 * 构建 SQL VALUES 子句
 * 自动转义所有值以防止 SQL 注入
 *
 * @param values - 值数组
 * @returns VALUES 子句字符串
 *
 * @example
 * ```typescript
 * const clause = buildValuesClause(['id1', 'id2', 'id3']);
 * // 返回: ('id1'),('id2'),('id3')
 *
 * const query = `
 *   SELECT * FROM blocks
 *   WHERE NOT EXISTS (
 *     SELECT 1 FROM (VALUES ${clause}) AS t(id)
 *     WHERE t.id = b.id
 *   )
 * `;
 * ```
 */
export function buildValuesClause(values: string[]): string {
  if (!values || values.length === 0) {
    return '';
  }

  return values.map((value) => `('${escapeSql(value)}')`).join(',');
}

/**
 * 转义 LIKE 查询中的特殊字符
 * 用于防止 LIKE 通配符被误解
 *
 * @param str - 需要转义的字符串
 * @param escapeChar - 转义字符，默认为反斜杠
 * @returns 转义后的字符串
 *
 * @example
 * ```typescript
 * const pattern = escapeLike("10% off"); // "10\% off"
 * const query = `SELECT * FROM products WHERE name LIKE '${pattern}'`;
 * ```
 */
export function escapeLike(str: string, escapeChar = '\\'): string {
  if (!str) return str;

  // 先转义转义字符本身
  let result = str.replace(new RegExp(escapeChar, 'g'), escapeChar + escapeChar);
  // 转义 LIKE 通配符
  result = result.replace(/%/g, escapeChar + '%');
  result = result.replace(/_/g, escapeChar + '_');

  return result;
}

/**
 * 转义字符串以防止 SQL 注入
 * 适用于 SQLite 数据库
 *
 * @param str - 需要转义的字符串
 * @returns 转义后的字符串
 *
 * @example
 * ```typescript
 * const safe = escapeSql("O'Reilly"); // "O''Reilly"
 * const query = `SELECT * FROM users WHERE name = '${safe}'`;
 * ```
 */
export function escapeSql(str: string): string {
  if (!str) return str;

  // SQLite 特殊字符转义
  return str
    .replace(/'/g, "''") // 单引号转双单引号
    .replace(/"/g, '""') // 双引号转双双引号
    .replace(/\\/g, '\\\\') // 反斜杠转双反斜杠
    .replace(/\0/g, '\\0'); // 空字符转义
}
