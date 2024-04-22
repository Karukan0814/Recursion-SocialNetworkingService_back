const router = require("express").Router();
import { Request, Response } from "express";
import { validationResult } from "express-validator";

import axios from "axios";
import * as cheerio from "cheerio";
import * as iconv from "iconv-lite";
import { getEncodingFromContentType, userIsAdmin } from "../lib/util";
import {
  validateArticleType,
  validateQueryArticleCount,
  validateQueryArticlesByCategoryId,
  validateQueryChackURL,
  validateQueryGetMetaData,
} from "../lib/validation";
import { allCategoryId } from "../lib/constant";
import { authenticateToken } from "../lib/authenticateToken";
import prisma from "../lib/db";

//記事情報関連API "/eatfish_back/api/article"

//記事数取得API
router.get(
  "/articleCount",
  validateQueryArticleCount,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const articleType: string | undefined = req.query.type as
        | string
        | undefined;

      const whereClause: any = {};

      if (articleType) {
        whereClause.type = articleType;
      }

      const totalArticlesCount = await prisma.article.count({
        where: whereClause,
      });

      res.status(200).json({ totalArticlesCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error searching articleCounts" });
    }
  }
);

//記事リスト取得API
router.get("/search", async (req: Request, res: Response) => {
  try {
    const count: number = parseInt(req.query.count as string) || 6; // クエリパラメータ "count" を数値に変換し、デフォルトは6
    const articleType: string | undefined = req.query.type as
      | string
      | undefined; // クエリパラメータ "type" を取得
    const page: number = parseInt(req.query.page as string) || 1; // ページ番号
    const orderBy: string = (req.query.orderBy as string) || "createdAt"; // デフォルトはcreatedAt
    const whereClause: any = {};
    console.log({ count, articleType, page, orderBy });

    if (articleType) {
      whereClause.type = articleType;
    }
    const skip = (page - 1) * count; // ページ番号からskip数を計算
    let queryOrder: any = {
      createdAt: "desc", // デフォルトは新着順
    };

    if (orderBy === "likes") {
      queryOrder = [
        {
          likes: {
            _count: "desc", // 「いいね」の数が多い順に並べ替える
          },
        },
        {
          createdAt: "desc", // 新着順に並べ替える
        },
      ];
    }

    const articles = await prisma.article.findMany({
      take: count,
      skip: skip,
      where: whereClause,
      orderBy: queryOrder,
      include: {
        categories: true,
        comments: {
          include: {
            user: true,
          },
        },
        likes: true,
        bookmarks: true,
      },
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching articles");
  }
});

// カテゴリに紐づく記事を新着記事順で取得し、記事タイプごとに分類
router.get(
  "/searchByCategory",
  validateQueryArticlesByCategoryId,
  async (req: Request, res: Response) => {
    const errors = validationResult(req); // バリデーションエラーの取得
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // エラーがある場合は400エラーを返す
    }
    try {
      const categoryId: number = parseInt(req.query.categoryId as string);

      const articlesInSpecialCategory = await prisma.article.findMany({
        where: {
          categories: {
            some: {
              OR: [
                {
                  id: categoryId,
                },
                {
                  id: allCategoryId,
                },
              ],
            },
          },
        },
        orderBy: {
          createdAt: "desc", // デフォルトは新着順
        },
        include: {
          categories: true, // Articleに紐づくCategory情報を取得
          comments: {
            include: {
              user: true, // Articleに紐づくコメントのユーザー情報を取得
            },
          }, // Articleに紐づくコメントを取得
          likes: true, // Articleに紐づくいいねを取得
          bookmarks: true, // Articleに紐づくブックマークを取得
        },
      });

      const categorizedArticles: {
        RECIPE: any[];
        SHOP: any[];
        ONLINE: any[];
      } = {
        RECIPE: [],
        SHOP: [],
        ONLINE: [],
      };
      articlesInSpecialCategory.forEach((article) => {
        if (article.type === "RECIPE") {
          categorizedArticles.RECIPE.push(article);
        } else if (article.type === "SHOP") {
          categorizedArticles.SHOP.push(article);
        } else if (article.type === "ONLINE") {
          categorizedArticles.ONLINE.push(article);
        }
      });

      console.log("categorizedArticles", categorizedArticles.RECIPE);
      res.status(200).json(categorizedArticles);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send(
          "Error fetching articles for the specified and special category by type"
        );
    }
  }
);

//記事検索（ユーザーごと）API
// userがいいね、ブックマーク、コメント、作成した記事を新着記事順で取得し、ユーザーアクションごとに分類
router.post(
  "/searchByUser",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // userIdの存在と型を検証
      const userId: number = parseInt(req.body.userId as string);
      if (isNaN(userId) || userId <= 0) {
        console.log("userId不正", userId);

        return res.status(400).json({ error: "userId is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          comments: { select: { articleId: true } },
          likes: {
            include: {
              article: {
                include: {
                  categories: true,
                  comments: {
                    include: {
                      user: true,
                    },
                  },
                  likes: true,
                  bookmarks: true,
                },
              },
            },
          },
          bookmarks: {
            include: {
              article: {
                include: {
                  categories: true,
                  comments: {
                    include: {
                      user: true,
                    },
                  },
                  likes: true,
                  bookmarks: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ユーザーが作成した記事

      const userArticles = await prisma.article.findMany({
        where: {
          userId: userId,
        },
        include: {
          // ここに必要なリレーションや情報を追加する
          categories: true,
          comments: {
            include: {
              user: true,
            },
          },
          likes: true,
          bookmarks: true,
        },
      });
      console.log("userArticles", userArticles);
      // ユーザーがアクションした記事のIDリスト コメントのみ階層が深すぎて詳細情報が一回で取得できないため、別途リクエストを投げる
      const commentedArticleIds = user.comments.map(
        (comment) => comment.articleId
      );
      //IDリストからユーザーがコメントした記事リストを取得
      const commentedArticlesList = await await prisma.article.findMany({
        where: {
          id: { in: commentedArticleIds },
        },
        include: {
          categories: true,
          comments: {
            include: {
              user: true,
            },
          },
          likes: true,
          bookmarks: true,
        },
      });

      // ユーザーがいいねした記事
      const likeArticles = Array.from(
        new Set(user.likes.map((like) => like.article))
      );

      // ユーザーがブックマークした記事
      const bookmarkArticles = Array.from(
        new Set(user.bookmarks.map((bookmark) => bookmark.article))
      );

      const categorizedArticles: {
        COMMENT: any[];
        LIKE: any[];
        BOOKMARK: any[];
        USER: any[];
      } = {
        COMMENT: commentedArticlesList,
        LIKE: likeArticles,
        BOOKMARK: bookmarkArticles,
        USER: userArticles,
      };

      res.status(200).json(categorizedArticles);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send(
          "Error fetching articles for the specified and special category by type"
        );
    }
  }
);

// URLが既に登録されているか確認する
router.get(
  "/checkURL",
  validateQueryChackURL,
  async (req: Request, res: Response) => {
    const errors = validationResult(req); // バリデーションエラーの取得
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // エラーがある場合は400エラーを返す
    }
    try {
      const url = req.query.url as string;
      let selectedCategories = req.query.selectedCategories as string[];
      const categoryIds = selectedCategories.map((id) => parseInt(id));
      console.log(categoryIds);
      // 同じURLが既に登録されているかチェック
      const articlesSameUrl = await prisma.article.findMany({
        where: {
          link: url,
        },
      });
      console.log("articlesSameUrl", articlesSameUrl);
      if (articlesSameUrl.length > 0) {
        return res
          .status(204)
          .json({ reason: "既に同じURLが登録されています。" });
      }
      // 以下、相手側サーバーにスクレイピングをはじかれて404で落ちてしまう問題を解決できないため、いったんコメントアウト
      //URLの指定したページ内に、カテゴリで指定したお魚のワードが含まれているかどうかを確認

      // //指定したURLの内容を取得
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);
      const pageText = $("html").text();

      // ALLカテゴリを含む場合はALLカテゴリに紐づくワードのどれか一つに該当すればOK
      if (categoryIds.includes(allCategoryId)) {
        const categoryWords = await prisma.categoryWord.findMany({
          where: {
            categoryId: allCategoryId,
          },
        });
        for (const item of categoryWords) {
          if (pageText.includes(item.word)) {
            //一つでも該当するワードがあればOK
            return res.status(200).send("This URL is OK!");
          }
        }
        return res.status(204).json({
          reason:
            "指定したカテゴリに関連する情報がURLに含まれていないようです。",
        });
      }

      // 以下、個別カテゴリ指定の場合
      // 指定したカテゴリのIDリストから関連するワードを取得
      const categoryWords = await prisma.categoryWord.findMany({
        where: {
          categoryId: {
            in: categoryIds,
          },
        },
      });
      // categoryIdごとにwordをグループ化
      const wordsByCategory = categoryIds.reduce(
        (
          acc: {
            [prop: string]: string[];
          },
          categoryId
        ) => {
          // 特定のcategoryIdに関連するwordを取得
          const words = categoryWords
            .filter((wordObj) => wordObj.categoryId === categoryId)
            .map((wordObj) => wordObj.word);

          // categoryIdをキーとして、関連するwordの配列を格納
          acc[categoryId] = words;
          return acc;
        },
        {}
      );

      // カテゴリIDごとに処理
      for (const categoryId of Object.keys(wordsByCategory)) {
        const wordList = wordsByCategory[categoryId];
        let wordCheck = [];
        for (let word of wordList) {
          if (pageText.includes(word)) {
            wordCheck.push(word);
          }
        }
        if (wordCheck.length === 0) {
          return res.status(204).json({
            reason:
              "指定したカテゴリに関連する情報がURLに含まれていないようです。",
          });
        }
      }

      return res.status(200).send("This URL is OK!");
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .send(
          "Error fetching articles for the specified and special category by type"
        );
    }
  }
);

// メタデータ取得API
router.get(
  "/getMetadata",
  validateQueryGetMetaData,
  async (req: Request, res: Response) => {
    const errors = validationResult(req); // バリデーションエラーの取得
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // エラーがある場合は400エラーを返す
    }
    try {
      const url: string = req.query.url as string;

      console.log("articleCard url", url);

      // URLからエンコーディングを取得
      const encodingResponse = await axios.get(url, {
        responseType: "arraybuffer",
      });
      const encoding = getEncodingFromContentType(
        encodingResponse.headers["content-type"]
      );

      // URLからHTMLデータを取得
      const response = await axios.get<Buffer>(url, {
        responseType: "arraybuffer",
      });
      const html = iconv.decode(response.data, encoding);

      const $ = cheerio.load(html);
      const title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        $('meta[name="title"]').attr("content");
      const description =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content");
      // const url = $('meta[property="og:url"]').attr("content");
      const site_name = $('meta[property="og:site_name"]').attr("content");
      let image =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[property="og:image:url"]').attr("content");

      if (image?.startsWith("/")) {
        image = url + image;
      }
      console.log("image", image);
      const icon =
        $('link[rel="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href");
      const keywords =
        $('meta[property="og:keywords"]').attr("content") ||
        $('meta[name="keywords"]').attr("content");
      // 画像のURLが存在した場合に以下を実行
      if (image) {
        try {
          // イメージをダウンロード
          const imageResponse = await axios.get(image, {
            responseType: "arraybuffer",
          });

          const metadata = {
            title: title ? title : "",
            image: {
              data: imageResponse.data.toString("base64"),
              type: imageResponse.headers["content-type"],
            },
            description: description ? description : "",
            url,
            site_name: site_name ? site_name : "",
            icon: icon ? icon : "",
            keywords: keywords ? keywords : "",
          };

          // Send the metadata with image data in the response
          res.status(200).json(metadata);
        } catch {
          console.log("image url取得エラー");
          //imgUrlから画像が取得できなかったとき
          const metadata = {
            title: title ? title : "",
            image: null,
            description: description ? description : "",
            url,
            site_name: site_name ? site_name : "",
            icon: icon ? icon : "",
            keywords: keywords ? keywords : "",
          };

          res.status(200).json(metadata);
        }
      } else {
        // No image URL found, send metadata without image data
        const metadata = {
          title: title ? title : "",
          image: null,
          description: description ? description : "",
          url,
          site_name: site_name ? site_name : "",
          icon: icon ? icon : "",
          keywords: keywords ? keywords : "",
        };

        res.status(200).json(metadata);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching metadata from URL");
    }
  }
);

//記事作成機能
router.post(
  "/register",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { title, type, link, img, categories, userId } = req.body;
    console.log({ title, type, link, categories });
    try {
      //titleが空でないか
      if (!title || typeof title !== "string") {
        res.status(400).json({ error: "title is required" });
        return;
      }
      //typeが空でないかかつ、許容されるタイプか確認
      if (!type || !validateArticleType(type)) {
        res.status(400).json({ error: "type is required" });

        return;
      }
      //linkが空でないか
      if (!link || typeof link !== "string") {
        res.status(400).json({ error: "link is required" });

        return;
      }
      //img
      let articleImg = "";
      img ? (articleImg = img) : (articleImg = "/fishpicture/fish_all.png");

      //categoriesがnumber[]型であるかを確認
      if (!Array.isArray(categories) || categories.some(isNaN)) {
        res
          .status(400)
          .json({ error: "categories should be an array of numbers" });

        return;
      }
      const categoriesArray = categories as number[];
      const categoriesObj = categoriesArray.map((categoryId) => {
        return { id: categoryId };
      });

      ////userIdが空でないか
      if (!userId || typeof userId !== "number") {
        res.status(400).json({ error: "userId is required" });

        return;
      }

      const result = await prisma.article.create({
        data: {
          title,
          type,
          link,
          img: articleImg,
          categories: {
            connect: categoriesObj,
          },
          userId,
        },
      });

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error registering category");
    }
  }
);
//記事削除機能
router.delete(
  "/delete",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.query.articleId as string); // リクエストから記事のIDを取得
      const userId = parseInt(req.query.userId as string); // リクエストからユーザーのIDを取得
      console.log("/delete/article", { articleId, userId });

      if (!articleId || !userId) {
        res.status(400).json({ error: " articleId and userId are required" });
        return;
      }

      // 記事の userId を取得
      const article = await prisma.article.findUnique({
        where: {
          id: articleId,
        },
      });
      console.log("article", article);
      if (!article) {
        res
          .status(404)
          .json({ error: `Article with ID: ${articleId} not found` });
        return;
      }

      if (article.userId !== userId) {
        // userIDが記事作成者ではなかった場合、管理者かどうかを確認
        const isAdmin = await userIsAdmin(userId);
        if (!isAdmin) {
          // 管理者でもなかった場合、エラー
          res.status(403).json({
            error: "Permission denied: You are not the owner of this article",
          });
          return;
        }
      }

      // userId が一致する場合または管理者の場合のみ以下の削除を行う

      // トランザクション開始
      await prisma.$transaction(async (prisma) => {
        await prisma.articleComment.deleteMany({
          where: {
            articleId: articleId,
          },
        });
        console.log("コメント削除");

        await prisma.articleLike.deleteMany({
          where: {
            articleId: articleId,
          },
        });
        console.log("いいね削除");

        await prisma.articleBookmark.deleteMany({
          where: {
            articleId: articleId,
          },
        });
        console.log("ブックマーク削除");

        await prisma.article.delete({
          where: {
            id: articleId,
          },
        });
      });
      res
        .status(200)
        .send(`Article with ID: ${articleId} deleted successfully`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error deleting article" });
    }
  }
);

module.exports = router;
