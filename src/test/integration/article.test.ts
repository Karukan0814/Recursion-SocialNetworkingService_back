import request from "supertest";
// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const app = express();
// JSON パーサーを有効にする
app.use(express.json());
const articleRoute = require("../../routes/article");
const userRoute = require("../../routes/user");

//axios用モック
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const mock = new MockAdapter(axios);

const jwt = require("jsonwebtoken");

app.use("/eatfish_back/api/article", articleRoute);
app.use("/eatfish_back/api/user", userRoute);

import { ArticleType, PrismaClient } from "@prisma/client";
import { testUsers } from "./testData/testUsers";
import { testCategory } from "./testData/testCategory";
import { testArticles } from "./testData/testArticles";
import resetDb from "./reset-db";
import { generateRandomString } from "./lib/library";
import { allCategoryId } from "../../lib/constant";
import { read } from "fs";

const prisma = new PrismaClient();
// const prisma = jestPrisma.client;

console.log("article test");

type User = {
  id: any;
  uid?: string;
  name?: string;
  userImg?: string;
  isAdmin?: boolean;
  introduction?: string;
};
describe("/eatfish_back/api/article", () => {
  let normalUsers: User[];
  let setUpUser: User | null;
  let normalUser: User | null;

  let adminUser: User | null;
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
    normalUsers = userList.filter((user) => !user.isAdmin);
    setUpUser = normalUsers.length > 0 ? normalUsers[0] : null;
    normalUser = normalUsers.length > 1 ? normalUsers[1] : null;

    const adminUsers = userList.filter((user) => user.isAdmin);
    adminUser = adminUsers.length > 0 ? adminUsers[0] : null;
    for (const article of testArticles) {
      // 指定の基準日時
      const baseDate = new Date("2023-01-01T00:00:00Z");

      // インデックスに対応する日数を足す
      const incrementedDate = new Date(
        baseDate.getTime() + testArticles.indexOf(article) * 24 * 60 * 60 * 1000
      );

      const result = await prisma.article.create({
        data: {
          title: article.title,
          type: article.type as any,
          link: article.link,
          img: article.img,
          categories: {
            connect: article.categories.map((category) => {
              return {
                id: category,
              };
            }),
          },
          userId: setUpUser!.id,
          createdAt: incrementedDate, // インデックスに応じて日時をずらす
          updatedAt: incrementedDate,
        },
      });
    }
  });

  afterEach(async () => {
    console.log("reset");
    await prisma.$disconnect();
    await mock.reset();
  });

  describe("[GET] /articleCount", () => {
    test("記事数取得機能", async () => {
      const type = "RECIPE";
      const recipes = testArticles.filter((article) => article.type === type);

      const response = await request(app)
        .get("/eatfish_back/api/article/articleCount")
        .query({ type }) // クエリパラメータの追加
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty(
        "totalArticlesCount",
        recipes.length
      );
    });
  });

  describe("[POST] /register", () => {
    test("記事登録機能", async () => {
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: normalUser?.id, uid: normalUser?.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      const newArticle = {
        title: "newArticle",
        type: "RECIPE",
        link: "linklink",
        img: "image",
        categories: [1, 2],
        userId: normalUser?.id,
      };
      const response = await request(app)
        .post("/eatfish_back/api/article/register")
        .send(newArticle)
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与

        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body.title).toBe(newArticle.title);
    });
  });
  describe("[GET] /search", () => {
    test("記事リスト取得機能－デフォルト", async () => {
      const count = 6;
      const page = 1;
      const skip = (page - 1) * count; // ページ番号からskip数を計算

      const response = await request(app)
        .get("/eatfish_back/api/article/search")
        .expect(200)
        .expect("Content-Type", /json/);

      const articleTestData = await prisma.article.findMany({
        take: count,
        skip: skip,
        orderBy: {
          createdAt: "desc", // デフォルトは新着順
        },
        include: {
          categories: true,
          comments: {
            include: {
              user: true,
            },
          },
          likes: true,
          bookmarks: true,
        },
      });
      const responseArticles = response.body;

      // レスポンスデータの数が期待される数と一致することを確認
      expect(responseArticles.length).toEqual(articleTestData.length);
      // テストデータとレスポンスデータの比較
      articleTestData.forEach((testArticle, index) => {
        const responseArticle = response.body[index];
        expect(responseArticle.id).toBe(testArticle.id);
        expect(responseArticle.title).toBe(testArticle.title);
        expect(responseArticle.type).toBe(testArticle.type);
        expect(responseArticle.link).toBe(testArticle.link);
        expect(responseArticle.img).toBe(testArticle.img);
        expect(responseArticle.userId).toBe(testArticle.userId);
        expect(responseArticle.categories.map((val: any) => val.id)).toEqual(
          testArticle.categories.map((val) => val.id)
        );

        // TODO カテゴリ―やブックマークなどの内容を確認
      });
    });
    test("記事リスト取得機能－パラメータ指定", async () => {
      const type = "RECIPE";
      const count = 2;
      const page = 2;
      const skip = (page - 1) * count; // ページ番号からskip数を計算

      //任意の記事にいいねをつける
      const allArticles = await prisma.article.findMany({
        where: { type: type },
      });

      // 配列からランダムに4つの記事を選択
      const selectedArticles = [];
      for (let i = 0; i < count * page; i++) {
        const randomIndex = Math.floor(Math.random() * allArticles.length);
        selectedArticles.push(allArticles[randomIndex]);
        allArticles.splice(randomIndex, 1); // 選択された記事を元の配列から削除*重複をふせぐため
      }

      const userList = await prisma.user.findMany();

      // 選択された記事に対して「いいね」を登録
      for (let i = 0; i < selectedArticles.length; i++) {
        // 記事ごとに異なる数の「いいね」を設定
        for (let j = 0; j < userList.length - i; j++) {
          await prisma.articleLike.create({
            data: {
              articleId: selectedArticles[i].id, // 選択された記事ID
              userId: userList[j].id, // ユーザーID
            },
          });
        }
      }
      console.log(
        "selectedArticles",
        selectedArticles.map((val) => val.id)
      );
      const response = await request(app)
        .get("/eatfish_back/api/article/search")
        .query({ count, type, page, orderBy: "likes" })
        .expect(200)
        .expect("Content-Type", /json/);

      const whereClause: any = {};
      whereClause.type = type;

      const answerData = selectedArticles.slice(skip, skip + count);

      const responseArticles = response.body;
      console.log(
        "responseArticles",
        responseArticles.map((val: any) => val.id)
      );
      // レスポンスデータの数が期待される数と一致することを確認
      expect(responseArticles.length).toEqual(answerData.length);
      // テストデータとレスポンスデータの比較
      answerData.forEach((testArticle, index) => {
        const responseArticle = response.body[index];
        expect(responseArticle.id).toBe(testArticle.id);
        // expect(responseArticle.title).toBe(testArticle.title);
        // expect(responseArticle.type).toBe(testArticle.type);
        // expect(responseArticle.link).toBe(testArticle.link);
        // expect(responseArticle.img).toBe(testArticle.img);
        // expect(responseArticle.userId).toBe(testArticle.userId);
      });
    });
  });

  describe("[POST] /searchByUser", () => {
    test("ユーザーごと記事取得", async () => {
      const randomUser = await prisma.user.create({
        data: {
          uid: generateRandomString(16),
          name: "randomUsername",
          userImg: "randomUsernameImg",
          isAdmin: false,
          introduction: "randomUsernameIntro",
        },
      });

      const articleList = await prisma.article.findMany({});

      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: randomUser.id, uid: randomUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      //いいね処理

      // 配列からランダムに2つの記事を選択
      const likeArticles = [];
      for (let i = 0; i < 1; i++) {
        const randomIndex = Math.floor(Math.random() * articleList.length);
        likeArticles.push(articleList[randomIndex]);
        articleList.splice(randomIndex, 1); // 選択された記事を元の配列から削除*重複をふせぐため
      }

      console.log("likeArticles", likeArticles);
      const likes = await prisma.articleLike.createMany({
        data: likeArticles.map((article) => {
          return {
            articleId: article.id,
            userId: randomUser.id,
          };
        }),
      });

      //ブックマーク処理

      // 配列からランダムに2つの記事を選択
      const bookmarkArticles = [];
      for (let i = 0; i < 1; i++) {
        const randomIndex = Math.floor(Math.random() * articleList.length);
        bookmarkArticles.push(articleList[randomIndex]);
        articleList.splice(randomIndex, 1); // 選択された記事を元の配列から削除*重複をふせぐため
      }
      const bookmark = await prisma.articleBookmark.createMany({
        data: bookmarkArticles.map((article) => {
          return {
            articleId: article.id,
            userId: randomUser.id,
          };
        }),
      });

      //コメント処理

      // 配列からランダムに2つの記事を選択
      const commentArticles = [];
      for (let i = 0; i < 1; i++) {
        const randomIndex = Math.floor(Math.random() * articleList.length);
        commentArticles.push(articleList[randomIndex]);
        articleList.splice(randomIndex, 1); // 選択された記事を元の配列から削除*重複をふせぐため
      }
      const comment = await prisma.articleComment.createMany({
        data: bookmarkArticles.map((article) => {
          return {
            articleId: article.id,
            comment: `コメント${article.id}`,
            userId: randomUser.id,
          };
        }),
      });

      //記事登録処理
      const newArticles = [
        {
          title: "newArticle1",
          type: "RECIPE" as ArticleType,
          link: "linklink1",
          img: "image",
          categories: [{ id: 1 }, { id: 2 }],
          userId: randomUser.id,
        },
        {
          title: "newArticle2",
          type: "RECIPE" as ArticleType,
          link: "linklink2",
          img: "image",
          categories: [{ id: 3 }, { id: 4 }],
          userId: randomUser.id,
        },
      ];
      for (const article of newArticles) {
        const newarticle = await prisma.article.create({
          data: {
            title: article.title,
            type: article.type,
            link: article.link,
            img: article.img,
            categories: {
              connect: article.categories,
            },
            userId: article.userId,
          },
        });
      }

      //ユーザーごとの記事の取得
      const response = await request(app)
        .post("/eatfish_back/api/article/searchByUser")
        .send({ userId: randomUser.id })
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200)
        .expect("Content-Type", /json/);

      const responseUserArticles = response.body;
      const resLikeIdList = responseUserArticles.LIKE.map(
        (article: any) => article.id
      );
      expect(resLikeIdList.sort()).toEqual(
        likeArticles.map((article) => article.id).sort()
      );
      const resBookmarkIdList = responseUserArticles.BOOKMARK.map(
        (article: any) => article.id
      );
      const resCommentIdList = responseUserArticles.COMMENT.map(
        (article: any) => article.id
      );

      const resNewArticleIdList = responseUserArticles.USER.map(
        (article: any) => article.id
      );
    });
  });
  // describe("[GET] /checkUrl", () => {
  //   test("URLチェック異常系- 同一URLエラー", async () => {
  //     const url = testArticles[0].link;
  //     const selectedCategories = [1, 2];

  //     const response = await request(app)
  //       .get("/eatfish_back/api/article/checkURL")
  //       .query({ url, selectedCategories })
  //       .expect(409);
  //   });
  // });

  describe("[GET] /getMetadata", () => {
    test("メタデータ取得 正常系- imageあり＋取得成功", async () => {
      const url = "https://www.sirogohan.com/sp/recipe/buridaikon/";
      mock.onAny().passThrough();

      const response = await request(app)
        .get("/eatfish_back/api/article/getMetadata")
        .query({ url })
        .expect(200)
        .expect("Content-Type", /json/);

      const data = response.body;

      // 以下のプロパティが含まれ、かつfalsyでないことを確認
      expect(data).toHaveProperty("title");

      expect(data).toHaveProperty("image");
      expect(data.image).toBeTruthy();
      expect(data.image).toHaveProperty("data");
      expect(data.image.data).toBeTruthy();
      expect(data.image).toHaveProperty("type");
      expect(data.image.type).toBeTruthy();

      expect(data).toHaveProperty("description");

      expect(data).toHaveProperty("url");
      expect(data.url).toBeTruthy();

      expect(data).toHaveProperty("site_name");

      expect(data).toHaveProperty("icon");

      expect(data).toHaveProperty("keywords");
      // expect(data.keywords).toBeTruthy();
    });
    test("メタデータ取得 正常系- imageなし", async () => {
      const url = "https://eguchihouraikan.jp/";
      mock.onAny().passThrough();

      const response = await request(app)
        .get("/eatfish_back/api/article/getMetadata")
        .query({ url })
        .expect(200)
        .expect("Content-Type", /json/);

      const data = response.body;

      // 以下のプロパティが含まれ、かつimageがfalsyであること
      expect(data).toHaveProperty("title");

      expect(data).toHaveProperty("image");
      expect(data.image).toBeFalsy();

      expect(data).toHaveProperty("description");

      expect(data).toHaveProperty("url");
      expect(data.url).toBeTruthy();

      expect(data).toHaveProperty("site_name");

      expect(data).toHaveProperty("icon");

      expect(data).toHaveProperty("keywords");
    });
    test("メタデータ取得 異常系- imageあり＋取得失敗", async () => {
      const url = "https://www.sirogohan.com/sp/recipe/buridaikon/";

      mock
        .onGet(
          "https://www.sirogohan.com/_files/recipe/images/buridaikon/buridaikon0523re.JPG"
        )
        .reply(500, {});

      // 他のリクエストには影響を与えない
      mock.onAny().passThrough();

      const response = await request(app)
        .get("/eatfish_back/api/article/getMetadata")
        .query({ url })
        .expect(200)
        .expect("Content-Type", /json/);
      const data = response.body;

      // 以下のプロパティが含まれ、かつimageがfalsyであること
      expect(data).toHaveProperty("title");

      expect(data).toHaveProperty("image");
      expect(data.image).toBeFalsy();

      expect(data).toHaveProperty("description");

      expect(data).toHaveProperty("url");
      expect(data.url).toBeTruthy();

      expect(data).toHaveProperty("site_name");

      expect(data).toHaveProperty("icon");

      expect(data).toHaveProperty("keywords");
    });

    test("メタデータ取得 異常系- HTMLデータ取得失敗", async () => {
      const url = "https://www.sirogohan.com/sp/recipe/buridaikon/";

      mock.onGet(url).reply(500, {});

      // 他のリクエストには影響を与えない
      mock.onAny().passThrough();

      const response = await request(app)
        .get("/eatfish_back/api/article/getMetadata")
        .query({ url })
        .expect(500);
    });
  });
  describe("[POST] /register", () => {
    test("記事作成機能 正常系", async () => {
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: normalUser?.id, uid: normalUser?.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      //記事の登録
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
          userId: normalUser?.id,
        })
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200)
        .expect("Content-Type", /json/);

      const articleList = await prisma.article.findMany({
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          categories: true,
        },
      });
      const receivedArticle = articleList[0];
      expect(receivedArticle.title).toBe(title);
      expect(receivedArticle.type).toBe(type);
      expect(receivedArticle.link).toBe(link);
      expect(receivedArticle.img).toBe(img);
      expect(receivedArticle.categories.map((val) => val.id)).toEqual(
        categories
      );

      expect(receivedArticle.userId).toBe(normalUser?.id);
    });
  });
  describe("[DELETE] /delete", () => {
    test("記事削除機能 正常系ー作成者", async () => {
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: normalUser?.id, uid: normalUser?.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      //記事の登録
      const title = "registerArticle";
      const type = "RECIPE";
      const link = "newLink";
      const img = "newImg";
      const categories = [1, 2];
      const categoriesObj = categories.map((categoryId) => {
        return { id: categoryId };
      });

      // 記事作成
      const response = await prisma.article.create({
        data: {
          title,
          type,
          link,
          img,
          categories: {
            connect: categoriesObj,
          },
          userId: normalUser?.id,
        },
      });

      const articleId = response.id;

      // コメント作成
      const commentresult = await prisma.articleComment.create({
        data: {
          article: { connect: { id: articleId } }, // 記事にリレーション
          user: { connect: { id: normalUser?.id } }, // ユーザーにリレーション
          comment: "test",
        },
        include: { user: true }, // ユーザーの詳細情報を取得
      });
      // いいね
      const likeresult = await prisma.articleLike.create({
        data: {
          article: { connect: { id: articleId } }, // 記事にリレーション
          user: { connect: { id: normalUser?.id } }, // ユーザーにリレーション
        },
      });
      // ブックマーク
      const bookmarkResult = await prisma.articleBookmark.create({
        data: {
          article: { connect: { id: articleId } }, // 記事にリレーション
          user: { connect: { id: normalUser?.id } }, // ユーザーにリレーション
        },
      });

      const result = await request(app)
        .delete("/eatfish_back/api/article/delete")
        .query({
          articleId,
          userId: normalUser?.id,
        })
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200);

      const articleList = await prisma.article.findMany({
        where: { id: articleId },
      });
      expect(articleList.length).toBe(0);

      const comments = await prisma.articleComment.findMany({
        where: { articleId },
      });
      expect(comments.length).toBe(0);

      const likes = await prisma.articleLike.findMany({
        where: { articleId },
      });
      expect(likes.length).toBe(0);

      const bookmarks = await prisma.articleBookmark.findMany({
        where: { articleId },
      });
      expect(bookmarks.length).toBe(0);
    });
    test("記事削除機能 正常系ー管理者", async () => {
      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: adminUser?.id, uid: adminUser?.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      //他ユーザーが作成した記事の検索
      const response = await prisma.article.findMany({
        where: {
          userId: {
            not: adminUser?.id,
          },
        },
      });
      const articleId = response[0].id;

      // コメント作成
      const commentresult = await prisma.articleComment.create({
        data: {
          article: { connect: { id: articleId } }, // 記事にリレーション
          user: { connect: { id: normalUser?.id } }, // ユーザーにリレーション
          comment: "test",
        },
        include: { user: true }, // ユーザーの詳細情報を取得
      });
      // いいね
      const likeresult = await prisma.articleLike.create({
        data: {
          article: { connect: { id: articleId } }, // 記事にリレーション
          user: { connect: { id: normalUser?.id } }, // ユーザーにリレーション
        },
      });
      // ブックマーク
      const bookmarkResult = await prisma.articleBookmark.create({
        data: {
          article: { connect: { id: articleId } }, // 記事にリレーション
          user: { connect: { id: normalUser?.id } }, // ユーザーにリレーション
        },
      });

      const result = await request(app)
        .delete("/eatfish_back/api/article/delete")
        .query({
          articleId,
          userId: adminUser?.id,
        })
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200);

      const articleList = await prisma.article.findMany({
        where: { id: articleId },
      });
      expect(articleList.length).toBe(0);

      const comments = await prisma.articleComment.findMany({
        where: { articleId },
      });
      expect(comments.length).toBe(0);

      const likes = await prisma.articleLike.findMany({
        where: { articleId },
      });
      expect(likes.length).toBe(0);

      const bookmarks = await prisma.articleBookmark.findMany({
        where: { articleId },
      });
      expect(bookmarks.length).toBe(0);
    });
  });
  describe("[GET] /searchByCategory", () => {
    test("カテゴリ記事取得", async () => {
      const categoryId = 20;

      const buriArticles = await prisma.article.findMany({
        where: {
          categories: {
            some: {
              OR: [
                {
                  id: categoryId,
                },
                {
                  id: allCategoryId,
                },
              ],
            },
          },
        },
        orderBy: {
          createdAt: "desc", // デフォルトは新着順
        },
      });

      const buriRecipe = buriArticles.filter((val) => val.type === "RECIPE");
      const buriOnline = buriArticles.filter((val) => val.type === "ONLINE");
      const buriShop = buriArticles.filter((val) => val.type === "SHOP");

      const buriRecipeIds = buriRecipe.map((recipe) => {
        return recipe.id;
      });
      const buriOnlineIds = buriOnline.map((online) => {
        return online.id;
      });
      const buriShopIds = buriShop.map((shop) => {
        return shop.id;
      });
      console.log("buriRecipeIds", buriRecipeIds);
      console.log("buriOnlineIds", buriOnlineIds);
      console.log("buriShopIds", buriShopIds);

      const response = await request(app)
        .get("/eatfish_back/api/article/searchByCategory")
        .query({ categoryId })
        .expect(200)
        .expect("Content-Type", /json/);

      const responseArticles = response.body;
      console.log("responseArticles", responseArticles);
      const responseRecipe = responseArticles.RECIPE.map((val: any) => {
        return val.id;
      });
      const responseOnline = responseArticles.ONLINE.map((val: any) => {
        return val.id;
      });
      const responseShop = responseArticles.SHOP.map((val: any) => {
        return val.id;
      });

      console.log("responseRecipe", responseRecipe);
      console.log("responseOnline", responseOnline);
      console.log("responseShop", responseShop);

      expect(responseRecipe).toEqual(buriRecipeIds);
      expect(responseOnline).toEqual(buriOnlineIds);
      expect(responseShop).toEqual(buriShopIds);
    });
  });
});
