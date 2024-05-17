import prisma from "../lib/db";
import {
  getRandomDelay,
  getRandomObject,
  registerNotification,
} from "../lib/util";
import { LIKES_PER_USER } from "./seederConatants";
import { NotificationType } from "../../node_modules/.prisma/client/index";

// 【要件】5 つの他のランダムな投稿に「いいね」し、=各偽ユーザーは、毎日他のユーザーから 5 つのランダムな投稿に「いいね」する
type Props = {
  likeCount?: number;
  setRandamDelay?: boolean;
};
async function likeSeeder(likeCount = LIKES_PER_USER, setRandamDelay = false) {
  console.log("likeSeeder_start", likeCount);
  const testLikes: Array<any> = [];

  const users = await prisma.user.findMany({
    where: {
      fakeFlag: true,
    },
  }); //登録されているユーザーのリスト

  if (users.length === 0) {
    console.log("No users.");
    return;
  }

  for (let user of users) {
    const recentPosts = await prisma.post.findMany({
      where: {
        sentAt: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24時間以内のポスト
        },
        userId: {
          not: user.id,
        }, //そのユーザーidではないポストを取得
      },
    });
    // console.log(recentPosts);
    const likePosts = getRandomObject(recentPosts, likeCount); //いいねしたいポストをランダムで取得
    try {
      console.log(setRandamDelay);

      if (setRandamDelay) {
        // いいねするタイミングに遅延を設けたい場合
        for (let likePost of likePosts) {
          const delay = getRandomDelay();
          console.log(likePost.id, delay);
          setTimeout(async () => {
            const newLike = await prisma.postLike.createMany({
              data: {
                postId: likePost.id,
                userId: user.id,
              },
              skipDuplicates: true,
            });
          }, delay);

          await registerNotification(
            NotificationType.Like,
            user.id,
            likePost.userId,
            likePost.id
          );
        }
      } else {
        const data: Array<any> = [];

        for (let likePost of likePosts) {
          data.push({
            postId: likePost.id,
            userId: user.id,
          });
        }

        const newLike = await prisma.postLike.createMany({
          data,
          skipDuplicates: true,
        });
        for (let post of likePosts) {
          await registerNotification(
            NotificationType.Like,
            post.userId,
            user.id,
            post.id
          );
        }
      }
    } catch (error) {
      console.error("Failed to seed likes:", error);
    }
  }
  console.log(`Like seeder success!`);
}

export default likeSeeder;
