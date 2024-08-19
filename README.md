# Recursion Server with Databases: Social Networking Service / KarukanSNS

これは Recursion の Backend コースの Social Networking Service プロジェクトで作成したバックエンドアプリケーションです。

フロントエンドアプリケーションは[https://github.com/Karukan0814/Recursion-SocialNetworkingService]にあります。


# 主な機能

## Restful API
KarukanSNSのバックエンドAPI。主に以下のAPIを提供しています。

1. **ユーザー情報関連API**
   - ユーザー情報の登録や取得に関するAPI。ログイン機能やユーザー情報の検証機能、フォロー/アンフォロー機能を含む。

2. **ポスト情報関連API**
   - 投稿したポストやリプライ、いいね情報に関するAPI。

3. **通知情報関連API**
   - 各ユーザーに紐づく通知情報（リプライ・いいね・フォローされた、メッセージを受信した等）に関するAPI。

4. **メッセージ情報関連API**
   - 相手ユーザーごとに管理された受信・送信メッセージをエンコードして登録、デコードして取得するAPI。

---

## バッチ処理
`src/cron/fakeUsersBatch.ts` を動かすことで、以下の挙動をスケジューリングしています。

### 主な挙動

1. **ランダム投稿機能**
   - 各フェイクユーザーは、毎日ランダムなテキストジェネレーターを使用した内容の異なる3つの投稿を行います。

2. **ランダムいいね機能**
   - 各フェイクユーザーは、毎日他のユーザーから5つのランダムな投稿に「いいね」します。

3. **ランダムリプライ機能**
   - 各フェイクユーザーは、毎日1つのランダムなメイン投稿に返信します。

4. **自動バズ機能**
   - フェイクユーザーは、毎日50人の「インフルエンサー」アカウントの中から20の投稿に「いいね」をします。※「インフルエンサー」アカウントはフォロワーが100人以上のアカウントです。

5. **予約投稿送信機能**
   - 送信予定時刻を過ぎた投稿を検知して、送信します。

バッチ処理は `node-cron` を用いてスケジューリングしています。

---

## データシーダー
`src/seeders/allSeeders.ts` を動かすことで、フェイクユーザーや投稿、いいね情報などの初期データをDBに挿入することが可能です。※詳細は開発環境の構築を参照してください。

### 初期データ

1. 2000人のフェイクユーザー情報
2. フェイクユーザー1人当たり3件のポスト情報
3. フェイクユーザー1人につき24時間以内のポストに対してリプライ情報1件
4. フェイクユーザー1人につき24時間以内のポストに対していいね情報5件
5. フェイクユーザー1人につきフォロワー3人を登録
6. 50人のインフルエンサーアカウント（フォロワーが100人以上）を作成

---

# 開発環境の構築

開発環境を Docker を使用して立ち上げることが可能。以下、その手順。

1. 当該レポジトリをローカル環境にコピー

2. Email 認証用の SMTP サーバーを設定

   Gmail のアカウントを SMTP サーバーとして使用している。以下等を参考にしてアプリパスワードと使用する Gmail アドレスを取得。
   [https://www.youtube.com/watch?v=p143W7p4n4Y]

3. 画像保存用の S3 バケットを AWS に準備

   添付画像の保存用に AWS に S3 バケットを準備する。そして、アクセスキーとシークレットアクセスキーを取得。
   [https://aws.amazon.com/jp/s3/getting-started/]

4. 環境変数ファイルの準備
   　.env ファイルをルートフォルダ直下に用意し、以下を記述して保存する。

```

DATABASE_URL="mysql://${任意のユーザー}:${任意ユーザーのパスワード}@localhost:3306/${任意のデータベース名}"
SHADOW_DATABASE_URL="mysql://${任意のユーザー}:${任意のユーザーのパスワード}@localhost:3306/shadow_db"
DATABASE_NAME="任意のデータベース名"
DATABASE_USER="任意のユーザー"
DATABASE_USER_PASSWORD="任意のパスワード"
DATABASE_HOST="db"

JWT_SECRET="任意のJWT用パスワード"

SMTP_MAIL="SMTPサーバとして使用するメールアドレス"
SMTP_APP_PASS="SMTPサーバーとして使うGmailアカウントのアプリパスワード"
VERIFICATION_LINK="${フロントエンドのURL}/verify?id="


[https://www.geeksforgeeks.org/node-js-crypto-createcipheriv-method/]を参考に設定
ENCRYPT_KEY="cryptoの暗号化用の任意のキーワード"
IV_KEY="cryptoの初期化ベクトルキー"


AWS_ACCESS_KEY_ID="S3バケットのアクセスキー"
AWS_SECRET_ACCESS_KEY="S3バケットのシークレットアクセスキー"
AWS_REGION="S3バケットのリージョン"
AWS_S3_BUCKET_NAME="S3バケットのバケット名"

```

5. Docker ビルド
   　以下を実行してビルド。なお、以下は Docker がインストール済みであることを前提とする。

```
docker compose build
```

6. Docker 立ち上げ
   　以下を実行してコンテナを立ち上げ。

```
docker compose up -d
```

7. MySQL にアクセスして DATABASE_USER に権限を与える

```
docker-compose exec db mysql -u root -p

```

その後、DATABASE_USER に必要な権限を与える

```
GRANT ALL PRIVILEGES ON {DATABASE_NAME}.* TO '{DATABASE_USER}'@'%';
FLUSH PRIVILEGES;


```

その後、prisma の初期化に必要なシャドーデータベースを作成

```
CREATE DATABASE shadow_db;


```

8. DB Migration 実行
   　以下を実行して初期テーブルの構築。

```
docker-compose exec web npx prisma migrate dev --name init

```

9. Seeder 実行
   　以下を実行して初期データの挿入

```
docker-compose exec web npm run seed

```

10. 動作確認
    　[http://localhost:8000/](http://localhost:8000/)にアクセスして動作確認
