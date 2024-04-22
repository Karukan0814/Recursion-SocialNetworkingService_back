const router = require("express").Router();
const jwt = require("jsonwebtoken");

import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";

//ユーザー情報関連API "/eatfish_back/api/user"

// ログイン機能
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { id, uid } = req.body;
    console.log("/login", { id, uid });

    if (!id && !uid) {
      return res.status(400).json({ error: "id or uid is required" });
    }
    const whereParam: { [key: string]: any } = {};
    //idが指定されていればパラメータに設定
    if (id) {
      whereParam.id = parseInt(id as string);
    }

    //uidが指定されていればパラメータに設定
    if (uid) {
      whereParam.uid = uid;
    }

    const users = await prisma.user.findMany({
      where: whereParam,
    });
    if (users.length > 0) {
      // ユーザーが認証された場合、JWTを生成
      const token = jwt.sign(users[0], process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(200).json({ token, user: users[0] });
    } else {
      return res.status(500).json({ error: "Error searching users" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error searching users" });
  }
});

// ユーザー登録機能
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { uid, name, userImg, isAdmin, introduction } = req.body;
    if (!uid || !name) {
      res.status(400).send({ error: "uid and name are required" });
      return;
    }

    const result = await prisma.user.create({
      data: {
        uid,
        name,
        userImg,
        isAdmin: isAdmin ? true : false,
        introduction: introduction || "",
      },
    });

    // ユーザーが認証された場合、JWTを生成
    const token = jwt.sign(result, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ token, user: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering user" });
  }
});

// ユーザー削除機能
router.delete(
  "/delete",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id, uid } = req.body;
      console.log("/eatfish_back/search/user", { id, uid });

      if (!id && !uid) {
        return res.status(400).json({ error: "id or uid is required" });
      }
      const whereParam: { [key: string]: any } = {};
      //idが指定されていればパラメータに設定
      if (id) {
        whereParam.id = id;
      }

      //uidが指定されていればパラメータに設定
      if (uid) {
        whereParam.uid = uid;
      }

      const deletedUser = await prisma.user.deleteMany({
        where: whereParam,
      });

      res
        .status(200)
        .send(`User with UID:id( ${id}),uid (${uid}) deleted successfully`);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error deleting user");
    }
  }
);

// ユーザー情報変更機能
router.put(
  "/update",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id, uid, name, userImg, isAdmin, introduction } = req.body;
      if (!id && !uid) {
        return res.status(400).json({ error: "id or uid is required" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: id || undefined, uid: uid || undefined },
        data: {
          name,
          userImg,
          isAdmin: isAdmin ? true : false,
          introduction,
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error updating user information" });
    }
  }
);

// トークン有効期限確認機能
router.post("/checkToken", async (req: Request, res: Response) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
    const token = authorizationHeader.slice(7); // 'Bearer ' の部分を削除してトークンを取得

    try {
      // トークンの有効期限を確認
      jwt.verify(token, process.env.JWT_SECRET);
      // 有効なトークンの場合
      return res.status(200).json({ valid: true });
    } catch (err) {
      console.log("Invalid token");
      // 無効なトークンの場合
      return res.status(403).json({ valid: false, error: "Invalid token" });
    }
  } else {
    // Authorization ヘッダーが存在しないか、Bearer スキームで始まっていない場合のエラー処理
    return res.status(401).json({ valid: false, error: "Unauthorized" });
  }
});

module.exports = router;
