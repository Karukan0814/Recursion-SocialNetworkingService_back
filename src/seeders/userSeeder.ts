import { User } from "@prisma/client";
import prisma from "../lib/db";
const bcrypt = require("bcryptjs");
import { faker } from "@faker-js/faker";

function generateText() {
  let text = faker.lorem.paragraph();
  // 文章が255文字を超える場合、255文字に切り詰める
  if (text.length > 255) {
    text = text.substring(0, 255);
  }
  return text;
}

async function userSeeder() {
  console.log("userSeeder_start");
  const testUsers = [];
  for (let i = 0; i < 100; i++) {
    testUsers.push({
      name: faker.internet.userName(),
      userImg: faker.image.avatar(),
      email: faker.internet.email(),
      emailVerifiedAt: faker.date.past(),
      password: bcrypt.hashSync("password", 10), //bcryptを利用してテストパスワード"password"をハッシュか
      isAdmin: false,
      introduction: generateText(),
    });
  }
  //   console.log({ testUsers });
  await prisma.user.createMany({ data: testUsers });
  console.log("Users seeded");
}

export default userSeeder;
