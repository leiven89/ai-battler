# OC BATTLE LINK Deploy

## いまの構成

- Cohere はサーバー経由で呼びます
- 共有投稿と公開キャラは Firebase Firestore に保存します
- Firebase の設定がないときだけ、ローカルの `community-data.json` にフォールバックします

## ローカル起動

1. `[.env.example](C:\Users\蜂谷一樹\Downloads\aiバトラー\.env.example)` を `.env` にコピー
2. `COHERE_API_KEY` を入れる
3. Firebase を使うなら、`FIREBASE_PROJECT_ID` `FIREBASE_CLIENT_EMAIL` `FIREBASE_PRIVATE_KEY` も入れる
4. `npm start`
5. `http://localhost:3000` を開く

## Firebase 側の準備

1. Firebase プロジェクトを作る
2. Firestore Database を有効化する
3. Firebase プロジェクトに紐づくサービスアカウントを作る
4. サービスアカウントの `client_email` と `private_key` を控える
5. `.env` または Render の環境変数に次を設定する

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

`FIREBASE_PRIVATE_KEY` は改行を `\n` にした 1 行文字列で入れて大丈夫です。

## Render で公開

1. このフォルダを GitHub に push
2. Render で `Web Service` を作成
3. Start Command は `npm start`
4. 次の環境変数を設定

- `COHERE_API_KEY`
- `COHERE_MODEL_DEFAULT=command-r-plus-08-2024`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- 任意: `FIRESTORE_CHARACTERS_COLLECTION=communityCharacters`
- 任意: `FIRESTORE_POSTS_COLLECTION=communityPosts`

5. デプロイ後に `/api/health` を開いて確認

## 確認ポイント

- `communityBackend` が `firebase` なら Firestore 保存が有効
- `firebaseConfigured` が `true` なら資格情報は読めています
- `communityBackend` が `local-file` のままなら Firebase 環境変数が足りません

## 重要

- `.env` はコミットしない
- Cohere のキーも Firebase の秘密鍵もフロントには置かない
- Firestore を本番運用するなら、必要に応じて件数上限や古い投稿の整理を追加すると安定します
