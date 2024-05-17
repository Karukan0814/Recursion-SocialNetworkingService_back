import { NotificationType } from "../../node_modules/.prisma/client/index";
import prisma from "../lib/db";
import {
  generatePostText,
  generateRandomImageUrl,
  getRandomObject,
  registerNotification,
} from "../lib/util";

//【要件】 そして、1つのランダムに選ばれたメインの投稿に対して返信をします。=毎日 1 つのランダムなメイン投稿に返信する

async function replySeeder() {
  try {
    console.log("replySeeder_start");
    const testReplies = [];
    const testUserList = await prisma.user.findMany();

    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - 24 * 3600 * 1000); // 24時間前の日時

    const testPostList = await prisma.post.findMany({
      where: {
        sentAt: {
          gte: fromDate, //24時間以内に投稿されたポスト
          lt: toDate,
        },
        replyToId: null, //返信ではない、メインのポスト
        NOT: {
          sentAt: null,
        },
      },
    });
    if (testUserList.length > 0 && testPostList.length > 0) {
      for (let user of testUserList) {
        // 登録している各ユーザーがランダムに一つのメイン投稿に返信していく
        const mainPostOfOtherUsers = testPostList.filter(
          (post) => post.userId !== user.id
        );
        const randomPostList = getRandomObject(mainPostOfOtherUsers, 1);

        const replyToPost = randomPostList[0];

        const newRep = await prisma.post.create({
          data: {
            text: generatePostText(200),
            img: generateRandomImageUrl(),
            imgFileType: "image/jpeg", //piscumは通常、jpegファイルを返すため
            userId: user.id,
            replyToId: replyToPost.id,
            scheduledAt: null,
            sentAt: new Date(),
          },
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
    }
  } catch (error) {
    console.error("Likes insert failed:", error);
  }
  console.log("Likes seeded");
}

export default replySeeder;
