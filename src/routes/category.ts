const router = require("express").Router();
import { Request, Response } from "express";
import { validationResult } from "express-validator";

import { validateQueryCategory } from "../lib/validation";
import { allCategoryId } from "../lib/constant";
import prisma from "../lib/db";

// カテゴリ関連API
//カテゴリ検索機能
router.get(
  "/search",
  validateQueryCategory,

  async (req: Request, res: Response) => {
    const errors = validationResult(req); // バリデーションエラーの取得
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // エラーがある場合は400エラーを返す
    }
    try {
      const categoryId: number = parseInt(req.query.categoryId as string);

      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });
      return res.status(200).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching category");
    }
  }
);
// 全カテゴリ取得機能
router.get("/searchAll", async (req: Request, res: Response) => {
  const withAll = req.query.withAll === "true"; // 文字列として受け取るので、"true" かどうかを判定

  try {
    const result = await prisma.category.findMany({
      where: withAll
        ? {} // withAll が true の場合は条件なし
        : {
            NOT: {
              id: allCategoryId,
            },
          },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching category");
  }
});

module.exports = router;
