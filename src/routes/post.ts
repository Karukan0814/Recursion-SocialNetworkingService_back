const router = require("express").Router();
const jwt = require("jsonwebtoken");

import { Request, Response } from "express";

import { NotificationType, PrismaClient } from "@prisma/client";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";
import { registerNotification } from "../lib/util";

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
          replyToId: null,
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
          user: true,
        },
      });

      console.log(posts);
      // 投稿がない場合は空の配列を返す
      if (!posts.length) {
        return res.status(200).json([]);
      }
      // console.log({ posts });
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
          replyToId: null,
        },
        orderBy: queryOrder,
        include: {
          post: true,
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
          replies: true,
          post: true, // 親ポストを含める
        },
      });

      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//ユーザーポストリスト取得API(ユーザーが投稿したポストの最新順)
router.get(
  "/search/userPosts",
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
        console.log("Invalid userId", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      // replyToIdの存在と型を検証
      const replyToId: number = parseInt(req.query.replyToId as string);
      // if (!isNaN(replyToId) || replyToId > 0) {

      // }

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
          userId: userId,
          replyToId: replyToId ? replyToId : null,
        },
        orderBy: queryOrder,
        include: {
          user: true,
          likes: true,
          replies: true,
          post: true, // 親ポストを含める
        },
      });

      // console.log(posts);
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//ユーザーリプライリスト取得API(ユーザーが投稿したリプライの最新順)
router.get(
  "/search/userReplies",
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
        console.log("Invalid userId", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      // replyToIdの存在と型を検証
      const replyToId: number = parseInt(req.query.replyToId as string);
      // if (!isNaN(replyToId) || replyToId > 0) {

      // }

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
          userId: userId,
          replyToId: {
            not: null,
          },
        },
        orderBy: queryOrder,
        include: {
          user: true,
          likes: true,
          replies: true,
          post: true, // 親ポストを含める
        },
      });

      // console.log(posts);
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//ユーザーいいねリスト取得API(ユーザーがいいねしたポストの最新順)
router.get(
  "/search/userLikes",
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
        console.log("Invalid userId", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      // replyToIdの存在と型を検証
      const replyToId: number = parseInt(req.query.replyToId as string);
      // if (!isNaN(replyToId) || replyToId > 0) {

      // }

      //そのユーザーリスト＋ユーザー本人の投稿ポストを最新順で取得

      const skip = (page - 1) * count; // ページ番号からskip数を計算
      let queryOrder: any = [
        {
          createdAt: "desc", // 新着順に並べ替える
        },
      ];

      const posts = await prisma.postLike.findMany({
        take: count,
        skip: skip,
        where: {
          userId: userId,
        },
        orderBy: queryOrder,
        include: {
          user: true,
          post: {
            include: {
              user: true,
              likes: true,
              replies: {
                select: { id: true }, // only fetches reply IDs
              },
            },
          },
        },
      });

      console.log(posts);
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
    let { text, img, userId, replyToId, scheduledAt } = req.body;
    console.log({ text, img, userId, replyToId });
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

      // scheduledAt のバリデーションと処理
      if (scheduledAt && isNaN(Date.parse(scheduledAt))) {
        res.status(400).json({ error: "Invalid scheduledAt date format" });
        return;
      }
      // scheduledAt ? new Date(scheduledAt) : null
      // const convertedScheduledAt=scheduledAt ? new Date(scheduledAt) : null

      const sentAt = scheduledAt ? null : new Date();

      const result = await prisma.post.create({
        data: {
          text,
          img,
          userId,
          replyToId,
          scheduledAt,
          sentAt,
        },
        include: {
          user: true,
          likes: true,
          replies: true,
          post: true,
        },
      });

      //誰かのポストへのリプライだった場合、親ポストを投稿したユーザーに通知する
      if (replyToId && result.post?.userId) {
        const newNotification = await registerNotification(
          NotificationType.REPLY,
          result.post?.userId,
          userId,
          replyToId
        );
      }

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
          post: {
            include: {
              user: true,
              likes: true,
              replies: true,
            },
          },
          user: true,
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
      console.log(post);
      res.status(200).json(post);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//like登録機能
router.post(
  "/like/register",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      let { postId, userId, like } = req.body;
      console.log("/like/register", { postId, userId, like });
      // postIdと userId を数値に変換（失敗した場合は NaN が返される）
      postId = parseInt(postId);
      userId = parseInt(userId);

      // like をブール値に変換
      if (like === true || like === "true") {
        like = true;
      }
      if (like === false || like === "false") {
        like = false;
      }

      // 型チェック
      if (isNaN(postId) || isNaN(userId) || typeof like !== "boolean") {
        res
          .status(400)
          .json({ error: "Invalid types for postId, userId, or like" });
        return;
      }

      //そのユーザーの当該ポストに紐づくlike情報が存在するか確認// そのユーザーのいいねが存在するか確認
      const likeInfoList = await prisma.postLike.findMany({
        where: {
          postId: postId,
          userId: userId,
        },
      });
      const likeExist = likeInfoList.length > 0;
      console.log({ postId, userId, like, likeExist });

      if (like) {
        if (!likeExist) {
          // まだいいねのレコードが存在していないときのみ登録
          const result = await prisma.postLike.create({
            data: {
              post: { connect: { id: postId } }, // ポストにリレーション
              user: { connect: { id: userId } }, // ユーザーにリレーション
            },
            include: {
              post: {
                include: {
                  user: true,
                },
              },
            },
          });

          //新規にいいねされたことをそのポストを投稿したユーザーに通知する
          const newNotification = await registerNotification(
            NotificationType.Like,
            result.post.userId,
            userId,
            result.post.id
          );
        }
      } else {
        // likeがfalseの場合、ArticleLikeを削除する

        if (likeExist) {
          // いいねが存在すれば削除
          const deleteResult = await prisma.postLike.deleteMany({
            where: {
              postId: postId,
              userId: userId,
            },
          });
        }
      }
      // いいねが登録された後、現在のいいね数を取得
      const likeCount = await prisma.postLike.count({
        where: { postId: postId },
      });

      res.status(200).json(likeCount);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering like");
    }
  }
);

//キーワード関連ポストリスト取得API(キーワードに関連するポストの最新順)
router.get(
  "/search/keyword",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      console.log("/search/keyword");
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt

      console.log(req.query);
      const keyword = req.query.keyword as string;
      if (!keyword) {
        return res.status(400).json({ error: "keyword is required" });
      }
      const keywordPattern = `%${keyword}%`; //SQL検索用

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
          // replyToId: null,
          text: {
            contains: keywordPattern,
          },
        },
        orderBy: queryOrder,
        include: {
          user: true,
          likes: true,
          replies: true,
          post: true, // 親ポストを含める
        },
      });

      // console.log(posts);
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//ポスト削除機能
router.delete(
  "/delete",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.query.postId as string); // リクエストから記事のIDを取得
      const userId = parseInt(req.query.userId as string); // リクエストからユーザーのIDを取得
      console.log("/delete/post", { postId, userId });

      if (!postId || !userId) {
        res.status(400).json({ error: " postId and userId are required" });
        return;
      }

      // 記事の userId を取得
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
      });
      console.log("post", post);
      if (!post) {
        res.status(404).json({ error: `post with ID: ${postId} not found` });
        return;
      }

      if (post.userId !== userId) {
        //TODO　管理者だった場合は許可

        // ポスト作成者でなかった場合、エラー
        res.status(403).json({
          error: "Permission denied: You are not the owner of this post",
        });
        return;
      }

      // userId が一致する場合（または管理者の場合のみ）以下の削除を行う

      // トランザクション開始
      await prisma.$transaction(async (prisma) => {
        //TODO　関連リプライも一括削除すべきか
        await prisma.postLike.deleteMany({
          where: {
            postId,
          },
        });
        console.log("いいね削除");

        await prisma.post.delete({
          where: {
            id: postId,
          },
        });
      });
      res.status(200).send(`Post with ID: ${postId} deleted successfully`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error deleting article" });
    }
  }
);

module.exports = router;
