# Recursion Server with Databases: Social Networking Service / KarukanSNS

これは Recursion の Backend コースの Social Networking Service プロジェクトで作成したバックエンドアプリケーションです。
フロントエンドアプリケーションは[https://github.com/Karukan0814/Recursion-SocialNetworkingService]にあります。

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
