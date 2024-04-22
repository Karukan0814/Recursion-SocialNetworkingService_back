import request from "supertest";
// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const app = express();
const categoryRoute = require("../../routes/category");
const userRoute = require("../../routes/user");

const jwt = require("jsonwebtoken");

app.use("/eatfish_back/api/category", categoryRoute);
app.use("/eatfish_back/api/user", userRoute);

import { PrismaClient, Season } from "@prisma/client";
import { allCategoryId } from "../../lib/constant";
import { testCategory } from "./testData/testCategory";
import resetDb from "./reset-db";
const prisma = new PrismaClient();

console.log("category test");

describe("/eatfish_back/api/category", () => {
  beforeEach(async () => {
    console.log("setup");

    await resetDb();

    await prisma.category.createMany({ data: testCategory });
    // const afterusers = await prisma.user.findMany();
    // console.log("afterusers", afterusers);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("[GET] /searchAll", () => {
    test("全カテゴリ取得テスト ALLカテゴリあり", async () => {
      const response = await request(app)
        .get("/eatfish_back/api/category/searchAll")
        .query({ withAll: true }) // クエリパラメータの追加
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(response.body)).toBe(true); // response.bodyが配列であることを確認
      const keys = Object.keys(response.body[0]); //レスポンスのオブジェクトのキー取得

      expect(keys.length).toBe(5);
      expect(keys).toStrictEqual(["id", "name", "img", "link", "season"]);
      expect(response.body.some((item: any) => item.id === allCategoryId)).toBe(
        true
      ); // 配列内にid=100の要素が存在することを確認
    });

    test("全カテゴリ取得テスト ALLカテゴリなし", async () => {
      const response = await request(app)
        .get("/eatfish_back/api/category/searchAll")
        .query({}) // クエリパラメータの追加
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(response.body)).toBe(true); // response.bodyが配列であることを確認
      const keys = Object.keys(response.body[0]); //レスポンスのオブジェクトのキー取得

      expect(keys.length).toBe(5);
      expect(keys).toStrictEqual(["id", "name", "img", "link", "season"]);
      expect(response.body.some((item: any) => item.id === allCategoryId)).toBe(
        false
      ); // 配列内にid=100の要素が存在することを確認
    });
  });
  describe("[GET] /search", () => {
    test("カテゴリ検索機能 -正常系", async () => {
      const randomIndex = Math.floor(Math.random() * testCategory.length);
      const categoryId = testCategory[randomIndex].id;
      const response = await request(app)
        .get("/eatfish_back/api/category/search")
        .query({ categoryId }) // クエリパラメータの追加
        .expect(200)
        .expect("Content-Type", /json/);

      const keys = Object.keys(response.body); //レスポンスのオブジェクトのキー取得

      expect(keys.length).toBe(5);
      expect(keys).toStrictEqual(["id", "name", "img", "link", "season"]);
      expect(response.body.id).toBe(categoryId); // 指定したカテゴリがとれてきていることを確認
    });
    test("カテゴリ検索機能 異常系-カテゴリID指定なし", async () => {
      const response = await request(app)
        .get("/eatfish_back/api/category/search")
        .query({}) // カテゴリID指定なし
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toHaveLength(1);
    });
  });
});
