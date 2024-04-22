const router = require("express").Router();
import { Request, Response } from "express";

import { validationResult } from "express-validator";
import { validateQuerySearchComments } from "../lib/validation";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";

//記事に対するユーザーアクション情報関連API "/eatfish_back/api/userActions"

//コメント検索機能
router.get(
  "/comment/search",
  validateQuerySearchComments,
  async (req: Request, res: Response) => {
    const errors = validationResult(req); // バリデーションエラーの取得
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // エラーがある場合は400エラーを返す
    }
    try {
      const articleId: number = parseInt(req.query.articleId as string); // クエリパラメータ "count" を数値に変換し、デフォルトは6

      const comments = await prisma.articleComment.findMany({
        where: { articleId },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true, // Articleに紐づくCategory情報を取得
        },
      });

      res.status(200).json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching comments");
    }
  }
);

//コメント登録
router.post(
  "/comment/register",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      // リクエストボディから各値を取得し、型チェックと変換を行う
      let { articleId, userId, comment } = req.body;

      // articleId と userId を数値に変換（失敗した場合は NaN が返される）
      articleId = parseInt(articleId);
      userId = parseInt(userId);

      // 型チェック
      if (isNaN(articleId) || isNaN(userId) || typeof comment !== "string") {
        res
          .status(400)
          .json({ error: "Invalid types for articleId, userId, or comment" });
        return;
      }

      const result = await prisma.articleComment.create({
        data: {
          article: { connect: { id: articleId } }, // 記事にリレーション
          user: { connect: { id: userId } }, // ユーザーにリレーション
          comment,
        },
        include: { user: true }, // ユーザーの詳細情報を取得
      });

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering comment");
    }
  }
);

//いいね登録機能
router.post(
  "/like/register",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      let { articleId, userId, like } = req.body;

      // articleId と userId を数値に変換（失敗した場合は NaN が返される）
      articleId = parseInt(articleId);
      userId = parseInt(userId);

      // like をブール値に変換
      if (like === true || like === "true") {
        like = true;
      }
      if (like === false || like === "false") {
        like = false;
      }

      // 型チェック
      if (isNaN(articleId) || isNaN(userId) || typeof like !== "boolean") {
        res
          .status(400)
          .json({ error: "Invalid types for articleId, userId, or like" });
        return;
      }
      if (like) {
        const result = await prisma.articleLike.create({
          data: {
            article: { connect: { id: articleId } }, // 記事にリレーション
            user: { connect: { id: userId } }, // ユーザーにリレーション
          },
        });
        // いいねが登録された後、現在のいいね数を取得
        const likeCount = await prisma.articleLike.count({
          where: { articleId: articleId },
        });

        res.status(200).json(likeCount);
      } else {
        // likeがfalseの場合、ArticleLikeを削除する

        // そのユーザーのいいねが存在するか確認
        const likeExist = await prisma.articleLike.findMany({
          where: {
            articleId: articleId,
            userId: userId,
          },
        });
        if (likeExist.length > 0) {
          // いいねが存在すれば削除
          const deleteResult = await prisma.articleLike.deleteMany({
            where: {
              articleId: articleId,
              userId: userId,
            },
          });
        }
        // いいねが削除された後、現在のいいね数を取得
        const likeCount = await prisma.articleLike.count({
          where: { articleId: articleId },
        });

        res.status(200).json(likeCount);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering like");
    }
  }
);

// ブックマーク登録機能
router.post(
  "/bookmark/register",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      let { articleId, userId, bookmark } = req.body;

      // articleId と userId を数値に変換（失敗した場合は NaN が返される）
      articleId = parseInt(articleId);
      userId = parseInt(userId);

      // bookmark をブール値に変換
      if (bookmark === true || bookmark === "true") {
        bookmark = true;
      }
      if (bookmark === false || bookmark === "false") {
        bookmark = false;
      }

      // 型チェック
      if (isNaN(articleId) || isNaN(userId) || typeof bookmark !== "boolean") {
        res
          .status(400)
          .json({ error: "Invalid types for articleId, userId, or bookmark" });
        return;
      }

      if (bookmark) {
        const registerResult = await prisma.articleBookmark.create({
          data: {
            article: { connect: { id: articleId } }, // 記事にリレーション
            user: { connect: { id: userId } }, // ユーザーにリレーション
          },
        });

        res.status(200).send("ブックマーク登録成功");
      } else {
        // bookmarkがfalseの場合、ArticleBookmarkを削除する
        // そのユーザーのブックマークが存在するか確認
        const bookmarkExist = await prisma.articleBookmark.findMany({
          where: {
            articleId: articleId,
            userId: userId,
          },
        });
        if (bookmarkExist.length > 0) {
          // ブックマークが存在すれば削除
          const deleteResult = await prisma.articleBookmark.deleteMany({
            where: {
              articleId: articleId,
              userId: userId,
            },
          });
        }

        res.status(200).send("ブックマーク削除成功");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering bookmark");
    }
  }
);

module.exports = router;
