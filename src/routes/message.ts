import express, { Request, Response, text } from "express";

import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";
import { decrypt, encrypt } from "../lib/util";

const router = express.Router();
//全会話リスト取得API(最新順)
router.get(
  "/search/conversationsAll",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("userId不正", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      //そのユーザーリスト＋ユーザー本人の投稿ポストを最新順で取得

      //そのユーザーがフォローしているユーザーリストを取得する
      const conversations = await prisma.conversation.findMany({
        orderBy: { id: "desc" },

        where: {
          participants: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          participants: {
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
          messages: true,
        },
      });

      res.status(200).json(conversations);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//会話リスト取得API(最新順)
router.get(
  "/search/conversations",
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

      //そのユーザーリスト＋ユーザー本人の投稿ポストを最新順で取得

      const skip = (page - 1) * count; // ページ番号からskip数を計算

      //そのユーザーがフォローしているユーザーリストを取得する
      const conversations = await prisma.conversation.findMany({
        take: count,
        skip: skip,
        orderBy: { id: "desc" },

        where: {
          participants: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          participants: {
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
          messages: true,
        },
      });

      res.status(200).json(conversations);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//メッセージリスト取得API(時系列順)
router.get(
  "/search/meesageList",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // conversationIdの存在と型を検証
      const conversationId: number = parseInt(
        req.query.conversationId as string
      );
      if (isNaN(conversationId) || conversationId <= 0) {
        console.error("Invalid conversationId", conversationId);

        return res.status(400).json({ error: "conversationId is required" });
      }

      //指定されたconversationIdに紐づくメッセージのリストを時系列順で取得
      const messages = await prisma.message.findMany({
        orderBy: { createdAt: "asc" },

        where: {
          conversationId,
        },
      });
      const decryptedMessages = messages.map((message) => {
        message.text = decrypt(message.text);
        return message;
      });

      res.status(200).json(decryptedMessages);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//会話登録機能
router.post(
  "/register/conversation",
  authenticateToken,
  async (req: Request, res: Response) => {
    let { fromUserId, toUserId, token } = req.body;

    try {
      //fromUserIdが空でないか
      if (!fromUserId || typeof fromUserId !== "number") {
        res.status(400).json({ error: "fromUserId is required" });

        return;
      }
      //toUserIdが空でないか
      if (!toUserId || typeof toUserId !== "number") {
        res.status(400).json({ error: "toUserId is required" });

        return;
      }

      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: fromUserId }, { userId: toUserId }],
          },
        },
        include: {
          participants: {
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
      res.status(200).json(conversation);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering category");
    }
  }
);

//メッセージ登録機能
router.post(
  "/register/message",
  authenticateToken,
  async (req: Request, res: Response) => {
    let { conversationId, senderId, text } = req.body;

    try {
      //fromUserIdが空でないか
      if (!conversationId || typeof conversationId !== "number") {
        res.status(400).json({ error: "conversationId is required" });

        return;
      }
      //senderIdが空でないか
      if (!senderId || typeof senderId !== "number") {
        res.status(400).json({ error: "senderId is required" });

        return;
      }
      const encryptedText = encrypt(text);

      const newMessage = await prisma.message.create({
        data: {
          text: encryptedText,
          conversationId,
          senderId,
        },
      });

      newMessage.text = text;
      res.status(200).json(newMessage);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering category");
    }
  }
);

export default router;
