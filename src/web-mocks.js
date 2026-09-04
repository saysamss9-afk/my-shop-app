import React from 'react';

// --- Web SQL Engine Mock V2 ---
// This mock simulates a SQLite database using localStorage for the PWA version.
// It is designed to be robust enough to handle the repository logic of My Shop.

const STORAGE_KEY = 'myshop_local_db_v2';

const loadData = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Failed to load DB from localStorage', e);
        return {};
    }
};

const saveData = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save DB to localStorage', e);
    }
};

const executeSqlMock = async (sql, params = []) => {
    // Normalize SQL: remove newlines, tabs, and double spaces.
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();
    const upperSql = normalizedSql.toUpperCase();

    console.log('WebSQL Mock (V2):', normalizedSql, params);

    const data = loadData();

    // 1. CREATE TABLE
    if (upperSql.startsWith('CREATE TABLE')) {
        const parts = normalizedSql.split(' ');
        const tableName = parts[2].split('(')[0].toLowerCase();
        if (!data[tableName]) {
            data[tableName] = [];
            saveData(data);
        }
        return [{ rows: { length: 0, item: () => null } }];
    }

    // 2. INSERT OR REPLACE / INSERT
    if (upperSql.startsWith('INSERT')) {
        const parts = normalizedSql.match(/INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
        if (parts) {
            const tableName = parts[1].toLowerCase();
            const columns = parts[2].split(',').map(c => c.trim());
            const valuePlaceholders = parts[3].split(',').map(v => v.trim());

            if (!data[tableName]) data[tableName] = [];

            const row = {};
            let paramIndex = 0;

            valuePlaceholders.forEach((placeholder, index) => {
                const colName = columns[index];
                if (placeholder === '?') {
                    row[colName] = params[paramIndex++];
                } else {
                    // Literal value in SQL (e.g. 0 or 'string')
                    let literal = placeholder;
                    if (literal.startsWith("'") && literal.endsWith("'")) {
                        literal = literal.substring(1, literal.length - 1);
                    } else if (!isNaN(Number(literal))) {
                        literal = Number(literal);
                    }
                    row[colName] = literal;
                }
            });

            // Handle Primary Key (assumed to be 'id')
            const existingIndex = data[tableName].findIndex(r => String(r.id) === String(row.id));
            if (existingIndex > -1) {
                data[tableName][existingIndex] = { ...data[tableName][existingIndex], ...row };
            } else {
                data[tableName].push(row);
            }

            saveData(data);
            return [{ rowsAffected: 1, insertId: row.id }];
        }
    }

    // 3. SELECT
    if (upperSql.startsWith('SELECT')) {
        const fromMatch = normalizedSql.match(/FROM\s+(\w+)/i);
        if (fromMatch) {
            const tableName = fromMatch[1].toLowerCase();
            let results = [...(data[tableName] || [])];

            // Handle WHERE clause (Parameterized or Literal)
            const whereMatch = normalizedSql.match(/WHERE\s+(\w+)\s*=\s*(\?|'[^']*'|\d+)/i);
            if (whereMatch) {
                const col = whereMatch[1];
                const valPart = whereMatch[2];
                let filterVal;

                if (valPart === '?') {
                    filterVal = params[0];
                } else if (valPart.startsWith("'")) {
                    filterVal = valPart.substring(1, valPart.length - 1);
                } else {
                    filterVal = Number(valPart);
                }

                results = results.filter(r => String(r[col]) === String(filterVal));
            }

            // Handle ORDER BY
            if (upperSql.includes('ORDER BY')) {
                const orderParts = normalizedSql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
                if (orderParts) {
                    const col = orderParts[1];
                    const dir = orderParts[2].toUpperCase();
                    results.sort((a, b) => {
                        const valA = a[col] ?? '';
                        const valB = b[col] ?? '';
                        if (valA < valB) return dir === 'ASC' ? -1 : 1;
                        if (valA > valB) return dir === 'ASC' ? 1 : -1;
                        return 0;
                    });
                }
            }

            return [{
                rows: {
                    length: results.length,
                    item: (index) => results[index]
                }
            }];
        }
    }

    // 4. UPDATE
    if (upperSql.startsWith('UPDATE')) {
        const updateMatch = normalizedSql.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(\w+)\s*=\s*(\?|'[^']*'|\d+)/i);
        if (updateMatch) {
            const tableName = updateMatch[1].toLowerCase();
            const setClause = updateMatch[2];
            const whereCol = updateMatch[3];
            const whereValPart = updateMatch[4];

            let whereVal;
            if (whereValPart === '?') {
                whereVal = params[params.length - 1];
            } else if (whereValPart.startsWith("'")) {
                whereVal = whereValPart.substring(1, whereValPart.length - 1);
            } else {
                whereVal = Number(whereValPart);
            }

            if (data[tableName]) {
                let affected = 0;
                data[tableName] = data[tableName].map(row => {
                    if (String(row[whereCol]) === String(whereVal)) {
                        affected++;
                        // Parse set clause (handles col=val and col=?)
                        const sets = setClause.split(',');
                        sets.forEach((s, i) => {
                            const [col, valPart] = s.split('=').map(x => x.trim());
                            if (valPart === '?') {
                                row[col] = params[i];
                            } else {
                                let literal = valPart;
                                if (literal.startsWith("'")) literal = literal.substring(1, literal.length - 1);
                                else if (!isNaN(Number(literal))) literal = Number(literal);
                                row[col] = literal;
                            }
                        });
                    }
                    return row;
                });
                saveData(data);
                return [{ rowsAffected: affected }];
            }
        }
    }

    // 5. DELETE
    if (upperSql.startsWith('DELETE')) {
        const deleteMatch = normalizedSql.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*(\?|'[^']*'|\d+)/i);
        if (deleteMatch) {
            const tableName = deleteMatch[1].toLowerCase();
            const whereCol = deleteMatch[2];
            const whereValPart = deleteMatch[3];

            let whereVal;
            if (whereValPart === '?') whereVal = params[0];
            else if (whereValPart.startsWith("'")) whereVal = whereValPart.substring(1, whereValPart.length - 1);
            else whereVal = Number(whereValPart);

            if (data[tableName]) {
                const initialLen = data[tableName].length;
                data[tableName] = data[tableName].filter(r => String(r[whereCol]) !== String(whereVal));
                saveData(data);
                return [{ rowsAffected: initialLen - data[tableName].length }];
            }
        }
    }

    return [{ rows: { length: 0, item: () => null } }];
};

export const SQLite = {
  enablePromise: () => {},
  openDatabase: async () => ({
    executeSql: executeSqlMock,
    transaction: (cb) => {
        const tx = { executeSql: executeSqlMock };
        return Promise.resolve(cb(tx));
    },
  }),
};

export const enablePromise = () => {};
export const openDatabase = async () => SQLite.openDatabase();

// Mocks for other native modules
export const RNPrint = {
  print: async () => console.log('Print not supported on web'),
};

export const Camera = () => null;
export const useCameraDevice = () => null;
export const useCameraPermission = () => ({ hasPermission: true, requestPermission: async () => true });
export const useCodeScanner = () => null;

/**
 * Utility to flatten React Native style arrays for use in standard DOM style attributes.
 */
const flattenStyle = (style) => {
    if (!style) return {};
    if (!Array.isArray(style)) return style;
    return style.reduce((acc, curr) => {
        return { ...acc, ...(Array.isArray(curr) ? flattenStyle(curr) : curr) };
    }, {});
};

// Icons Mock
export const MaterialCommunityIcons = ({ name, size, color, style }) => {
    const flatStyle = flattenStyle(style);
    return (
        <i
            className={`mdi mdi-${name}`}
            style={{
                fontSize: size,
                color: color,
                ...flatStyle
            }}
        />
    );
};

export default MaterialCommunityIcons;
