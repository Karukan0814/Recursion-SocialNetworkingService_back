import prisma from "../lib/db";
const bcrypt = require("bcryptjs");
import { faker } from "@faker-js/faker";

function generatePostText() {
  const text = faker.lorem.paragraphs(); // ランダムな段落を生成
  const trimmedText = text.slice(0, 255);
  return trimmedText;
}

async function userSeeder() {
  console.log("userSeeder_start");
  const testUsers = [];
  for (let i = 0; i < 100; i++) {
    const hashedPassword = await bcrypt.hash("password", 10);

    testUsers.push({
      name: faker.internet.userName(),
      userImg: faker.image.avatar(),
      email: faker.internet.email(),
      emailVerifiedAt: faker.date.past(),
      password: hashedPassword, //bcryptを利用してテストパスワード"password"をハッシュか
      isAdmin: false,
      introduction: generatePostText(),
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
