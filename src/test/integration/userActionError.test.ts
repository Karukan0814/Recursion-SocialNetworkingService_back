const request = require("supertest");
import { prismaMock } from "../integration/singleton";
const userActionRoute = require("../../routes/userAction");

// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const app = express();
app.use(express.json());
app.use("/eatfish_back/api/userActions", userActionRoute);

// authenticateTokenをモックにする
jest.mock("../../lib/authenticateToken", () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

describe("ユーザーアクション関連APIテスト", () => {
  //コメント検索機能
  describe("GET /comment/search", () => {
    test("異常系-記事ID指定なし", async () => {
      const response = await request(app)
        .get("/eatfish_back/api/userActions/comment/search")
        .query({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toHaveLength(1);
    });
    test("異常系-prismaエラー", async () => {
      prismaMock.articleComment.findMany.mockRejectedValue(
        new Error("Database error")
      );
      const response = await request(app)
        .get("/eatfish_back/api/userActions/comment/search")
        .query({ articleId: 1 })
        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });

  //コメント登録機能
  describe("POST /comment/register", () => {
    test("異常系-リクエストボディなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-articleIdなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ userId: 1, comment: "test" })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userIdなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ articleId: 1, comment: "test" })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-commentなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ articleId: 1, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);
      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-articleId型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ articleId: "error", userId: 1, comment: "12345" })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userId型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ articleId: 1, userId: "error", comment: "12345" })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-comment型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ articleId: 1, userId: 1, comment: 12345 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-prismaエラー", async () => {
      prismaMock.articleComment.create.mockRejectedValue(
        new Error("Database error")
      );
      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ articleId: 1, userId: 1, comment: "test" })

        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });
  //いいね登録機能
  describe("POST /like/register", () => {
    test("異常系-リクエストボディなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-articleIdなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ userId: 1, like: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userIdなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId: 1, like: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-likeなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId: 1, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);
      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-articleId型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId: "error", userId: 1, like: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userId型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId: 1, userId: "error", like: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-like型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId: 1, userId: 1, like: 12345 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-prismaエラー", async () => {
      prismaMock.articleLike.create.mockRejectedValue(
        new Error("Database error")
      );
      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId: 1, userId: 1, like: true })

        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });
  //ブックマーク登録機能
  describe("POST /bookmark/register", () => {
    test("異常系-リクエストボディなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-articleIdなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ userId: 1, bookmark: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userIdなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId: 1, bookmark: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-bookmarkなし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId: 1, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);
      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-articleId型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId: "error", userId: 1, bookmark: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userId型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId: 1, userId: "error", bookmark: true })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-bookmark型エラー", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId: 1, userId: 1, bookmark: 12345 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-prismaエラー", async () => {
      prismaMock.articleBookmark.create.mockRejectedValue(
        new Error("Database error")
      );
      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId: 1, userId: 1, bookmark: true })

        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });
});
