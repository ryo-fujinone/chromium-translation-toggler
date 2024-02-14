# Chromium Translation Toggler

Chromium ベースのブラウザの翻訳の切り替え(トグル)を行う拡張機能とネイティブアプリ (.bat + Python スクリプト) のセットです。拡張機能はネイティブメッセージングでネイティブアプリを実行し、ネイティブアプリはブラウザのコンテキストメニューを表示させて T+Enter を入力し翻訳を切り替えます。この拡張機能を実行するための JavaScript のコードを他の拡張機能から実行するという運用を想定しています。

## 動作環境

-   拡張機能

    -   Chromium ベースのブラウザ

-   ネイティブアプリ
    -   Windows
    -   Python3

## インストール (拡張機能)

1. 拡張機能のページで「デベロッパーモード」を有効にする。
1. 「パッケージ化されていない拡張機能を読み込む」から拡張機能のフォルダを選択してインストールする。

インストールが完了するとオプションページが開きます。  
通常は変更する必要はありません。

## インストール (ネイティブアプリ)

install_host.bat を実行してください。レジストリに translation_toggler.json のパスが登録されます。  
また、pip で以下をインストールしてください。

```
pip install pygetwindow pywinauto
```

## 実行方法

ユーザー独自の JavaScript のコードの実行をサポートした拡張機能等で以下のコードを実行してください。

```
const elem = document.querySelector("#chromium-translation-toggle-trigger");
elem.dataset.trigger = true;
```

トリガー要素の ID を変更する必要がある場合はオプションページから変更が可能です。

右クリックが禁止されているサイトで使用する場合、上記コードに合わせて以下のコードを実行してください。

```
document.addEventListener("contextmenu", (e)=> {e.stopPropagation()}, true);
```

## 動作

デフォルトでは Shift+F10 を入力させてコンテキストメニューを表示させます。フルスクリーン表示かつ DevTools を上下左右で開いている場合に限り、F12 で DevTools を閉じ翻訳をトグルした後で F12 で DevTools を開くという実装にしています。

Shift+F10 がうまく機能しない場合や都合が悪い場合は直近のマウスカーソルの位置で右クリックさせてコンテキストメニューを開くモードに変更可能です。そちらのモードではバー (タブバー、アドレスバー、ブックマークバー) の高さの情報が必要であるため、オプションページで取得/設定出来るようにしています。毎回自動で高さを取得するオプションもありますが、そちらは開いているページによっては翻訳のトグルに時間が掛かる場合があります。バーの高さの情報を使用せず pywinauto でページ部分のコントロール(ウィンドウの構成要素)を取得する実装にすることも可能でしたが、開いているページによっては極端に時間が掛かることがあったため、そちらは採用しませんでした。

何らかの理由で任意の位置を右クリックさせたい場合は以下のように data-x と data-y に座標を設定してください。

```
elem.dataset.x = 300;
elem.dataset.y = 400;
```

Edge の場合に限り、Edge モードを使用してください。Edge は他の Chromium ベースのブラウザとは挙動が異なるため、専用のモードを用意する必要がありました。Edge モードの挙動は 4 通りあり、各ページ上において初回の実行では翻訳は必ず即終了します。各ページ上において 2 回目以降の実行では後述の data-translated に true/false を設定しない場合、翻訳メニュー上のコントロールを取得するという実装にしており、2 ～ 3 秒程度掛かる場合があります。data-translated が true の場合、翻訳メニューを開いて Enter を入力するという実装にしています。false の場合、翻訳メニューを開いて右に移動してから Enter を入力するという実装にしています。data-translated が設定されている場合は即終了します。Edge の場合はなるべく data-translated を設定して実行するようにしてください。Edge モード以外では data-translated の値は使用されないので、Edge 以外のブラウザでは data-translated を設定する必要はありません。

```
elem.dataset.translated = true;
或いは
elem.dataset.translated = false;
```

## Credits

-   [icons8](https://icons8.jp/icon/zVj3Xneh9DvR/%E3%82%B0%E3%83%BC%E3%82%B0%E3%83%AB%E7%BF%BB%E8%A8%B3) - アイコン
