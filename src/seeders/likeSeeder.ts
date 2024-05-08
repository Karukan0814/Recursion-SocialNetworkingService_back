import prisma from "../lib/db";
import { faker } from "@faker-js/faker";
import { registerNotification } from "../lib/util";
import { NotificationType } from "@prisma/client";

function generatePostText() {
  const text = faker.lorem.paragraphs();
  const trimmedText = text.slice(0, 200);
  return trimmedText;
}

function generateRandomImageUrl() {
  const width = faker.datatype.number({ min: 100, max: 1000 });
  const height = faker.datatype.number({ min: 100, max: 1000 });
  return `https://picsum.photos/${width}/${height}`;
}

async function likeSeeder() {
  console.log("likeSeeder_start");
  const testLikes = [];
  const users = await prisma.user.findMany();
  const recentPosts = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24時間以内のポスト
      },
    },
  });

  if (users.length === 0 || recentPosts.length === 0) {
    console.log("No users or posts found for the like seeding.");
    return;
  }

  for (let i = 0; i < 200; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomPost =
      recentPosts[Math.floor(Math.random() * recentPosts.length)];

    testLikes.push({
      postId: randomPost.id,
      userId: randomUser.id,
    });
  }

  try {
    for (const testLike of testLikes) {
      const newLike = await prisma.postLike.create({
        data: testLike,
        // skipDuplicates: true,
        include: {
          post: {
            select: {
              userId: true,
            },
          },
        },
      });

      await registerNotification(
        NotificationType.Like,
        newLike.userId,
        newLike.post.userId,
        newLike.postId
      );
    }
    console.log(`Successfully seeded ${testLikes.length} likes.`);
  } catch (error) {
    console.error("Failed to seed likes:", error);
  }
}

export default likeSeeder;
