// 一日に定期的に5回回るバッチ
// 5 つの他のランダムな投稿に「いいね」し、=各偽ユーザーは、毎日他のユーザーから 5 つのランダムな投稿に「いいね」する
// さらに、特定の 50 人の「インフルエンサー」アカウントがある場合、
// これらの架空のユーザーはその中から20の投稿に「いいね」をします。=各偽ユーザーは、毎日 50 人の「インフルエンサー」アカウントの中から 20 の投稿に「いいね」をします

import { NotificationType } from "@prisma/client";
import prisma from "../lib/db";
import { getRandomObject, registerNotification } from "../lib/util";
import {
  LIKES_PER_INFLUENCER,
  LIKES_PER_USER,
  NUMBER_OF_INFLUENCERS_FOLLOWERS,
} from "../seeders/seederConatants";

async function likeInfluencerPosts(likeCount = LIKES_PER_USER) {
  try {
    // フェイクユーザーのユーザーリストを取得
    const testUserList = await prisma.user.findMany({
      where: {
        fakeFlag: true,
      },
      include: {
        followings: true,
      },
    });
    console.log("testUserList", testUserList.length);

    const specificUser = testUserList.find((user) => user.id === 1798);
    console.log("specificUser", specificUser?.followings.length);

    const influencerList = testUserList.filter((user) => {
      return user.followings.length >= NUMBER_OF_INFLUENCERS_FOLLOWERS;
    });
    console.log("influencerList", influencerList.length);

    const influencerIds = influencerList.map((influencer) => influencer.id);
    // インフルエンサーになっているユーザーの２４時間以内のポストリストを取得

    // 24時間以内のポストを取得
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const postsWithin24hours = await prisma.post.findMany({
      where: {
        id: {
          in: influencerIds,
        },
        sentAt: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24時間以内のポスト
        },
      },
    });
    console.log("postsWithin24hours.length", postsWithin24hours.length);

    // const influencerPosts = postsWithin24hours.filter((post) => {
    //   console.log(post.user.followers);
    //   return post >= NUMBER_OF_INFLUENCERS_FOLLOWERS;
    // });

    // console.log("influencerPosts.length", influencerPosts.length);

    // 各ユーザーがランダムにインフルエンサーのポストから４件選択して「いいね」する

    for (let user of testUserList) {
      const randomInfluencerPosts = getRandomObject(
        postsWithin24hours,
        Math.ceil(LIKES_PER_INFLUENCER / 5)
      );
      // console.log(
      //   "randomInfluencerPosts",
      //   Math.ceil(LIKES_PER_INFLUENCER / 5),
      //   randomInfluencerPosts
      // );
      const data: Array<any> = [];
      for (let likePost of randomInfluencerPosts) {
        data.push({
          postId: likePost.id,
          userId: user.id,
        });
      }
      // console.log("likes", data.length);
      const newLike = await prisma.postLike.createMany({
        data,
        skipDuplicates: true,
      });
      for (let post of randomInfluencerPosts) {
        await registerNotification(
          NotificationType.Like,
          user.id,
          post.userId,
          post.id
        );
      }
    }
  } catch (error) {
    console.error("Error in likeInfluencerPosts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 一日に5回回すべきバッチ
async function fiveTimesADayBatch() {
  // 【要件】このバッチが一回回るごとに各フェイクユーザーはランダムに選択した１つのポストに「いいね」する＝一日に５ポストにいいねする
  // 【要件】インフルエンサーアカウントの投稿２０件にいいねする＝バッチ一回あたり20/5=4件のインフルエンサーのポストにいいねする
  // →ランダムに投稿に遅延時間を設ける＝自然にみえる挙動

  // await likeSeeder(1, true);

  await likeInfluencerPosts();
}

fiveTimesADayBatch()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
