const request = require("supertest");
import { prismaMock } from "../integration/singleton";
import { testArticles } from "./testData/testArticles";
const articleRoute = require("../../routes/article");
// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const app = express();
app.use(express.json());

app.use("/eatfish_back/api/article", articleRoute);

// authenticateTokenをモックにする
jest.mock("../../lib/authenticateToken", () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

// userIsAdminのみモックにする
jest.mock("../../lib/util", () => ({
  ...jest.requireActual("../../lib/util"), // 他の関数はそのままにする
  userIsAdmin: jest.fn(async (userId: number) => {
    return false;
  }), // userIsAdminのみモックにする
}));

describe("記事関連APIテスト", () => {
  describe("GET /articleCount", () => {
    test("異常系―存在しない記事タイプを指定", async () => {
      const testArticleType = "INVALID";
      const expectedResult = testArticles.filter(
        (article) => article.type === testArticleType
      ).length;
      prismaMock.article.count.mockResolvedValue(expectedResult);
      const response = await request(app)
        .get("/eatfish_back/api/article/articleCount")
        .query({
          type: testArticleType,
        })
        .expect(400)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("errors");
    });
    test("異常系―prismaエラー", async () => {
      const testArticleType = "RECIPE";

      prismaMock.article.count.mockRejectedValue(new Error("Database error"));
      const response = await request(app)
        .get("/eatfish_back/api/article/articleCount")
        .query({
          type: testArticleType,
        })
        .expect(500);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /search", () => {
    test("異常系-prismaエラー", async () => {
      prismaMock.article.findMany.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get("/eatfish_back/api/article/search")
        .expect(500);
    });
  });

  describe("GET /searchByCategory", () => {
    test("異常系-カテゴリID指定なし", async () => {
      const response = await request(app)
        .get("/eatfish_back/api/article/searchByCategory")
        .query({}) // カテゴリID指定なし
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toHaveLength(1);
    });
    test("異常系-prismaエラー", async () => {
      prismaMock.article.findMany.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get("/eatfish_back/api/article/searchByCategory")
        .query({ categoryId: 1 }) // カテゴリID指定なし

        .expect(500);
    });
  });
  describe("POST /searchByUser", () => {
    test("異常系-リクエストbody指定なし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/article/searchByUser")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-ユーザーID指定なし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/article/searchByUser")
        .send({ userId: null })

        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-存在しないユーザー指定", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/eatfish_back/api/article/searchByUser")
        .send({ userId: 99999999999999999999999999 }); // ユーザーID指定なし
    });
    test("異常系-記事検索時prismaエラー", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 999,
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "登録ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isAdmin: true,
        introduction: "登録ユーザー自己紹介",
      });

      prismaMock.article.findMany.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/eatfish_back/api/article/searchByUser")
        .send({ userId: 1 })

        .expect(500);
    });
  });
  describe("GET /getMetadata", () => {
    test("異常系-urlなし", async () => {
      const response = await request(app)
        .get("/eatfish_back/api/article/getMetadata")
        .query({}); // url指定なし

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toHaveLength(1);
    });
  });

  describe("POST /register", () => {
    test("異常系-リクエストbody指定なし", async () => {
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-titleが空", async () => {
      const title = "";
      const type = "RECIPE";
      const link = "newLink";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-titleがstringでない", async () => {
      const title = 111;
      const type = "RECIPE";
      const link = "newLink";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });

    test("異常系-typeが空", async () => {
      const title = "register";
      const type = "";
      const link = "newLink";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-typeが許容される方でない", async () => {
      const title = "register";
      const type = "INVALID";
      const link = "newLink";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-linkが空", async () => {
      const title = "title";
      const type = "RECIPE";
      const link = "";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-linkがstringでない", async () => {
      const title = "111";
      const type = "RECIPE";
      const link = 111;
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-categoriesが配列でない", async () => {
      const title = "title";
      const type = "RECIPE";
      const link = "link";
      const img = "newImg";
      const categories = 12;
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-categoriesがnumberでないものを含む", async () => {
      const title = "111";
      const type = "RECIPE";
      const link = "111";
      const img = "newImg";
      const categories = [{}, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: 1 })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userIdが空", async () => {
      const title = "title";
      const type = "RECIPE";
      const link = "link";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-userIdがnumberでない", async () => {
      const title = "111";
      const type = "RECIPE";
      const link = "111";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({ title, type, link, img, categories, userId: "1" })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });

    test("異常系-記事登録時prismaエラー", async () => {
      prismaMock.article.create.mockRejectedValue(new Error("Database error"));

      const title = "registerArticle";
      const type = "RECIPE";
      const link = "newLink";
      const img = "newImg";
      const categories = [1, 2];
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send({
          title,
          type,
          link,
          img,
          categories,
          userId: 1,
        })

        .expect(500);
    });
  });
  describe("DELETE /delete", () => {
    test("異常系-articleId指定なし", async () => {
      const response = await request(app)
        .delete("/eatfish_back/api/article/delete")
        .query({
          userId: 1,
        })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });

    test("異常系-userIdなし", async () => {
      const response = await request(app)
        .delete("/eatfish_back/api/article/delete")
        .query({
          articleId: 1,
        })
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });

    test("異常系-該当する記事無し", async () => {
      prismaMock.article.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete("/eatfish_back/api/article/delete")
        .query({
          articleId: 1,
          userId: 1,
        })
        .expect(404)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });
    test("異常系-ユーザーが記事作成者でもないし、管理者でもない", async () => {
      prismaMock.article.findUnique.mockResolvedValue({
        id: 1,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
        title: "mock",
        type: "ONLINE",
        link: "https://example.com/article1",
        img: "https://example.com/images/article1.jpg",
        userId: 100,
      });

      const response = await request(app)
        .delete("/eatfish_back/api/article/delete")
        .query({
          articleId: 1,
          userId: 1,
        })
        .expect(403)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("error");
    });

    test("異常系-記事削除時prismaエラー", async () => {
      prismaMock.article.findUnique.mockResolvedValue({
        id: 1,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
        title: "mock",
        type: "ONLINE",
        link: "https://example.com/article1",
        img: "https://example.com/images/article1.jpg",
        userId: 1,
      });
      // 記事削除の際のエラーをモック
      prismaMock.$transaction.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .delete("/eatfish_back/api/article/delete")
        .query({
          articleId: 1,
          userId: 1,
        })
        .expect(500)
        .expect("Content-Type", /json/);
    });
  });
});
