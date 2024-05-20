import prisma from "../lib/db";
import { POSTS_PER_USER } from "./seederConatants";

import {
  generatePostText,
  generateRandomImageUrl,
  getRandomDateWithin24Hours,
} from "../lib/util";

async function postSeeder(setRandom = false) {
  console.log("postSeeder_start");
  const testParentPost: Array<any> = [];
  const testUserList = await prisma.user.findMany({
    where: {
      fakeFlag: true,
    },
  }); //登録されているフェイクのユーザーのリストを取得

  //一日当たり指定の回数ポストするように設定
  for (let user of testUserList) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      testParentPost.push({
        text: generatePostText(200),
        img: generateRandomImageUrl(),
        imgFileType: "image/jpeg", //piscumは通常、jpegファイルを返すため
        userId: user.id,
        scheduledAt: setRandom ? getRandomDateWithin24Hours() : null, //24時間以内の適当な日時を入れる
        sentAt: setRandom ? null : new Date(),
      });
    }
  }

  // console.log({ testParentPost });
  try {
    const posts = await prisma.post.createMany({
      data: testParentPost,
      skipDuplicates: true,
    });
    console.log("Posts seeded successfully.", posts.count);
  } catch (error) {
    console.error("posts insert failed:", error);
  }
  console.log("Posts seeded");
}

export default postSeeder;
