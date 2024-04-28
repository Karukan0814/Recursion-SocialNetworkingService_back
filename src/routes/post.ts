const router = require("express").Router();
const jwt = require("jsonwebtoken");

import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";

//ポスト関連API

//ポストリスト取得API(いいね数が多い順)
router.get(
  "/search/trend",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt
      const whereClause: any = {};

      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - 24 * 3600 * 1000); // 24時間前の日時

      console.log({ count, page, orderBy });

      //その日に最も「いいね」された投稿を降順取得

      let skip = (page - 1) * count; // ページ番号からskip数を計算=スキップして取得しないポスト数
      const posts = await prisma.post.findMany({
        where: {
          createdAt: {
            gte: fromDate,
            lt: toDate,
          },
        },
        orderBy: [
          {
            likes: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: count,
        skip: (page - 1) * count,
        include: {
          likes: true, // いいね数を含める
          replies: true,
        },
      });

      // 投稿がない場合は空の配列を返す
      if (!posts.length) {
        return res.status(200).json([]);
      }
      console.log({ posts });
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//ポストリスト取得API(フォロイー＋自分のポストの最新順)
router.get(
  "/search/followings",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt

      console.log(req.query);
      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.log("userId不正", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      //そのユーザーがフォローしているユーザーリストを取得する
      const userWithFollowings = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          followings: {
            include: {
              following: true, // フォローしているユーザーの詳細情報を取得
            },
          },
        },
      });

      // フォローしているユーザーのリストを抽出
      const followingsIdList = userWithFollowings
        ? userWithFollowings.followings.map((f) => f.following.id)
        : [];
      console.log({ followingsIdList });
      followingsIdList.push(userId); //ユーザー本人のidも追加

      //そのユーザーリスト＋ユーザー本人の投稿ポストを最新順で取得

      const skip = (page - 1) * count; // ページ番号からskip数を計算
      let queryOrder: any = [
        {
          createdAt: "desc", // 新着順に並べ替える
        },
      ];

      const posts = await prisma.post.findMany({
        take: count,
        skip: skip,
        where: {
          userId: {
            in: followingsIdList, // 複数のユーザーIDに紐づく投稿を取得
          },
        },
        orderBy: queryOrder,
        include: {
          user: true,
          replies: true,
          likes: true,
        },
      });

      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//リプライポストリスト取得API(親ポストの返信ポストの最新順)
router.get(
  "/search/replies",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt

      console.log(req.query);
      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.log("userId不正", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      // replyToIdの存在と型を検証
      const replyToId: number = parseInt(req.query.replyToId as string);
      if (isNaN(replyToId) || replyToId <= 0) {
        console.log("replyToId不正", replyToId);

        return res.status(400).json({ error: "replyToId is required" });
      }

      //そのユーザーリスト＋ユーザー本人の投稿ポストを最新順で取得

      const skip = (page - 1) * count; // ページ番号からskip数を計算
      let queryOrder: any = [
        {
          createdAt: "desc", // 新着順に並べ替える
        },
      ];

      const posts = await prisma.post.findMany({
        take: count,
        skip: skip,
        where: {
          replyToId,
        },
        orderBy: queryOrder,
        include: {
          user: true,
          likes: true,
        },
      });

      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//ポスト登録機能
router.post(
  "/register",
  authenticateToken,
  async (req: Request, res: Response) => {
    let { text, img, userId, replyToId } = req.body;
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
      if (!replyToId) {
        replyToId = null;
      }
      if (replyToId !== null && typeof replyToId !== "number") {
        res.status(400).json({ error: "replyToId should be number" });

        return;
      }

      const result = await prisma.post.create({
        data: {
          text,
          img,
          userId,
          replyToId,
        },
      });

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering category");
    }
  }
);

//ポスト情報取得API(IDから当該ポストの最新情報を取得)
router.get(
  "/search/postById",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // postIdの存在と型を検証
      const postId: number = parseInt(req.query.postId as string);
      if (isNaN(postId) || postId <= 0) {
        console.log("postId不正", postId);

        return res.status(400).json({ error: "postId is required" });
      }

      //TODO repliesの取得はいらない可能性あり。検討
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
        include: {
          likes: true,
          replies: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: true,
              likes: true,
            },
          },
        },
      });

      res.status(200).json(post);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

module.exports = router;
