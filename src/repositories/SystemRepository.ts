import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { AuditLog, InventoryAdjustment } from '../db/types';

export class SystemRepository {
  constructor(public db: SQLiteDatabase) {}

  async getUnsyncedAuditLogs(shopId?: string): Promise<AuditLog[]> {
    const query = shopId ? 'SELECT * FROM AuditLog WHERE shopId = ? AND syncStatus = 0' : 'SELECT * FROM AuditLog WHERE syncStatus = 0';
    const params = shopId ? [shopId] : [];
    const results = await this.db.executeSql(query, params);
    const logs: AuditLog[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      logs.push(results[0].rows.item(i));
    }
    return logs;
  }

  async markAuditLogSynced(id: string) {
    await this.db.executeSql('UPDATE AuditLog SET syncStatus = 1 WHERE id = ?', [id]);
  }

  async getUnsyncedAdjustments(shopId?: string): Promise<InventoryAdjustment[]> {
    const query = shopId ? 'SELECT * FROM InventoryAdjustment WHERE shopId = ? AND syncStatus = 0' : 'SELECT * FROM InventoryAdjustment WHERE syncStatus = 0';
    const params = shopId ? [shopId] : [];
    const results = await this.db.executeSql(query, params);
    const adjustments: InventoryAdjustment[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      adjustments.push(results[0].rows.item(i));
    }
    return adjustments;
  }

  async markAdjustmentSynced(id: string) {
    await this.db.executeSql('UPDATE InventoryAdjustment SET syncStatus = 1 WHERE id = ?', [id]);
  }
}
