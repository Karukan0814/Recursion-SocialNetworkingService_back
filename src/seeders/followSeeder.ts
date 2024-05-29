import prisma from "../lib/db";
import { User } from "@prisma/client";
import { getRandomObject, registerNotification } from "../lib/util";
import { NotificationType } from "@prisma/client";
import {
  FOLLOWS_PER_USER,
  NUMBER_OF_INFLUENCERS,
  NUMBER_OF_INFLUENCERS_FOLLOWERS,
} from "./seederConatants";

// async function createInfluencers() {
//   console.log("followSeeder_start");
//   const testUserList: User[] = await prisma.user.findMany();

//   if (testUserList.length > NUMBER_OF_INFLUENCERS) {
//     //全ユーザーの中から50人をランダムにインフルエンサーアカウントとしてピックアップする
//     const influencers = getRandomObject<User>(
//       testUserList,
//       NUMBER_OF_INFLUENCERS
//     );
//     console.log(
//       "influencers",
//       influencers.map((val) => val.id)
//     );

//     for (let influencer of influencers) {
//       //全ユーザーの中から、当該インフルエンサー以外のユーザーリストを作成
//       const filteredUsers = testUserList.filter(
//         (user) => user.id !== influencer.id
//       );

//       // 各インフルエンサーには最低100人のフォロワーをつける
//       const influencersFollowers = getRandomObject<User>(
//         filteredUsers,
//         NUMBER_OF_INFLUENCERS
//       );
//       const followerIds = influencersFollowers.map((val) => val.id);
//       console.log(
//         `Followers of Influencer:ID ${influencer.id}`,
//         influencersFollowers.map((val) => val.id)
//       );
//       const data = followerIds.map((id) => {
//         return { followerId: id, followingId: influencer.id };
//       });

//       try {
//         const newFollows = await prisma.follows.createMany({
//           data,
//           skipDuplicates: true,
//         });

//         // フォローされたことをインフルエンサーに通知
//         for (let notice of data) {
//           await registerNotification(
//             NotificationType.FOLLOW,
//             notice.followingId,
//             notice.followerId
//           );
//         }
//       } catch (e) {
//         console.error("something wrong with following influencer");
//       }
//     }
//   } else {
//     console.log("Not enough users found in the database.");
//   }
// }

async function followSeeder() {
  console.log("followSeeder_start");

  // 【要件】各ユーザーにつき、3人にフォローされる
  // 【要件】fakeユーザー2000人の中で、特定の 50 人の「インフルエンサー」アカウントがある
  try {
    const testUserList: User[] = await prisma.user.findMany({
      where: {
        fakeFlag: true,
      },
    }); //登録されているフェイクのユーザーのリストを取得

    // 指定の数だけランダムにインフルエンサーになるべきユーザーを取得する
    const influencers = getRandomObject<User>(
      testUserList,
      NUMBER_OF_INFLUENCERS
    );

    // インフルエンサーのユーザーIDリストを作成
    const influencersIds = influencers.map((val) => val.id);

    // ユーザーごとに以下の処理を行う
    for (let user of testUserList) {
      // そのユーザーがインフルエンサーになるべきユーザーか判定
      let influencerFlag = false;
      if (influencersIds.includes(user.id)) {
        influencerFlag = true;
      }

      // 当該ユーザー以外のユーザーリストを作成
      const filteredUsers = testUserList.filter(
        (other) => other.id !== user.id
      );

      // その中から、指定の数（普通ユーザーは３人、インフルエンサーは５０人）だけランダムにユーザーリストを作成
      const randomUserList = getRandomObject(
        filteredUsers,
        influencerFlag ? NUMBER_OF_INFLUENCERS_FOLLOWERS : FOLLOWS_PER_USER
      );

      // フォロワーとなるべきゆーざーIDリストを作成
      const followerIds = randomUserList.map((val) => val.id);

      // フォローするされる関係のデータを作成
      const data = followerIds.map((id) => {
        return { followerId: id, followingId: user.id };
      });

      // データベースに登録
      const newFollows = await prisma.follows.createMany({
        data,
        skipDuplicates: true,
      });

      // 通知を飛ばす
      for (let notice of data) {
        await registerNotification(
          NotificationType.FOLLOW,
          notice.followingId,
          notice.followerId
        );
      }
    }
  } catch (e) {
    console.error("something wrong with following seed");
  }
}

export default followSeeder;
