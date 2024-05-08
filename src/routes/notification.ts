const router = require("express").Router();
const jwt = require("jsonwebtoken");

import { Request, Response } from "express";

import { NotificationType, PrismaClient } from "@prisma/client";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";
import { registerNotification } from "../lib/util";

//通知関連API

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

      console.log({ backDate });

      // userIdの存在と型を検証
      const userId: number = parseInt(req.query.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.log("userId不正", userId);

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

      console.log(recentNotifications);
      // 投稿がない場合は空の配列を返す
      if (!recentNotifications.length) {
        return res.status(200).json([]);
      }
      // console.log({ posts });
      res.status(200).json(recentNotifications);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);
module.exports = router;
