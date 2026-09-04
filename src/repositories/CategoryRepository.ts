import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Category } from '../db/types';

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
}
