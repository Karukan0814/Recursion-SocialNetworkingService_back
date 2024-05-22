
# 開発環境の構築

開発環境を Docker を使用して立ち上げることが可能。以下、その手順。

1. 当該レポジトリをローカル環境にコピー

2. 環境変数ファイルの準備
   　.env ファイルをルートフォルダ直下に用意し、以下を記述して保存する。

```
DATABASE_NAME=karukanSNSdb
DATABASE_USER=任意のユーザー名
DATABASE_USER_PASSWORD=任意のパスワード
DATABASE_HOST=db


```

3. Docker ビルド
   　以下を実行してビルド。なお、以下は Docker がインストール済みであることを前提とする。

```
docker compose build
```

4. Docker 立ち上げ
   　以下を実行してコンテナを立ち上げ。

```
docker compose up -d
```

5. MySQLにアクセスしてDATABASE_USERに権限を与える

```
docker-compose exec db mysql -u root -p

```
その後、DATABASE_USERに必要な権限を与える
```
GRANT ALL PRIVILEGES ON {DATABASE_NAME}.* TO '{DATABASE_USER}'@'%';
FLUSH PRIVILEGES;


```


6. DB Migration 実行
   　以下を実行して初期テーブルの構築。

```
docker-compose exec web npx prisma migrate dev --name init

```

7. Seeder 実行
   　以下を実行して初期データの挿入

```
docker-compose exec web npm run seed

```

8. 動作確認
   　[http://localhost:8000/](http://localhost:8000/)にアクセスして動作確認

