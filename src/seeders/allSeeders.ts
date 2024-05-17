import followSeeder from "./followSeeder";
import likeSeeder from "./likeSeeder";
import postSeeder from "./postSeeder";
import replySeeder from "./replySeeder";
import userSeeder from "./userSeeder";

async function runAllSeeders() {
  try {
    await userSeeder();
    await postSeeder();
    await replySeeder();
    await likeSeeder();
    await followSeeder();

    // 他のシーダー関数もここで呼び出す
    console.log("All seeders executed successfully.");
  } catch (error) {
    console.error("Failed to execute seeders:", error);
  }
  process.exit();
}

runAllSeeders();
