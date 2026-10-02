import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { AuditLog, InventoryAdjustment } from '../db/types';

export class SystemRepository {
  constructor(public db: SQLiteDatabase) {}

  async getUnsyncedAuditLogs(shopId?: string): Promise<AuditLog[]> {
    const safeShopId = shopId ? shopId.toString().trim() : undefined;
    const query = safeShopId
      ? 'SELECT * FROM AuditLog WHERE syncStatus = 0 AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)'
      : 'SELECT * FROM AuditLog WHERE syncStatus = 0';
    const params = safeShopId ? [safeShopId, safeShopId, safeShopId] : [];
    const results = await this.db.executeSql(query, params);
    const logs: AuditLog[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = typeof (rows as any).item === 'function' ? rows.item(i) : (rows as any)[i];
        if (item) logs.push(item);
      }
    }
    return logs;
  }

  async markAuditLogSynced(id: string) {
    await this.db.executeSql('UPDATE AuditLog SET syncStatus = 1 WHERE id = ?', [id]);
  }

  async getUnsyncedAdjustments(shopId?: string): Promise<InventoryAdjustment[]> {
    const safeShopId = shopId ? shopId.toString().trim() : undefined;
    const query = safeShopId
      ? 'SELECT * FROM InventoryAdjustment WHERE syncStatus = 0 AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)'
      : 'SELECT * FROM InventoryAdjustment WHERE syncStatus = 0';
    const params = safeShopId ? [safeShopId, safeShopId, safeShopId] : [];
    const results = await this.db.executeSql(query, params);
    const adjustments: InventoryAdjustment[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = typeof (rows as any).item === 'function' ? rows.item(i) : (rows as any)[i];
        if (item) adjustments.push(item);
      }
    }
    return adjustments;
  }

  async markAdjustmentSynced(id: string) {
    await this.db.executeSql('UPDATE InventoryAdjustment SET syncStatus = 1 WHERE id = ?', [id]);
  }
}
