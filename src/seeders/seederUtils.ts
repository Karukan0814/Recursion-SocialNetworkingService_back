import { faker } from "@faker-js/faker";

export function generatePostText(limit: number) {
  const text = faker.lorem.paragraphs(); // ランダムな段落を生成
  const trimmedText = text.slice(0, limit); // limit文字数にトリム
  return trimmedText;
}
export function generateRandomImageUrl() {
  const width = faker.number.int({ min: 100, max: 1000 });
  const height = faker.number.int({ min: 100, max: 1000 });
  return `https://picsum.photos/${width}/${height}`;
}
export function getRandomDateWithin24Hours(): Date {
  const now = new Date();
  const randomOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000); // 24時間以内のミリ秒
  return new Date(now.getTime() + randomOffset);
}

export function getRandomObject<T>(arr: T[], num: number): T[] {
  const shuffled = arr.slice(); // 配列をコピー
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // 要素を入れ替え
  }
  return shuffled.slice(0, num);
}

// ランダムな遅延を生成する関数
export function getRandomDelay() {
  return Math.floor(Math.random() * 30 * 60 * 1000); // 0から1800秒 (0から30分) の間のランダムなミリ秒
}
