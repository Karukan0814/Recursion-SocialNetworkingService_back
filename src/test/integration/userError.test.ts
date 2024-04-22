const request = require("supertest");
const jwt = require("jsonwebtoken");

import { prismaMock } from "../integration/singleton";
const userRoute = require("../../routes/user");
import { authenticateToken } from "../../lib/authenticateToken";

// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const dotenv = require("dotenv").config();

const app = express();
app.use(express.json());
app.use("/eatfish_back/api/user", userRoute);

// authenticateTokenをモックにする
jest.mock("../../lib/authenticateToken", () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

const userList = [
  {
    id: 1,
    uid: "xxxxxxxxxxxxxxxxxxxxx",
    name: "テスト一般ユーザー",
    userImg: "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxx",
    isAdmin: false,
    introduction: "てすと自己紹介",
  },
  {
    id: 2,
    uid: "xxxxxxxxxxxxxxxxxxxxx",
    name: "テスト管理者",
    userImg:
      "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    isAdmin: true,
    introduction: "てすと自己紹介",
  },
];

describe("ユーザー関連APIテスト", () => {
  //ログイン機能
  describe("POST /login", () => {
    test("異常系-リクエストボディなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-id&uid指定なし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/user/login")
        .send()
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-存在しないユーザー", async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: 99999999999999999999 })
        .expect(500)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-prismaエラー", async () => {
      prismaMock.user.findMany.mockRejectedValue(new Error("Database error"));
      const response = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: 1 })
        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });
});
describe("POST /register", () => {
  //ユーザー登録機能
  describe("POST /register", () => {
    test("異常系-リクエストボディなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/user/register")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-uid指定なし", async () => {
      const userData = {
        id: 999,
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "登録ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isAdmin: true,
        introduction: "登録ユーザー自己紹介",
      };

      prismaMock.user.create.mockResolvedValue(userData);
      const response = await request(app)
        .post("/eatfish_back/api/user/register")
        .send({
          name: "登録ユーザー名",
          userImg:
            "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          isAdmin: true,
          introduction: "登録ユーザー自己紹介",
        })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-名前指定なし", async () => {
      const userData = {
        id: 999,
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "登録ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isAdmin: true,
        introduction: "登録ユーザー自己紹介",
      };

      prismaMock.user.create.mockResolvedValue(userData);
      const response = await request(app)
        .post("/eatfish_back/api/user/register")
        .send({
          uid: "xxxxxxxxxxxxxxxxxxxxx",

          userImg:
            "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          isAdmin: true,
          introduction: "登録ユーザー自己紹介",
        })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-prismaエラー", async () => {
      const userData = {
        id: 999,
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "登録ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isAdmin: true,
        introduction: "登録ユーザー自己紹介",
      };

      prismaMock.user.create.mockRejectedValue(new Error("Database error"));
      const response = await request(app)
        .post("/eatfish_back/api/user/register")
        .send({
          uid: "xxxxxxxxxxxxxxxxxxxxx",
          name: "登録ユーザー名",
          userImg:
            "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          isAdmin: true,
          introduction: "登録ユーザー自己紹介",
        })
        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });

  //ユーザー削除機能
  describe("DELETE /delete", () => {
    test("異常系-id&uid指定なし", async () => {
      const response = await request(app)
        .delete("/eatfish_back/api/user/delete")
        .send()
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });

    test("異常系-prismaエラー", async () => {
      const userData = {
        id: 1,
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "登録ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isAdmin: true,
        introduction: "登録ユーザー自己紹介",
      };

      prismaMock.user.deleteMany.mockRejectedValue(new Error("Database error"));
      const response = await request(app)
        .delete("/eatfish_back/api/user/delete")
        .send({
          id: userData.id,
          uid: userData.uid,
        })
        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });

  //ユーザー更新機能
  describe("PUT /update", () => {
    test("異常系-id&uid指定なし", async () => {
      const userData = {
        id: 1,
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "更新ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxupdate",
        isAdmin: true,
        introduction: "変更ユーザー自己紹介",
      };
      const response = await request(app)
        .put("/eatfish_back/api/user/update")
        .send({
          name: userData.name,
          userImg: userData.userImg,
          isAdmin: userData.isAdmin,
          introduction: userData.introduction,
        })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });

    test("異常系-prismaエラー", async () => {
      const userData = {
        id: 1,
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "更新ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isAdmin: true,
        introduction: "更新ユーザー自己紹介",
      };

      prismaMock.user.update.mockRejectedValue(new Error("Database error"));
      const response = await request(app)
        .put("/eatfish_back/api/user/update")
        .send({
          id: userData.id,
          uid: userData.uid,
          name: userData.name,
          userImg: userData.userImg,
          isAdmin: userData.isAdmin,
          introduction: userData.introduction,
        })
        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });

  //   トークン有効期限確認機能
  describe("POST /checkToken", () => {
    test("異常系-Authorization ヘッダーが存在しない", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/user/checkToken")

        .expect(401)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("valid");
      expect(response.body.valid).toBe(false);
      expect(response.body).toHaveProperty("error");

      expect(response.body.error).toBe("Unauthorized");
    });
    test("異常系-Authorization ヘッダーがBearerで始まらない", async () => {
      const validToken = "validToken";
      const response = await request(app)
        .post("/eatfish_back/api/user/checkToken")
        .set("Authorization", `Invalid ${validToken}`)

        .expect(401)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("valid");
      expect(response.body.valid).toBe(false);
      expect(response.body).toHaveProperty("error");

      expect(response.body.error).toBe("Unauthorized");
    });
    test("異常系-トークン期限切れ", async () => {
      const invalidToken = jwt.sign(userList[0], process.env.JWT_SECRET, {
        expiresIn: "0",
      });
      const response = await request(app)
        .post("/eatfish_back/api/user/checkToken")
        .set("Authorization", `Bearer ${invalidToken}`)

        .expect(403)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("valid");
      expect(response.body.valid).toBe(false);
      expect(response.body).toHaveProperty("error");

      expect(response.body.error).toBe("Invalid token");
    });
  });
});
