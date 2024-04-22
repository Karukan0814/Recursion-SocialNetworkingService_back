import request from "supertest";
// Express アプリケーションを作成し、ルーターを使用
const express = require("express");
const app = express();
// JSON パーサーを有効にする
app.use(express.json());
const userRoute = require("../../routes/user");

const jwt = require("jsonwebtoken");

app.use("/eatfish_back/api/user", userRoute);

import { PrismaClient } from "@prisma/client";
import { testUsers } from "./testData/testUsers";
import resetDb from "./reset-db";
import { generateRandomString } from "./lib/library";

const prisma = new PrismaClient();
console.log("user test");

//ユーザー関連APIテスト
describe("/eatfish_back/api/user", () => {
  beforeEach(async () => {
    console.log("setup");

    await resetDb();

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

    // await prisma.category.createMany({ data: testCategory });
    // const afterusers = await prisma.user.findMany();
    // console.log("afterusers", afterusers);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });
  describe("[POST] /search", () => {
    test("ログイン機能", async () => {
      console.log("ログイン機能");

      const userList = await prisma.user.findMany();
      const randomIndex = Math.floor(Math.random() * userList.length);
      const randomUser = userList[randomIndex];

      const response = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ uid: randomUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("token");
      expect(jwt.verify(response.body.token, process.env.JWT_SECRET as string));
      expect(response.body).toHaveProperty("user");

      // // response.body から id プロパティを除いたオブジェクトを作成
      // const responseBodyWithoutId = { ...response.body.user };
      // delete responseBodyWithoutId.id;
      expect(response.body.user).toEqual(randomUser);
    });
  });
  describe("[POST] /register", () => {
    test("ユーザー登録機能", async () => {
      console.log("ユーザー登録機能");
      const registerUser = {
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        name: "登録ユーザー名",
        userImg:
          "https://firebasestorage.googleapis.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        isAdmin: true,
        introduction: "登録ユーザー自己紹介",
      };
      const response = await request(app)
        .post("/eatfish_back/api/user/register")
        .send(registerUser)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("token");
      expect(jwt.verify(response.body.token, process.env.JWT_SECRET as string));
      expect(response.body).toHaveProperty("user");

      // response.body から id プロパティを除いたオブジェクトを作成
      const responseBodyWithoutId = { ...response.body.user };
      delete responseBodyWithoutId.id;
      expect(responseBodyWithoutId).toEqual(registerUser);
    });
  });
  describe("[PUT] /update", () => {
    test("ユーザー情報変更機能", async () => {
      console.log("ユーザー情報変更機能");

      const userList = await prisma.user.findMany({});

      const randomIndex = Math.floor(Math.random() * userList.length);
      const randomUser = userList[randomIndex];

      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: randomUser.id, uid: randomUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(loginRes.body).toHaveProperty("token");
      expect(jwt.verify(loginRes.body.token, process.env.JWT_SECRET as string));

      const changedUser = {
        id: randomUser.id,
        uid: randomUser.uid,
        name: "変更ユーザー名",
        userImg: "updatedUserImg.jpg",
        isAdmin: !randomUser.isAdmin,
        introduction: "変更ユーザー自己紹介",
      };

      const response = await request(app)
        .put("/eatfish_back/api/user/update")
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .send(changedUser)
        .expect(200)

        .expect("Content-Type", /json/);

      expect(response.body).toEqual(changedUser);
    });
  });

  describe("[DELETE] /delete", () => {
    test("ユーザー情報削除機能", async () => {
      console.log("ユーザー情報削除機能");

      const userList = await prisma.user.findMany({});

      const randomIndex = Math.floor(Math.random() * userList.length);
      const randomUser = userList[randomIndex];

      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: randomUser.id, uid: randomUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(loginRes.body).toHaveProperty("token");
      expect(jwt.verify(loginRes.body.token, process.env.JWT_SECRET as string));

      const response = await request(app)
        .delete("/eatfish_back/api/user/delete")
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .send({ id: randomUser.id, uid: randomUser.uid })
        .expect(200)
        .expect(
          `User with UID:id( ${randomUser.id}),uid (${randomUser.uid}) deleted successfully`
        );
    });
  });
  // トークン有効期限確認機能
  describe("[POST] /checkToken", () => {
    test("トークン有効期限確認機能 valid", async () => {
      console.log("トークン有効期限確認機能 valid");

      const userList = await prisma.user.findMany({});

      const randomIndex = Math.floor(Math.random() * userList.length);
      const randomUser = userList[randomIndex];

      //ログイン処理
      const loginRes = await request(app)
        .post("/eatfish_back/api/user/login")
        .send({ id: randomUser.id, uid: randomUser.uid })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(loginRes.body).toHaveProperty("token");
      expect(jwt.verify(loginRes.body.token, process.env.JWT_SECRET as string));

      const response = await request(app)
        .post("/eatfish_back/api/user/checkToken")
        .set("Authorization", `Bearer ${loginRes.body.token}`) //トークン情報をヘッダーに付与
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("valid");
      expect(response.body.valid).toBe(true);
    });
    test("トークン有効期限確認機能 invalid", async () => {
      console.log("トークン有効期限確認機能 invalid");

      const userList = await prisma.user.findMany({});

      const randomIndex = Math.floor(Math.random() * userList.length);
      const randomUser = userList[randomIndex];

      const invalidToken = jwt.sign(randomUser, process.env.JWT_SECRET, {
        expiresIn: "0",
      });
      const response = await request(app)
        .post("/eatfish_back/api/user/checkToken")
        .set("Authorization", `Bearer ${invalidToken}`) //トークン情報をヘッダーに付与
        .expect(403)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("valid");
      expect(response.body.valid).toBe(false);
      expect(response.body).toHaveProperty("error");

      expect(response.body.error).toBe("Invalid token");
    });
  });
});
