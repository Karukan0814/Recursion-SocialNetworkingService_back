import express, { Request, Response } from "express";

import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";
import { compressVideo, hashFilename, registerNotification } from "../lib/util";
import { s3, upload } from "../lib/imgHandler";
import { NotificationType } from "@prisma/client";

//ポスト関連API
const router = express.Router();

//TODO　返却値にセキュリティ上問題のあるプロパティを削除して返す

//ポストリスト取得API(いいね数が多い順)
router.get(
  "/search/trend",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号

      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - 24 * 3600 * 1000); // 24時間前の日時

      //その日に最も「いいね」された投稿を降順取得

      const posts = await prisma.post.findMany({
        where: {
          createdAt: {
            gte: fromDate,
            lt: toDate,
          },
          replyToId: null,
          sentAt: {
            not: null, // 'sentAt'がnullではない=既に送信された投稿を取得
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
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
        },
      });

      // 投稿がない場合は空の配列を返す
      if (!posts.length) {
        return res.status(200).json([]);
      }
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

      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("userId不正", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      //そのユーザーがフォローしているユーザーリストを取得する
      const userWithFollowings = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          followers: {
            include: {
              following: true,

              // フォローしているユーザーの詳細情報を取得
            },
          },
        },
      });

      // フォローしているユーザーのリストを抽出
      const followingsIdList = userWithFollowings
        ? userWithFollowings.followers.map((f) => f.following.id)
        : [];
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
          sentAt: {
            not: null, // 'sentAt'がnullではない=既に送信された投稿を取得
          },
        },
        orderBy: queryOrder,
        include: {
          post: true,
          replies: true,
          likes: true,
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
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

      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("userId不正", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      // replyToIdの存在と型を検証
      const replyToId: number = parseInt(req.query.replyToId as string);
      if (isNaN(replyToId) || replyToId <= 0) {
        console.error("replyToId不正", replyToId);

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
          sentAt: {
            not: null, // 'sentAt'がnullではない=既に送信された投稿を取得
          },
        },
        orderBy: queryOrder,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },

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

      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("Invalid userId", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      // replyToIdの存在と型を検証
      const replyToId: number = parseInt(req.query.replyToId as string);

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
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
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

//ユーザーリプライリスト取得API(ユーザーが投稿したリプライの最新順)
router.get(
  "/search/userReplies",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt

      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("Invalid userId", userId);

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
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },

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

//ユーザーいいねリスト取得API(ユーザーがいいねしたポストの最新順)
router.get(
  "/search/userLikes",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt

      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("Invalid userId", userId);

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
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  userImg: true,
                },
              },
              likes: true,
              replies: {
                select: { id: true }, // only fetches reply IDs
              },
            },
          },
        },
      });

      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

// ポスト登録機能
router.post(
  "/register",
  authenticateToken,
  upload.single("img"), //ミドルウェアで受け取ったimgファイルをメモリに一時保存する
  async (req: Request, res: Response) => {
    let { text, userId, replyToId, scheduledAt } = req.body;
    userId = parseInt(req.body.userId as string);
    replyToId = parseInt(req.body.replyToId as string);

    const img = req.file; // multerがファイルを処理する

    try {
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }

      if (userId !== null && typeof userId !== "number") {
        res.status(400).json({ error: "userId should be number" });

        return;
      }

      if (!replyToId) {
        replyToId = null;
      }
      if (replyToId !== null && typeof replyToId !== "number") {
        res.status(400).json({ error: "replyToId should be number" });

        return;
      }
      if (scheduledAt && isNaN(Date.parse(scheduledAt))) {
        return res
          .status(400)
          .json({ error: "Invalid scheduledAt date format" });
      }

      const sentAt = scheduledAt ? null : new Date();

      // S3に画像をアップロード
      let imgURL = null;
      if (img) {
        let uploadFileData = img.buffer;
        //imgが動画の場合、圧縮する
        if (img.mimetype.startsWith("video")) {
          uploadFileData = await compressVideo(img);
        }

        const hashedFileName = hashFilename(img.originalname);

        const s3Result = await s3
          .upload({
            Bucket: process.env.AWS_S3_BUCKET_NAME || "", // S3のバケット名
            Key: `uploads/${Date.now()}_${hashedFileName}`, // ファイル名
            Body: img.buffer, // ファイルデータ
            ContentType: img.mimetype,
            // ACL: "public-read", // 公開設定
          })
          .promise();

        imgURL = s3Result.Location; // アップロード後のS3 URL
      }

      const result = await prisma.post.create({
        data: {
          text,
          img: imgURL ? imgURL : null, // S3 URLを保存
          imgFileType: img?.mimetype,
          userId,
          replyToId,
          scheduledAt,
          sentAt,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
          likes: true,
          replies: true,
          post: true,
        },
      });

      if (replyToId && result.post?.userId) {
        await registerNotification(
          NotificationType.REPLY,
          result.post?.userId,
          userId,
          replyToId
        );
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error:", error);
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
        console.error("postId不正", postId);

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
              user: {
                select: {
                  id: true,
                  name: true,
                  userImg: true,
                },
              },
              likes: true,
              replies: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
          likes: true,
          replies: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  userImg: true,
                },
              },
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

//like登録機能
router.post(
  "/like/register",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      let { postId, userId, like } = req.body;
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
                  user: {
                    select: {
                      id: true,
                      name: true,
                      userImg: true,
                    },
                  },
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
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号

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
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
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

//ポスト削除機能
router.delete(
  "/delete",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.query.postId as string); // リクエストから記事のIDを取得
      const userId = parseInt(req.query.userId as string); // リクエストからユーザーのIDを取得

      if (!postId || !userId) {
        res.status(400).json({ error: " postId and userId are required" });
        return;
      }

      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
      });
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

        await prisma.post.delete({
          where: {
            id: postId,
          },
        });
      });

      // ポストに画像が添付されていた場合、S3から削除する
      if (post.img) {
        try {
          const url = new URL(post.img); // URLオブジェクトを作成
          const bucketName = url.hostname.split(".")[0]; // ホスト名からバケット名を抽出

          const key = url.pathname.substring(1); // パス名から最初の '/' を取り除いてキーを取得

          const params = {
            Bucket: bucketName,
            Key: key,
          };
          const data = await s3.deleteObject(params).promise();
        } catch (error) {
          console.error("failed to delete img from S3", error);
        }
      }

      res.status(200).send(`Post with ID: ${postId} deleted successfully`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error deleting article" });
    }
  }
);

export default router;
