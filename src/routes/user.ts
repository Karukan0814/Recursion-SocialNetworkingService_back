const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

import { Request, Response } from "express";

import { NotificationType, PrismaClient } from "@prisma/client";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";
import { hashFilename, registerNotification } from "../lib/util";
import { s3, upload } from "../lib/multer";

//ユーザー情報関連API

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
    console.log(user);

    const followings = await prisma.follows.findMany({
      where: {
        followerId: user?.id,
      },
    });
    console.log({ followings });
    const followers = await prisma.follows.findMany({
      where: {
        followingId: user?.id,
      },
    });
    console.log({ followers });

    if (user) {
      const passwordValid = await bcrypt.compare(password, user.password);
      const dbPass = user.password;
      console.log({ passwordValid, password, dbPass });
      if (passwordValid) {
        // JWT 生成と応答
        // ユーザーが認証された場合、JWTを生成
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        const { password, ...userWithoutPass } = user;
        const followerIds = followers.map((follower) => follower.followerId);
        const followingIds = followings.map(
          (following) => following.followingId
        );

        res.status(200).json({
          user: {
            ...userWithoutPass,
            followers: followerIds,
            followings: followingIds,
          },
          token,
        });
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
    const hashedPassword = await bcrypt.hash(password, 10);

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
router.put(
  "/update",
  authenticateToken,
  upload.single("userImg"), //ミドルウェアで受け取ったimgファイルをメモリに一時保存する

  async (req: Request, res: Response) => {
    try {
      let { email, name, introduction } = req.body;
      let userId = parseInt(req.body.userId as string);

      if (!userId && !name) {
        return res.status(400).json({ error: "userId or name is required" });
      }
      const userImg = req.file; // multerがファイルを処理する
      console.log({ userId, email, name, userImg, introduction });

      // S3に画像をアップロード
      let imgURL = null;
      if (userImg) {
        const hashedFileName = hashFilename(userImg.originalname);

        const s3Result = await s3
          .upload({
            Bucket: process.env.AWS_S3_BUCKET_NAME, // S3のバケット名
            Key: `userImg/${Date.now()}_${hashedFileName}`, // ファイル名
            Body: userImg.buffer, // ファイルデータ
            // ACL: "public-read", // 公開設定
          })
          .promise();

        imgURL = s3Result.Location; // アップロード後のS3 URL
        console.log("imgURL", imgURL);
      }

      const updateData = {
        name,
        introduction,
        ...(imgURL && { userImg: imgURL }), // imgURLがnullでない場合のみuserImgプロパティを追加
      };
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      if (updatedUser) {
        const followings = await prisma.follows.findMany({
          where: {
            followerId: updatedUser?.id,
          },
        });
        console.log({ followings });
        const followers = await prisma.follows.findMany({
          where: {
            followingId: updatedUser?.id,
          },
        });
        console.log({ followers });
        // パスワード情報を除外して返却
        const { password, emailVerifiedAt, ...userWithoutPass } = updatedUser;
        const followerIds = followers.map((follower) => follower.followerId);
        const followingIds = followings.map(
          (following) => following.followingId
        );

        res.status(200).json({
          // user: {
          ...userWithoutPass,
          followers: followerIds,
          followings: followingIds,
          // },
        });
      }
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

//フォロワーリスト取得API(id順)
router.get(
  "/follower",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt
      const whereClause: any = {};

      const userId: number = parseInt(req.query.userId as string);

      const followers = await prisma.follows.findMany({
        where: {
          followingId: userId,
        },
        orderBy: [
          {
            followerId: "desc", // id順に並べ替える
          },
        ],
        take: count,
        skip: (page - 1) * count,
        include: {
          follower: true,
        },
      });

      // 投稿がない場合は空の配列を返す
      if (!followers.length) {
        return res.status(200).json([]);
      }
      // console.log({ posts });
      const followerListWithoutPass = followers.map((follower) => {
        const { password, email, emailVerifiedAt, ...followerWithoutPass } =
          follower.follower;
        return followerWithoutPass;
      });

      res.status(200).json(followerListWithoutPass);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);
//フォロ-中のユーザーリスト取得API(id順)
router.get(
  "/following",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号
      const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt
      const whereClause: any = {};

      const userId: number = parseInt(req.query.userId as string);

      let skip = (page - 1) * count; // ページ番号からskip数を計算=スキップして取得しないポスト数
      const followings = await prisma.follows.findMany({
        where: {
          followerId: userId,
        },
        orderBy: [
          {
            followingId: "desc", // id順に並べ替える
          },
        ],
        take: count,
        skip: (page - 1) * count,
        include: {
          following: true,
        },
      });

      // 投稿がない場合は空の配列を返す
      if (!followings.length) {
        return res.status(200).json([]);
      }
      // console.log({ posts });

      const followingListWithoutPass = followings.map((follower) => {
        const { password, email, emailVerifiedAt, ...followerWithoutPass } =
          follower.following;
        return followerWithoutPass;
      });

      res.status(200).json(followingListWithoutPass);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);
//ユーザーIdをキーにユーザー情報を取得する
router.get(
  "/getUserInfoById",
  authenticateToken,

  async (req: Request, res: Response) => {
    try {
      const userId: number = parseInt(req.query.userId as string);

      const userInfo = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      console.log(userInfo);

      if (userInfo) {
        const followings = await prisma.follows.findMany({
          where: {
            followerId: userInfo?.id,
          },
        });
        console.log({ followings });
        const followers = await prisma.follows.findMany({
          where: {
            followingId: userInfo?.id,
          },
        });
        console.log({ followers });
        // パスワード情報を除外して返却
        const { password, ...userWithoutPass } = userInfo;
        const followerIds = followers.map((follower) => follower.followerId);
        const followingIds = followings.map(
          (following) => following.followingId
        );

        res.status(200).json({
          ...userWithoutPass,
          followers: followerIds,
          followings: followingIds,
        });

        // console.log({ posts });
      } else {
        res.status(500).send("No User");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);

// フォロー登録・削除機能
router.post("/follow", async (req: Request, res: Response) => {
  try {
    const { userId, followUserId, followState } = req.body;
    if (!userId || !followUserId) {
      res.status(400).send({ error: "userId and followUserId are required" });
      return;
    }

    if (followState) {
      // 新たにユーザーをフォローする場合
      await prisma.follows.create({
        data: {
          followerId: userId,
          followingId: followUserId,
        },
      });

      //フォローしたユーザーにフォローされた旨、通知する
      const newNotification = await registerNotification(
        NotificationType.FOLLOW,
        followUserId,
        userId
      );
    } else {
      // 現在フォローしているユーザーのフォローをはずす場合

      await prisma.follows.deleteMany({
        where: {
          followerId: userId,
          followingId: followUserId,
        },
      });
    }

    const newFollowings = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
    });
    const followings = newFollowings.map((follow) => follow.followingId);
    console.log(followings);
    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering user" });
  }
});

//キーワード関連ユーザ取得API(ユーザー名にキーワードを含むユーザーリストId順）
router.get(
  "/search/keyword",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      console.log("/search/keyword");
      const count: number = parseInt(req.query.count as string) || 20; // クエリパラメータ "count" を数値に変換し、デフォルトは20
      const page: number = parseInt(req.query.page as string) || 1; // ページ番号

      console.log(req.query);
      const keyword = req.query.keyword as string;
      if (!keyword) {
        return res.status(400).json({ error: "keyword is required" });
      }
      const keywordPattern = `%${keyword}%`; //SQL検索用

      const skip = (page - 1) * count; // ページ番号からskip数を計算

      const users = await prisma.user.findMany({
        take: count,
        skip: skip,
        where: {
          // replyToId: null,
          name: {
            contains: keywordPattern,
          },
        },
      });

      console.log(users);
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching posts");
    }
  }
);
module.exports = router;
