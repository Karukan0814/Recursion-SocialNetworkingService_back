import { Request, Response, NextFunction } from "express";
const jwt = require("jsonwebtoken");

// JWT認証Middleware
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
    const token = authorizationHeader.slice(7); // 'Bearer ' の部分を削除してトークンを取得
    // ここで token を使って処理を続ける
    if (!token) return res.status(401).json({ error: "Authentication failed" });

    try {
      jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      console.log("Invalid token");
      return res.status(403).json({ error: "Invalid token" });
    }
  } else {
    // Authorization ヘッダーが存在しないか、Bearer スキームで始まっていない場合のエラー処理
    return res.status(401).json({ error: "Unauthorized" });
  }
};
