const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";

//ユーザー情報関連API "/eatfish_back/api/user"

// ログイン機能
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("/login", { email, password });

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    if (!password) {
      return res.status(400).json({ error: "password is required" });
    }
    const whereParam: { [key: string]: any } = {};

    //emailが指定されていればパラメータに設定
    whereParam.email = email;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      const passwordValid = await bcrypt.compare(password, user.password);
      if (passwordValid) {
        // JWT 生成と応答
        // ユーザーが認証された場合、JWTを生成
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
        const { password, ...userWithoutPass } = user;

        return res.status(200).json({ token, user: userWithoutPass });
      } else {
        // 認証失敗の応答
        return res.status(401).json({ error: "Invalid password" });
      }
    } else {
      return res.status(401).json({ error: "this email does not exist." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error searching users" });
  }
});

// ユーザー登録機能
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      res
        .status(400)
        .send({ error: "userName,email and password are required" });
      return;
    }

    //Userテーブルに初期登録を行う
    const hashedPassword = await bcrypt.hash("password", 10);

    const user = await prisma.user.create({
      data: {
        name: userName,
        userImg: "",
        email,
        emailVerifiedAt: null,
        password: hashedPassword,
        isAdmin: false,
        introduction: "",
      },
    });

    //TODO GmailのSMTPサーバーを利用し、Verificationメールを送信する
    // Nodemailer Transportの設定
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_APP_PASS, // Gmailのアプリパスワード
      },
    });

    // メールオプションの設定
    // トークンの生成
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const mailOptions = {
      from: process.env.SMTP_MAIL, // 送信者アドレス
      to: email, // 受信者アドレス
      subject: "Account Verification _ KarukanSNS", // 件名
      text: `Hi ${userName}, please verify your account by clicking the link: [${process.env.VERIFICATION_LINK}${token}]`, // 本文
    };

    // メール送信
    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .send({ message: "Registration successful, verification email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering user" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id || !decoded.email) {
      throw new Error("Invalid verification token");
    }
    //トークンに含まれていた情報からユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        email: decoded.email,
      },
    });

    if (!user) {
      throw new Error("this user does not exist");
    }

    //UserTableのemailVerifiedAtに現在時刻を入れて更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id, email: decoded.email },
      data: {
        emailVerifiedAt: new Date(),
      },
    });
    //トークン生成
    const loginToken = jwt.sign(
      { id: updatedUser.id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    //トークンとユーザー情報返却

    const { password, ...userWithoutPass } = updatedUser;

    //todo 成功時は、localhost:5173/に遷移させたい
    return res.status(200).json({ token: loginToken, user: userWithoutPass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering user" });
  }
});

// ユーザー削除機能
// router.delete(
//   "/delete",
//   authenticateToken,
//   async (req: Request, res: Response) => {
//     try {
//       const { id, uid } = req.body;
//       console.log("/eatfish_back/search/user", { id, uid });

//       if (!id && !uid) {
//         return res.status(400).json({ error: "id or uid is required" });
//       }
//       const whereParam: { [key: string]: any } = {};
//       //idが指定されていればパラメータに設定
//       if (id) {
//         whereParam.id = id;
//       }

//       //uidが指定されていればパラメータに設定
//       if (uid) {
//         whereParam.uid = uid;
//       }

//       const deletedUser = await prisma.user.deleteMany({
//         where: whereParam,
//       });

//       res
//         .status(200)
//         .send(`User with UID:id( ${id}),uid (${uid}) deleted successfully`);
//     } catch (error) {
//       console.error(error);
//       res.status(500).send("Error deleting user");
//     }
//   }
// );

// ユーザー情報変更機能
// router.put(
//   "/update",
//   authenticateToken,
//   async (req: Request, res: Response) => {
//     try {
//       const { id, uid, name, userImg, isAdmin, introduction } = req.body;
//       if (!id && !uid) {
//         return res.status(400).json({ error: "id or uid is required" });
//       }

//       const updatedUser = await prisma.user.update({
//         where: { id: id || undefined, uid: uid || undefined },
//         data: {
//           name,
//           userImg,
//           isAdmin: isAdmin ? true : false,
//           introduction,
//         },
//       });

//       res.status(200).json(updatedUser);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Error updating user information" });
//     }
//   }
// );

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
