import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { Category } from '../db/types';

export class CategoryRepository {
  constructor(public db: SQLiteDatabase) {}

  async insertCategory(category: Category) {
    const query = `
      INSERT OR REPLACE INTO Category(id, shopId, name, syncStatus)
      VALUES (?, ?, ?, 0)
    `;
    const params = [category.id, category.shopId, category.name];
    await this.db.executeSql(query, params);
  }

  async getCategoriesByShop(shopId: string): Promise<Category[]> {
    const query = 'SELECT * FROM Category WHERE shopId = ?';
    const results = await this.db.executeSql(query, [shopId]);
    const categories: Category[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      categories.push(results[0].rows.item(i));
    }
    return categories;
  }

  async markCategorySynced(id: string) {
    const query = 'UPDATE Category SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async getUnsyncedCategories(shopId?: string): Promise<Category[]> {
    const query = shopId
      ? 'SELECT * FROM Category WHERE syncStatus = 0 AND shopId = ?'
      : 'SELECT * FROM Category WHERE syncStatus = 0';
    const params = shopId ? [shopId] : [];
    const results = await this.db.executeSql(query, params);
    const categories: Category[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      categories.push(results[0].rows.item(i));
    }
    return categories;
  }

  async updateCategory(id: string, name: string) {
    const query = 'UPDATE Category SET name = ?, syncStatus = 0 WHERE id = ?';
    await this.db.executeSql(query, [name, id]);
  }

  async deleteCategory(id: string) {
    // Set categoryId to NULL for products in this category before deleting
    await this.db.executeSql('UPDATE Product SET categoryId = NULL, syncStatus = 0 WHERE categoryId = ?', [id]);
    const query = 'DELETE FROM Category WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }
}
