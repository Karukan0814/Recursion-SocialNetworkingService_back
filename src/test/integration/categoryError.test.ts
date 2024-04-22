const request = require("supertest");
import { prismaMock } from "../integration/singleton";

import { allCategoryId } from "../../lib/constant";
const categoryRoute = require("../../routes/category");

const path = require("path");
//カテゴリAPIテスト
const fs = require("fs");

type Season = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
type CategoryInfo = {
  id: number;
  name: string;
  img: string | null;
  link: string | null;
  season: Season;
} | null;
// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const app = express();
app.use("/eatfish_back/api/category", categoryRoute);

describe("カテゴリ関連APIテスト", () => {
  //カテゴリ検索機能
  describe("GET /search", () => {
    test("異常系-カテゴリID指定なし", async () => {
      const response = await request(app)
        .get("/eatfish_back/api/category/search")
        .query({}) // カテゴリID指定なし
        .expect(400)
        .expect("Content-Type", /json/);

      // バリデーションエラーのメッセージや形式を確認
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toHaveLength(1);
    });
    test("異常系-prismaエラー", async () => {
      prismaMock.category.findUnique.mockRejectedValue(
        new Error("Database error")
      );
      const response = await request(app)
        .get("/eatfish_back/api/category/search")
        .query({ categoryId: 1 })
        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });

  // 全カテゴリ取得機能
  describe("GET /searchAll", () => {
    test("異常系-prismaエラー", async () => {
      prismaMock.category.findMany.mockRejectedValue(
        new Error("Database error")
      );
      const response = await request(app)
        .get("/eatfish_back/api/category/searchAll")
        .query({ withAll: "true" })
        .expect(500);
      // エラーメッセージや形式を検証
      //   expect(response.body).toHaveProperty("error", "Error searching category");
    });
  });
});
