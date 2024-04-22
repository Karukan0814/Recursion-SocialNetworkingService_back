import { allCategoryId } from "../../../lib/constant";

export const testArticles = [
  {
    title: "サヨリの皮の串焼き | いきいき七尾魚",
    type: "RECIPE",
    link: "http://www.nanaosakana.jp/?p=333",
    img: "/fishpicture/fish_sayori.png",
    categories: [2],
    userId: 13,
  },
  {
    title: "イサキの炙り刺身 | FUCHI BITE",
    type: "RECIPE",
    link: "https://fuchibite.com/fishinglife/eat/562/",
    img: "/fishpicture/fish_isaki.png",
    categories: [7],

    userId: 13,
  },
  {
    title: "簡単、美味しい！　月日貝のバター焼き by 卯月子",
    type: "RECIPE",
    link: "https://cookpad.com/recipe/6049824",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FMKhyRZLifH_%E7%B0%A1%E5%8D%98%E3%80%81%E7%BE%8E%E5%91%B3%E3%81%97%E3%81%84%EF%BC%81%E3%80%80%E6%9C%88%E6%97%A5%E8%B2%9D%E3%81%AE%E3%83%90%E3%82%BF%E3%83%BC%E7%84%BC%E3%81%8D%20by%20%E5%8D%AF%E6%9C%88%E5%AD%90?alt=media&token=63394024-bd53-4b36-a100-d97110e03488",
    categories: [17],

    userId: 13,
  },
  {
    title:
      "【魚のプロ直伝】旨みと香りがすごい！ 切り身で作る鯛めしレシピ。 鯛のさばき方解説も | 三越伊勢丹の食メディア | FOODIE（フーディー）",
    type: "RECIPE",
    link: "https://mi-journey.jp/foodie/68614/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2Fy3BccSnrpm_%E3%80%90%E9%AD%9A%E3%81%AE%E3%83%97%E3%83%AD%E7%9B%B4%E4%BC%9D%E3%80%91%E6%97%A8%E3%81%BF%E3%81%A8%E9%A6%99%E3%82%8A%E3%81%8C%E3%81%99%E3%81%94%E3%81%84%EF%BC%81%20%E5%88%87%E3%82%8A%E8%BA%AB%E3%81%A7%E4%BD%9C%E3%82%8B%E9%AF%9B%E3%82%81%E3%81%97%E3%83%AC%E3%82%B7%E3%83%94%E3%80%82%20%E9%AF%9B%E3%81%AE%E3%81%95%E3%81%B0%E3%81%8D%E6%96%B9%E8%A7%A3%E8%AA%AC%E3%82%82%20%7C%20%E4%B8%89%E8%B6%8A%E4%BC%8A%E5%8B%A2%E4%B8%B9%E3%81%AE%E9%A3%9F%E3%83%A1%E3%83%87%E3%82%A3%E3%82%A2%20%7C%20FOODIE%EF%BC%88%E3%83%95%E3%83%BC%E3%83%87%E3%82%A3%E3%83%BC%EF%BC%89?alt=media&token=758821ce-f389-4cf3-ba57-dc94b2dcb92d",
    categories: [1],

    userId: 13,
  },
  {
    title: "鱧の湯引き 作り方・レシピ | クラシル",
    type: "RECIPE",
    link: "https://www.kurashiru.com/recipes/8c0b9ab6-1530-447a-9d6a-6e52999ecaee",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2Fa5PUV7E1l7_%E9%B1%A7%E3%81%AE%E6%B9%AF%E5%BC%95%E3%81%8D%20%E4%BD%9C%E3%82%8A%E6%96%B9%E3%83%BB%E3%83%AC%E3%82%B7%E3%83%94%20%7C%20%E3%82%AF%E3%83%A9%E3%82%B7%E3%83%AB?alt=media&token=751eed12-ee60-4326-8565-b2238e72b4ac",
    categories: [12],

    userId: 13,
  },
  {
    title:
      "超簡単「ホタルイカのアヒージョ」レシピ。加熱はたったの30秒！ | 三越伊勢丹の食メディア | FOODIE（フーディー）",
    type: "RECIPE",
    link: "https://mi-journey.jp/foodie/20708/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FDzXHRl3r7J_%E8%B6%85%E7%B0%A1%E5%8D%98%E3%80%8C%E3%83%9B%E3%82%BF%E3%83%AB%E3%82%A4%E3%82%AB%E3%81%AE%E3%82%A2%E3%83%92%E3%83%BC%E3%82%B8%E3%83%A7%E3%80%8D%E3%83%AC%E3%82%B7%E3%83%94%E3%80%82%E5%8A%A0%E7%86%B1%E3%81%AF%E3%81%9F%E3%81%A3%E3%81%9F%E3%81%AE30%E7%A7%92%EF%BC%81%20%7C%20%E4%B8%89%E8%B6%8A%E4%BC%8A%E5%8B%A2%E4%B8%B9%E3%81%AE%E9%A3%9F%E3%83%A1%E3%83%87%E3%82%A3%E3%82%A2%20%7C%20FOODIE%EF%BC%88%E3%83%95%E3%83%BC%E3%83%87%E3%82%A3%E3%83%BC%EF%BC%89?alt=media&token=d501a04c-b9d2-44a7-a17b-7300ae24015c",
    categories: [3],

    userId: 13,
  },
  {
    title:
      "いわしの梅煮【しょうゆとみりん１：１の定番和食】のレシピ・つくり方 | キッコーマン | ホームクッキング",
    type: "RECIPE",
    link: "https://www.kikkoman.co.jp/homecook/search/recipe/00003036/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FoyYLJwQUeD_%E3%81%84%E3%82%8F%E3%81%97%E3%81%AE%E6%A2%85%E7%85%AE%E3%80%90%E3%81%97%E3%82%87%E3%81%86%E3%82%86%E3%81%A8%E3%81%BF%E3%82%8A%E3%82%93%EF%BC%91%EF%BC%9A%EF%BC%91%E3%81%AE%E5%AE%9A%E7%95%AA%E5%92%8C%E9%A3%9F%E3%80%91%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%E3%83%BB%E3%81%A4%E3%81%8F%E3%82%8A%E6%96%B9%20%7C%20%E3%82%AD%E3%83%83%E3%82%B3%E3%83%BC%E3%83%9E%E3%83%B3%20%7C%20%E3%83%9B%E3%83%BC%E3%83%A0%E3%82%AF%E3%83%83%E3%82%AD%E3%83%B3%E3%82%B0?alt=media&token=bc3ec57b-68e2-4d5c-a657-10c1ca6f6702",
    categories: [11],

    userId: 13,
  },
  {
    title: "サワラの西京焼きと味噌床の作り方/レシピ：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/recipe/sawara/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FzBM7ZYXbfy_%E3%82%B5%E3%83%AF%E3%83%A9%E3%81%AE%E8%A5%BF%E4%BA%AC%E7%84%BC%E3%81%8D%E3%81%A8%E5%91%B3%E5%99%8C%E5%BA%8A%E3%81%AE%E4%BD%9C%E3%82%8A%E6%96%B9%2F%E3%83%AC%E3%82%B7%E3%83%94%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=b76a4dc2-63ae-49dc-9fa7-028056653d8d",
    categories: [14],

    userId: 13,
  },
  {
    title:
      "たらと野菜の寄せ鍋のレシピ・作り方｜レシピ大百科（レシピ・料理）｜【味の素パーク】 : 木綿豆腐や大根を使った料理",
    type: "RECIPE",
    link: "https://park.ajinomoto.co.jp/recipe/card/703471/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FwYYrzduE6Z_%E3%81%9F%E3%82%89%E3%81%A8%E9%87%8E%E8%8F%9C%E3%81%AE%E5%AF%84%E3%81%9B%E9%8D%8B%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%E3%83%BB%E4%BD%9C%E3%82%8A%E6%96%B9%EF%BD%9C%E3%83%AC%E3%82%B7%E3%83%94%E5%A4%A7%E7%99%BE%E7%A7%91%EF%BC%88%E3%83%AC%E3%82%B7%E3%83%94%E3%83%BB%E6%96%99%E7%90%86%EF%BC%89%EF%BD%9C%E3%80%90%E5%91%B3%E3%81%AE%E7%B4%A0%E3%83%91%E3%83%BC%E3%82%AF%E3%80%91%20%3A%20%E6%9C%A8%E7%B6%BF%E8%B1%86%E8%85%90%E3%82%84%E5%A4%A7%E6%A0%B9%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%9F%E6%96%99%E7%90%86?alt=media&token=acc19ab6-7804-4191-8127-78e2a7d28da2",
    categories: [21],

    userId: 13,
  },
  {
    title: "あんこうのどぶ汁",
    type: "RECIPE",
    link: "https://www.nissui.co.jp/recipe/00802.html",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FeVpRC7PdPD_%E3%81%82%E3%82%93%E3%81%93%E3%81%86%E3%81%AE%E3%81%A9%E3%81%B6%E6%B1%81?alt=media&token=3f426fa4-4d43-42b0-acfe-4f277dae9b91",
    categories: [23],

    userId: 13,
  },
  {
    title: "わかさぎの南蛮漬け",
    type: "RECIPE",
    link: "https://www.nissui.co.jp/recipe/00870.html",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FkO8fgCbrR2_%E3%82%8F%E3%81%8B%E3%81%95%E3%81%8E%E3%81%AE%E5%8D%97%E8%9B%AE%E6%BC%AC%E3%81%91?alt=media&token=b17976d5-786b-475a-8b75-5da0363dbfff",
    categories: [24],

    userId: 13,
  },
  {
    title: "＊基本の＊かますの塩焼き＊ by ゆうゆう0310",
    type: "RECIPE",
    link: "https://cookpad.com/recipe/2317078",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FGLwCf9FH7p_%EF%BC%8A%E5%9F%BA%E6%9C%AC%E3%81%AE%EF%BC%8A%E3%81%8B%E3%81%BE%E3%81%99%E3%81%AE%E5%A1%A9%E7%84%BC%E3%81%8D%EF%BC%8A%20by%20%E3%82%86%E3%81%86%E3%82%86%E3%81%860310?alt=media&token=d7774488-6c28-41b5-97ab-e68a6ea8218b",
    categories: [13],

    userId: 13,
  },
  {
    title: "鮎ごはん（鮎めし・鮎飯）のレシピ/作り方：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/recipe/ayugohan/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FJgXLX87Dt3_%E9%AE%8E%E3%81%94%E3%81%AF%E3%82%93%EF%BC%88%E9%AE%8E%E3%82%81%E3%81%97%E3%83%BB%E9%AE%8E%E9%A3%AF%EF%BC%89%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%2F%E4%BD%9C%E3%82%8A%E6%96%B9%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=b80aa9ce-e57b-49b0-9fc4-7d2c9136eeb9",
    categories: [8],

    userId: 13,
  },
  {
    title: "カンパチの漬け丼 | 霧島食育研究会",
    type: "RECIPE",
    link: "https://kirisyoku.com/recipe/4106.html",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2F1FCFNTR0bK_%E3%82%AB%E3%83%B3%E3%83%91%E3%83%81%E3%81%AE%E6%BC%AC%E3%81%91%E4%B8%BC%20%7C%20%E9%9C%A7%E5%B3%B6%E9%A3%9F%E8%82%B2%E7%A0%94%E7%A9%B6%E4%BC%9A?alt=media&token=b2ebb8ec-b010-4b92-a51c-fe3ff9df8033",
    categories: [10],

    userId: 13,
  },
  {
    title: "シラウオのレシピ｜水産業｜網走市",
    type: "RECIPE",
    link: "https://www.city.abashiri.hokkaido.jp/380suisangyo/030ikiiki7/060shirauo/020recipe.html",
    img: "/fishpicture/fish_shirauo.png",
    categories: [4],

    userId: 13,
  },
  {
    title:
      "わふわ！スズキの中華蒸し レシピ・作り方 by ぴーちゃん3279｜楽天レシピ",
    type: "RECIPE",
    link: "https://recipe.rakuten.co.jp/recipe/1840022415/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FcqHQWXJ4zC_%E3%81%B5%E3%82%8F%E3%81%B5%E3%82%8F%EF%BC%81%E3%82%B9%E3%82%BA%E3%82%AD%E3%81%AE%E4%B8%AD%E8%8F%AF%E8%92%B8%E3%81%97%20%E3%83%AC%E3%82%B7%E3%83%94%E3%83%BB%E4%BD%9C%E3%82%8A%E6%96%B9%20by%20%E3%81%B4%E3%83%BC%E3%81%A1%E3%82%83%E3%82%933279%EF%BD%9C%E6%A5%BD%E5%A4%A9%E3%83%AC%E3%82%B7%E3%83%94?alt=media&token=35d21525-0b27-4cf8-802f-48de2520f1c6",
    categories: [9],

    userId: 13,
  },
  {
    title: "ニギスの天ぷら by だるま丸",
    type: "RECIPE",
    link: "https://cookpad.com/recipe/7041703",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FwjaHP0t4Th_%E3%83%8B%E3%82%AE%E3%82%B9%E3%81%AE%E5%A4%A9%E3%81%B7%E3%82%89%20by%20%E3%81%A0%E3%82%8B%E3%81%BE%E4%B8%B8?alt=media&token=3a74ffb8-c3c0-4730-b40f-d700be4ee925",
    categories: [18],

    userId: 13,
  },
  {
    title: "サクラマスのムニエル by あおもりの肴",
    type: "RECIPE",
    link: "https://cookpad.com/recipe/5691754",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FOkAxsG2Vbn_%E3%82%B5%E3%82%AF%E3%83%A9%E3%83%9E%E3%82%B9%E3%81%AE%E3%83%A0%E3%83%8B%E3%82%A8%E3%83%AB%20by%20%E3%81%82%E3%81%8A%E3%82%82%E3%82%8A%E3%81%AE%E8%82%B4?alt=media&token=1e63c20d-5f1b-4e65-a21f-b20b5bb7a6db",
    categories: [5],

    userId: 13,
  },
  {
    title: "さばの味噌煮のレシピ/作り方：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/recipe/sabamisoni/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2F0OcWNhCnUS_%E3%81%95%E3%81%B0%E3%81%AE%E5%91%B3%E5%99%8C%E7%85%AE%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%2F%E4%BD%9C%E3%82%8A%E6%96%B9%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=ea143202-cfc4-4681-ac5c-67f3c3cd411c",
    categories: [19],

    userId: 13,
  },
  {
    title: "かつおのたたき（薬味やたれ）のレシピ/作り方：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/recipe/tataki/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FBgiE3PBRHb_%E3%81%8B%E3%81%A4%E3%81%8A%E3%81%AE%E3%81%9F%E3%81%9F%E3%81%8D%EF%BC%88%E8%96%AC%E5%91%B3%E3%82%84%E3%81%9F%E3%82%8C%EF%BC%89%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%2F%E4%BD%9C%E3%82%8A%E6%96%B9%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=d4a33497-06fe-4f09-a9ea-1015a41af5a1",
    categories: [6],

    userId: 13,
  },
  {
    title: "美味しいさんま塩焼きの塩のタイミングについて：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/recipe/sanmasio/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FTiwOhnxFTd_%E7%BE%8E%E5%91%B3%E3%81%97%E3%81%84%E3%81%95%E3%82%93%E3%81%BE%E5%A1%A9%E7%84%BC%E3%81%8D%E3%81%AE%E5%A1%A9%E3%81%AE%E3%82%BF%E3%82%A4%E3%83%9F%E3%83%B3%E3%82%B0%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=739a3a89-f1da-4d4b-9aea-f4e1f620d47a",
    categories: [16],

    userId: 13,
  },
  {
    title: "根津松本 　|　 食卓を彩る極上の旨い魚をお届けします",
    type: "SHOP",
    link: "https://nezu-matsumoto.jp/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FvVhHPVANFo_%E6%A0%B9%E6%B4%A5%E6%9D%BE%E6%9C%AC%20%E3%80%80%7C%E3%80%80%20%E9%A3%9F%E5%8D%93%E3%82%92%E5%BD%A9%E3%82%8B%E6%A5%B5%E4%B8%8A%E3%81%AE%E6%97%A8%E3%81%84%E9%AD%9A%E3%82%92%E3%81%8A%E5%B1%8A%E3%81%91%E3%81%97%E3%81%BE%E3%81%99?alt=media&token=d8626c41-57a7-4f43-aea0-a9634bddf314",
    categories: [allCategoryId],

    userId: 13,
  },
  {
    title: "角上魚類ホールディングス株式会社",
    type: "SHOP",
    link: "https://www.kakujoe.co.jp/index.php",
    img: "/fishpicture/fish_all.png",
    categories: [allCategoryId],

    userId: 13,
  },
  {
    title:
      "式会社北辰 | 鮮魚の事なら日本一の魚屋 北辰水産に何でもお任せ！水産エンターテインメント",
    type: "SHOP",
    link: "https://www.hokushin-suisan.co.jp/",
    img: "/fishpicture/fish_all.png",
    categories: [allCategoryId],

    userId: 13,
  },
  {
    title: "吉池（よしいけ） | プロも通う御徒町駅前の魚介専門店",
    type: "SHOP",
    link: "https://www.yoshiike-group.co.jp/",
    img: "/fishpicture/fish_all.png",
    categories: [allCategoryId],

    userId: 13,
  },
  {
    title:
      "青森県西津軽郡深浦町｜株式会社　あおもり海山｜野呂英樹さんの生産者プロフィール｜ポケットマルシェ｜産直(産地直送)通販 - 旬の果物・野菜・魚介をお取り寄せ",
    type: "ONLINE",
    link: "https://poke-m.com/producers/146",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FxFPCEafTJy_%E9%9D%92%E6%A3%AE%E7%9C%8C%E8%A5%BF%E6%B4%A5%E8%BB%BD%E9%83%A1%E6%B7%B1%E6%B5%A6%E7%94%BA%EF%BD%9C%E6%A0%AA%E5%BC%8F%E4%BC%9A%E7%A4%BE%E3%80%80%E3%81%82%E3%81%8A%E3%82%82%E3%82%8A%E6%B5%B7%E5%B1%B1%EF%BD%9C%E9%87%8E%E5%91%82%E8%8B%B1%E6%A8%B9%E3%81%95%E3%82%93%E3%81%AE%E7%94%9F%E7%94%A3%E8%80%85%E3%83%97%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%EF%BD%9C%E3%83%9D%E3%82%B1%E3%83%83%E3%83%88%E3%83%9E%E3%83%AB%E3%82%B7%E3%82%A7%EF%BD%9C%E7%94%A3%E7%9B%B4(%E7%94%A3%E5%9C%B0%E7%9B%B4%E9%80%81)%E9%80%9A%E8%B2%A9%20-%20%E6%97%AC%E3%81%AE%E6%9E%9C%E7%89%A9%E3%83%BB%E9%87%8E%E8%8F%9C%E3%83%BB%E9%AD%9A%E4%BB%8B%E3%82%92%E3%81%8A%E5%8F%96%E3%82%8A%E5%AF%84%E3%81%9B?alt=media&token=e09fe390-3abe-4f0b-8cf9-e543599e2660",
    categories: [15],

    userId: 13,
  },
  {
    title:
      "鹿児島のカンパチ・ブリなら【丸庄水産】 公式通販サイト | 朝獲れブリ・カンパチを産地直送",
    type: "ONLINE",
    link: "https://www.shihomaru.co.jp/",
    img: "/fishpicture/buri.png",
    categories: [20, 10, 1],

    userId: 13,
  },
  {
    title: "長島大陸市場",
    type: "ONLINE",
    link: "https://nagashimatairiku.com/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2F5mq5sPwL6F_%E9%95%B7%E5%B3%B6%E5%A4%A7%E9%99%B8%E5%B8%82%E5%A0%B4?alt=media&token=f66fd6a6-9073-4cd9-94a1-1f29c61d6848",
    categories: [20, 10, 1],

    userId: 13,
  },
  {
    title: "福島鮮魚便について - 福島県ホームページ",
    type: "SHOP",
    link: "https://www.pref.fukushima.lg.jp/sec/36035e/suisan-event-aeon.html",
    img: "/fishpicture/fish_all.png",
    categories: [allCategoryId],

    userId: 13,
  },
  {
    title: "江口蓬莱館 | 鹿児島日置のうまかもんをお届けします",
    type: "SHOP",
    link: "https://eguchihouraikan.jp/",
    img: "/fishpicture/fish_tai.png",
    categories: [allCategoryId],

    userId: 13,
  },
  {
    title:
      "手作りが美味しい！鮭フレーク（ふりかけ）のレシピ/作り方：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/sp/recipe/sakehure-ku/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FetfM8t3pp2_%E6%89%8B%E4%BD%9C%E3%82%8A%E3%81%8C%E7%BE%8E%E5%91%B3%E3%81%97%E3%81%84%EF%BC%81%E9%AE%AD%E3%83%95%E3%83%AC%E3%83%BC%E3%82%AF%EF%BC%88%E3%81%B5%E3%82%8A%E3%81%8B%E3%81%91%EF%BC%89%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%2F%E4%BD%9C%E3%82%8A%E6%96%B9%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=28a51a3c-5327-4cab-a46d-f0ec43093ae8",
    categories: [15],

    userId: 14,
  },
  {
    title: "ぶりしゃぶ鍋のレシピ／野菜＆薬味たっぷりが美味しい！：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/sp/recipe/burishabu/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2FBPSkWb2PTH_%E3%81%B6%E3%82%8A%E3%81%97%E3%82%83%E3%81%B6%E9%8D%8B%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%EF%BC%8F%E9%87%8E%E8%8F%9C%EF%BC%86%E8%96%AC%E5%91%B3%E3%81%9F%E3%81%A3%E3%81%B7%E3%82%8A%E3%81%8C%E7%BE%8E%E5%91%B3%E3%81%97%E3%81%84%EF%BC%81%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=14508378-2d4e-4036-918e-b414e211bb2e",
    categories: [20],

    userId: 14,
  },
  {
    title: "ぶりアラで作る『ぶり大根』のレシピ：白ごはん.com",
    type: "RECIPE",
    link: "https://www.sirogohan.com/sp/recipe/buridaikon/",
    img: "https://firebasestorage.googleapis.com/v0/b/eatfish-e09aa.appspot.com/o/articleImg%2F9Pn3VgJfTE_%E3%81%B6%E3%82%8A%E3%82%A2%E3%83%A9%E3%81%A7%E4%BD%9C%E3%82%8B%E3%80%8E%E3%81%B6%E3%82%8A%E5%A4%A7%E6%A0%B9%E3%80%8F%E3%81%AE%E3%83%AC%E3%82%B7%E3%83%94%EF%BC%9A%E7%99%BD%E3%81%94%E3%81%AF%E3%82%93.com?alt=media&token=a5bce82d-ac55-43f8-9911-98acbf162eaa",
    categories: [20],

    userId: 15,
  },
];
