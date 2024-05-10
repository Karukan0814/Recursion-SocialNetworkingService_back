import prisma from "../lib/db";
const bcrypt = require("bcryptjs");
import { faker } from "@faker-js/faker";
import { registerNotification } from "../lib/util";
import { NotificationType } from "@prisma/client";

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
async function replySeeder() {
  console.log("replySeeder_start");
  const testReplies = [];
  const testUserList = await prisma.user.findMany();

  const testPostList = await prisma.post.findMany({
    where: {
      NOT: {
        sentAt: null,
      },
      // createdAt: {
      //   gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // createdAtが24時間前以上のもの
      // },
    },
  });
  if (testUserList.length > 0 && testPostList.length > 0) {
    for (let i = 0; i < 200; i++) {
      // リストからランダムに1ユーザーを選択
      const randomIndexUser = Math.floor(Math.random() * testUserList.length);
      const randomUser = testUserList[randomIndexUser];

      // console.log(randomUser); // ランダムに選ばれたユーザーの情報を表示
      // リストからランダムに1ポストを選択
      const randomIndexPost = Math.floor(Math.random() * testPostList.length);
      const randomPost = testPostList[randomIndexPost];
      console.log(randomPost); // ランダムに選ばれたユーザーの情報を表示

      testReplies.push(
        {
          text: generatePostText(),
          img: generateRandomImageUrl(),
          userId: randomUser.id,
          replyToId: randomPost.id,
          sentAt: new Date(),
        } // ユーザーにリレーション
      );
    }
  } else {
    console.log("No users or no posts found in the database.");
  }

  console.log({ testReplies });
  try {
    for (const rep of testReplies) {
      const newRep = await prisma.post.create({
        data: rep,
        include: {
          post: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
        // skipDuplicates: true,
      });

      await registerNotification(
        NotificationType.REPLY,
        newRep.post?.userId!,
        newRep.userId,
        newRep.post?.id!
      );
    }
    console.log("Likes seeded successfully.");
  } catch (error) {
    console.error("Likes insert failed:", error);
  }
  console.log("Likes seeded");
}

export default replySeeder;
