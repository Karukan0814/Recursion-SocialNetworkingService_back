import { query } from "express-validator";
import { body } from "express-validator";
import { ArticleType } from "@prisma/client";

export function validateArticleType(type: string) {
  const validTypes = ["RECIPE", "SHOP", "ONLINE"];
  return validTypes.includes(type);
}

// article/articleCount
export const validateQueryArticleCount = [
  query("type").isIn(Object.values(ArticleType)).optional(), // typeはArticleTypeの値のいずれか
];
// article/search

export const validateQuerySearchComments = [query("articleId").isInt().toInt()];
export const validateQueryArticlesByCategoryId = [
  query("categoryId").isInt().toInt(),
];
export const validateQueryArticlesByUser = [body("userId").isInt().toInt()];
export const validateQueryGetMetaData = [query("url").isString()];
export const validateQueryChackURL = [
  query("url").isString(),
  query("selectedCategories")
    .isArray()
    .withMessage("selectedCategories must be an array")
    .custom((categories) => categories.length > 0 && categories.length <= 3)
    .withMessage("selectedCategories must have a length of 1 to 3"),
  query("selectedCategories.*").isNumeric(),
];
export const validateQueryCategory = [query("categoryId").isInt().toInt()];
