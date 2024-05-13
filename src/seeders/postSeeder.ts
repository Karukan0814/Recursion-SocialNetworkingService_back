import prisma from "../lib/db";
const bcrypt = require("bcryptjs");
import { faker } from "@faker-js/faker";

function generatePostText() {
  const text = faker.lorem.paragraphs(); // ランダムな段落を生成
  const trimmedText = text.slice(0, 200); // 200文字にトリム
  return trimmedText;
}
function generateRandomImageUrl() {
  const width = faker.datatype.number({ min: 100, max: 1000 });
  const height = faker.datatype.number({ min: 100, max: 1000 });
  return `https://picsum.photos/${width}/${height}`;
}
async function postSeeder() {
  console.log("postSeeder_start");
  const testParentPost = [];
  const testUserList = await prisma.user.findMany();
  for (let i = 0; i < 100; i++) {
    if (testUserList.length > 0) {
      // リストからランダムに1ユーザーを選択
      const randomIndex = Math.floor(Math.random() * testUserList.length);
      const randomUser = testUserList[randomIndex];

      console.log(randomUser); // ランダムに選ばれたユーザーの情報を表示
      testParentPost.push({
        text: generatePostText(),
        img: generateRandomImageUrl(),
        imgFileType: "image/jpeg", //piscumは通常、jpegファイルを返すため

        userId: randomUser.id,
        sentAt: new Date(),
      });
    } else {
      console.log("No users found in the database.");
    }
  }

  console.log({ testParentPost });
  try {
    await prisma.post.createMany({
      data: testParentPost,
      skipDuplicates: true,
    });
    console.log("Posts seeded successfully.");
  } catch (error) {
    console.error("posts insert failed:", error);
  }
  console.log("Posts seeded");
}

export default postSeeder;
