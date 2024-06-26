import express, { Request, Response } from "express";

import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";
import { getUnreadNotificationsCount } from "../lib/util";

//通知関連API
const router = express.Router();

//最新通知取得API(最新順)
router.get(
  "/getRecentNotices",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      const backDate: number =
        parseInt(req.query.backDate as string) || 7 * 24 * 3600 * 1000;

      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - backDate); // 何日前までさかのぼるか

      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("userId不正", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      //指定された時間以内での直近の通知リストを取得

      const recentNotifications = await prisma.notification.findMany({
        where: {
          createdAt: {
            gte: fromDate,
            lt: toDate,
          },
          userId,
        },
        orderBy: [
          {
            createdAt: "desc",
          },
        ],

        include: {
          user: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
          triggeredBy: {
            select: {
              id: true,
              name: true,
              userImg: true,
            },
          },
          post: true,
        },
      });

      // 取得した通知は既読にする
      await prisma.notification.updateMany({
        where: {
          createdAt: {
            gte: fromDate,
            lt: toDate,
          },
          userId,
        },
        data: {
          read: true,
        },
      });

      // 投稿がない場合は空の配列を返す
      if (!recentNotifications.length) {
        return res.status(200).json([]);
      }
      res.status(200).json(recentNotifications);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

//未読通知数取得API
router.get(
  "/getUnreadNoticeCount",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.error("userId不正", userId);
        return res.status(400).json({ error: "userId is required" });
      }

      const unreadNotificationCount = await getUnreadNotificationsCount(userId);

      res.status(200).json(unreadNotificationCount);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);
export default router;
