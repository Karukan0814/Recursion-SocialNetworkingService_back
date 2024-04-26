const router = require("express").Router();
const jwt = require("jsonwebtoken");

import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";

//ポスト関連API

//ポストリスト取得API
router.get("/search", async (req: Request, res: Response) => {
  try {
    const count: number = parseInt(req.query.count as string) || 6; // クエリパラメータ "count" を数値に変換し、デフォルトは6
    const page: number = parseInt(req.query.page as string) || 1; // ページ番号
    const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt
    const whereClause: any = {};
    console.log({ count, page, orderBy });

    const skip = (page - 1) * count; // ページ番号からskip数を計算
    let queryOrder: any = [
      {
        likes: {
          _count: "desc", // 「いいね」の数が多い順に並べ替える
        },
      },
      {
        createdAt: "desc", // 新着順に並べ替える
      },
    ];

    const posts = await prisma.post.findMany({
      take: count,
      skip: skip,
      where: whereClause,
      orderBy: queryOrder,
      include: {
        replies: true,
        likes: true,
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching posts");
  }
});

//ポスト登録機能
router.post(
  "/register",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { text, img, userId } = req.body;
    console.log({ text, img, userId });
    try {
      //textが空でないか
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "text is required" });
        return;
      }

      //userIdが空でないか
      if (!userId || typeof userId !== "number") {
        res.status(400).json({ error: "userId is required" });

        return;
      }

      const result = await prisma.post.create({
        data: {
          text,
          img,
          userId,
        },
      });

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering category");
    }
  }
);

module.exports = router;
