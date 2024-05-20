import prisma from "../lib/db";
import { Post } from "@prisma/client";
import {
  getRandomDelay,
  getRandomObject,
  registerNotification,
} from "../lib/util";
import { LIKES_PER_USER } from "./seederConatants";
import { NotificationType } from "@prisma/client";

// 【要件】5 つの他のランダムな投稿に「いいね」し、=各偽ユーザーは、毎日他のユーザーから 5 つのランダムな投稿に「いいね」する
type Props = {
  likeCount?: number;
  setRandamDelay?: boolean;
};

// 登録されているユーザーごとに指定の回数ランダムなポストにいいねする。いいねのタイミングにランダムな遅延をつけることができる
async function likeSeeder(likeCount = LIKES_PER_USER, setRandamDelay = false) {
  try {
    console.log("likeSeeder_start", likeCount);

    const users = await prisma.user.findMany({
      where: {
        fakeFlag: true,
      },
    }); //登録されているフェイクユーザーのリストを取得

    if (users.length === 0) {
      console.log("No users.");
      return;
    }

    // 24時間以内のポストを取得
    const recentPosts: Post[] = await prisma.post.findMany({
      where: {
        sentAt: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24時間以内のポスト
        },
      },
    });

    // 取得したユーザーごとに以下の処理を実行
    let allLikesCount = 0;
    for (let user of users) {
      // 24時間以内のポストから当該ユーザー以外のポストをフィルタ
      const recentPostsByOtherUser = recentPosts.filter((post) => {
        return post.userId !== user.id;
      });

      //いいねしたい数だけランダムにポストを取得
      const likePosts = getRandomObject(recentPostsByOtherUser, likeCount);
      if (setRandamDelay) {
        // いいねするタイミングに遅延を設けたい場合
        for (let likePost of likePosts) {
          const delay = getRandomDelay();
          setTimeout(async () => {
            // いいねを登録
            const newLike = await prisma.postLike.createMany({
              data: {
                postId: likePost.id,
                userId: user.id,
              },
              skipDuplicates: true,
            });
          }, delay);

          // いいねしたことを通知する
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

        // いいねを登録
        const newLike = await prisma.postLike.createMany({
          data,
          skipDuplicates: true,
        });

        // いいねしたことを通知する
        for (let post of likePosts) {
          await registerNotification(
            NotificationType.Like,
            post.userId,
            user.id,
            post.id
          );
        }
      }
      allLikesCount += likePosts.length;
    }
    console.log(`Like seeder success!`, allLikesCount);
  } catch (error) {
    console.error("Failed to seed likes:", error);
  }
}

export default likeSeeder;
