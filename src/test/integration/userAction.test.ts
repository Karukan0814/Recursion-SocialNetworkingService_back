import request from "supertest";
// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const app = express();
// JSON パーサーを有効にする
app.use(express.json());
const userActionRoute = require("../../routes/userAction");
const userRoute = require("../../routes/user");

//axios用モック
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const mock = new MockAdapter(axios);

const jwt = require("jsonwebtoken");

app.use("/eatfish_back/api/userActions", userActionRoute);
app.use("/eatfish_back/api/user", userRoute);

import { ArticleType, PrismaClient } from "@prisma/client";
import { testUsers } from "./testData/testUsers";
import { testCategory } from "./testData/testCategory";
import { testArticles } from "./testData/testArticles";
import resetDb from "./reset-db";
import { generateRandomString } from "./lib/library";
import { allCategoryId } from "../../lib/constant";

const prisma = new PrismaClient();
// const prisma = jestPrisma.client;

console.log("userAction test");

type User = {
  id: any;
  uid?: string;
  name?: string;
  userImg?: string;
  isAdmin?: boolean;
  introduction?: string;
};

describe("/eatfish_back/api/userActions", () => {
  let normalUsers: User[];
  let setUpUser: User;
  let normalUser: User;

  let adminUser: User;

  beforeEach(async () => {
    console.log("setup");

    await resetDb();

    await prisma.category.createMany({ data: testCategory });
    await prisma.user.createMany({
      data: testUsers.map((user) => {
        return {
          uid: generateRandomString(16),
          name: user.name,
          userImg: user.userImg,
          isAdmin: user.isAdmin,
          introduction: user.introduction,
        };
      }),
    });

    const userList = await prisma.user.findMany();
    // const randomIndex = Math.floor(Math.random() * userList.length);
    // const randomUser = userList[randomIndex];
    normalUsers = userList.filter((user) => !user.isAdmin);
    setUpUser = normalUsers[0];
    normalUser = normalUsers[1];

    // 記事一件登録
    const title = "registerArticle";
    const type = "RECIPE";
    const link = "newLink";
    const img = "newImg";
    const categories = [1, 2];

    const result = await prisma.article.create({
      data: {
        title,
        type,
        link,
        img,
        categories: {
          connect: categories.map((category) => {
            return {
              id: category,
            };
          }),
        },
        userId: setUpUser.id,
      },
    });

    const articleId = result.id;

    // コメント作成
    const commentresult = await prisma.articleComment.create({
      data: {
        article: { connect: { id: articleId } }, // 記事にリレーション
        user: { connect: { id: setUpUser.id } }, // ユーザーにリレーション
        comment: "test",
      },
      include: { user: true }, // ユーザーの詳細情報を取得
    });
    // いいね
    const likeresult = await prisma.articleLike.create({
      data: {
        article: { connect: { id: articleId } }, // 記事にリレーション
        user: { connect: { id: setUpUser.id } }, // ユーザーにリレーション
      },
    });
    // ブックマーク
    const bookmarkResult = await prisma.articleBookmark.create({
      data: {
        article: { connect: { id: articleId } }, // 記事にリレーション
        user: { connect: { id: setUpUser.id } }, // ユーザーにリレーション
      },
    });
  });

  afterEach(async () => {
    await prisma.$disconnect();
    mock.reset();
  });

  describe("[GET] /comment/search", () => {
    test("コメント検索機能", async () => {
      const articleList = await prisma.article.findMany({
        include: { comments: true },
      });
      const article = articleList[0];
      const articleId = article.id;
      // データベースから取得した記事のコメントリスト
      const expectedComments = article.comments;

      const response = await request(app)
        .get("/eatfish_back/api/userActions/comment/search")
        .query({ articleId }) // クエリパラメータの追加
        .expect(200)
        .expect("Content-Type", /json/);

      const commentList = response.body;
      expect(commentList.length).toBe(expectedComments.length);
      commentList.forEach((comment: any, index: number) => {
        const expectedComment = expectedComments[index];
        expect(comment.id).toBe(expectedComment.id);
        expect(comment.articleId).toBe(expectedComment.articleId);
        expect(comment.comment).toBe(expectedComment.comment);
        expect(comment.userId).toBe(expectedComment.userId);
      });
    });
  });
  describe("[POST] /comment/register", () => {
    test("コメント登録機能", async () => {
      const articleList = await prisma.article.findMany({
        include: { comments: true },
      });
      const article = articleList[0];
      const articleId = article.id;

      const userList = await prisma.user.findMany();
      const randomIndex = Math.floor(Math.random() * userList.length);
      const randomUser = userList[randomIndex];
      const userId = randomUser.id;
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: randomUser.id, uid: randomUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      const comment = "registerComment";

      const response = await request(app)
        .post("/eatfish_back/api/userActions/comment/register")
        .send({ articleId, userId, comment }) // クエリパラメータの追加
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200)
        .expect("Content-Type", /json/);

      const newComment = response.body;
      expect(newComment.comment).toBe(comment);
      expect(newComment.userId).toBe(userId);
      expect(newComment.articleId).toBe(articleId);
    });
  });
  describe("[POST] /like/register", () => {
    test("いいね登録機能 - いいね登録", async () => {
      const articleList = await prisma.article.findMany({
        include: { likes: true },
      });
      const article = articleList[0];
      const articleId = article.id;

      //   const userList = await prisma.user.findMany();
      //   const randomIndex = Math.floor(Math.random() * userList.length);
      //   const randomUser = userList[randomIndex];
      const userId = normalUser.id;
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: normalUser.id, uid: normalUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      const like = true;

      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId, userId, like }) // クエリパラメータの追加
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200)
        .expect("Content-Type", /json/);

      const likeCount = response.body;
      expect(likeCount).toBe(article.likes.length + 1);
    });
    test("いいね登録機能 - いいね削除", async () => {
      const articleList = await prisma.article.findMany({
        include: { likes: true },
      });
      const article = articleList[0];
      const articleId = article.id;

      const userId = setUpUser.id;
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: setUpUser.id, uid: setUpUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      const like = false;

      const response = await request(app)
        .post("/eatfish_back/api/userActions/like/register")
        .send({ articleId, userId, like }) // クエリパラメータの追加
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200)
        .expect("Content-Type", /json/);

      const likeCount = response.body;
      expect(likeCount).toBe(article.likes.length - 1);
    });
  });

  describe("[POST] /bookmark/register", () => {
    test("ブックマーク登録機能 - ブックマーク登録", async () => {
      const articleList = await prisma.article.findMany({
        include: { bookmarks: true },
      });
      const article = articleList[0];
      const articleId = article.id;

      const userId = normalUser.id;
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: normalUser.id, uid: normalUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      const bookmark = true;

      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId, userId, bookmark }) // クエリパラメータの追加
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200);

      const currentBookmark = await prisma.articleBookmark.findMany({
        where: {
          articleId: articleId,
          userId: userId,
        },
      });
      expect(currentBookmark.length).toBe(1);
    });
    test("ブックマーク登録機能 - ブックマーク削除", async () => {
      const articleList = await prisma.article.findMany({
        include: { bookmarks: true },
      });
      const article = articleList[0];
      const articleId = article.id;

      const userId = setUpUser.id;
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: setUpUser.id, uid: setUpUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      const bookmark = false;

      const response = await request(app)
        .post("/eatfish_back/api/userActions/bookmark/register")
        .send({ articleId, userId, bookmark }) // クエリパラメータの追加
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200);

      const currentBookmark = await prisma.articleBookmark.findMany({
        where: {
          articleId: articleId,
          userId: userId,
        },
      });
      expect(currentBookmark.length).toBe(0);
    });
  });
});
