# ベースイメージとしてNode.js 20.9.0のAlpineイメージを使用
FROM node:20.9.0-alpine

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# Prismaクライアントを生成
RUN npx prisma generate


# ffmpegをインストール
RUN apk update && apk add ffmpeg

# ソースコードをコピー
COPY . .

# TypeScriptをコンパイル
RUN npm run build

# ポートを設定
EXPOSE 8000

# アプリケーションの起動コマンド
CMD ["node", "dist/server.js"]
