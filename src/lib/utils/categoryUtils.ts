/**
 * Product category utilities
 * TODO: This should eventually fetch from database instead of hardcoding
 */

export interface CategoryInfo {
  id: number;
  name: string;
}

// TODO: Replace with database query
const CATEGORY_MAP: Record<number, string> = {
  1: '野菜セット',
  2: '果物セット', 
  3: 'お米セット',
};

/**
 * Get category name by ID
 * @param categoryId - Category ID (number or string)
 * @returns Category name in Japanese
 */
export const getCategoryName = (categoryId: number | string): string => {
  const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
  return CATEGORY_MAP[id] || 'その他';
};

/**
 * Get all available categories
 * @returns Array of category info
 */
export const getAllCategories = (): CategoryInfo[] => {
  return Object.entries(CATEGORY_MAP).map(([id, name]) => ({
    id: parseInt(id, 10),
    name,
  }));
};