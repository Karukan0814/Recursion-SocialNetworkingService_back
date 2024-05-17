import prisma from "../lib/db";
import bcrypt from "bcryptjs";

import { NUMBER_OF_USERS } from "./seederConatants";
import { generatePostText } from "../lib/util";
// import { faker } from "../../node_modules/@faker-js/faker/dist/types/index";
import { faker } from "@faker-js/faker";

//【要件】 アプリケーションは数千人の架空のユーザーを生成する必要があります。

async function userSeeder() {
  console.log("userSeeder_start");
  const testUsers = [];
  //定数：NUMBER_OF_USERSの分だけfakeUserを作成
  for (let i = 0; i < NUMBER_OF_USERS; i++) {
    const hashedPassword = await bcrypt.hash("password", 10);

    testUsers.push({
      name: faker.internet.userName(),
      userImg: faker.image.avatar(),
      email: faker.internet.email(),
      emailVerifiedAt: faker.date.past(),
      password: hashedPassword, //bcryptを利用してテストパスワード"password"をハッシュか
      isAdmin: false,
      introduction: generatePostText(255),
      fakeFlag: true,
    });
  }

  console.log({ testUsers });
  try {
    await prisma.user.createMany({ data: testUsers, skipDuplicates: true });
    console.log("Users seeded successfully.");
  } catch (error) {
    console.error("User insert failed:", error);
  }
  console.log("Users seeded");
}

export default userSeeder;
