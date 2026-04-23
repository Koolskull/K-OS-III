import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function RunningKOSLocally() {
  return (
    <>
      <Lead>
        K-OSを自分のマシンで動かすのは、初回は10分ほどかかります — ほぼダウン
        ロードの待ち時間です。それ以降、起動は1コマンド。この記事は「ターミナル
        が開いている」状態から「K-OSがブラウザのlocalhostで動いている」までの
        全ステップを案内します。まだターミナルを開いていなければ、{" "}
        <Crossref to="terminal-basics" /> から始めてください。
      </Lead>

      <H2>最初に必要なもの</H2>
      <UList>
        <Li>
          <Strong>Node.js v20以降。</Strong>{" "}
          <a href="https://nodejs.org" style={{ color: "#ffff00" }}>nodejs.org</a> から
          ダウンロード。デフォルト設定でインストール。
        </Li>
        <Li>
          <Strong>Git。</Strong>MacとLinuxではほぼ確実にすでにインストールされて
          います。Windowsでは{" "}
          <a href="https://git-scm.com" style={{ color: "#ffff00" }}>git-scm.com</a>{" "}
          経由でインストール、またはWSLを使用。
        </Li>
        <Li>
          <Strong>約1 GBのディスク容量。</Strong>K-OS自体は小さいですが、
          依存関係（Next.js、Three.js、Tone.jsなど）が積み重なります。
        </Li>
      </UList>

      <Aside title="インストールを確認" variant="tip">
        ターミナルで <Code>node --version</Code> と <Code>git --version</Code>{" "}
        を実行。両方ともバージョン番号を表示するはず。どちらかが
        "command not found" と言ったら、そのツールを先にインストール。
      </Aside>

      <H2>ステップごとに</H2>

      <H3>1. 作業フォルダを選ぶ</H3>
      <P>
        K-OSは現在の場所のサブフォルダになります。多くの人は{" "}
        <Code>~/Documents</Code> または <Code>~/Projects</Code> 以下に
        プロジェクトを置きます：
      </P>
      <CodeBlock>{`cd ~/Documents`}</CodeBlock>

      <H3>2. リポジトリをクローン</H3>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>
        Gitがプロジェクト全体（〜50 MB）をダウンロード。完了すると新しい
        フォルダが表示されます。<Code>ls</Code> で確認：
      </P>
      <CodeBlock>{`ls
# リストにK-OS-IIIが表示されるはず`}</CodeBlock>

      <H3>3. プロジェクトフォルダに入る</H3>
      <CodeBlock>{`cd K-OS-III`}</CodeBlock>
      <P>
        以下はすべてこのフォルダ内にいることを前提とします。見失ったら{" "}
        <Code>pwd</Code> を実行 — 末尾が <Code>K-OS-III</Code> のはず。
      </P>

      <H3>4. 依存関係をインストール</H3>
      <CodeBlock>{`npm install --legacy-peer-deps`}</CodeBlock>
      <P>
        ここが遅い部分。<Code>npm</Code> が <Code>package.json</Code> を読み、
        K-OSが依存するすべてのライブラリをダウンロードして、{" "}
        <Code>node_modules</Code> というフォルダに置きます。初回実行は
        インターネット速度によって1〜3分かかります。最後に "added 412
        packages" のような出力が流れます。それが成功です。
      </P>
      <P>
        <Code>--legacy-peer-deps</Code> フラグが必要なのは、K-OSの一部の依存
        関係が、npmが通常満たすことを拒否するほど厳格すぎるバージョン要件を
        宣言しているためです。フラグはnpmに「それを無視して、package.json
        にあるものを実際に使え」と伝えます。安全で意図的 — 忘れると赤い
        エラーの壁が表示され、インストールが中断します。
      </P>

      <H3>5. 開発サーバーを起動</H3>
      <CodeBlock>{`npm run dev`}</CodeBlock>
      <P>
        Next.jsがローカルWebサーバーを立ち上げます。数秒以内にこう表示：
      </P>
      <CodeBlock label="このような出力が表示されるはず">
{`▲ Next.js 16.1.6 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.X:3000

✓ Ready in 358ms`}
      </CodeBlock>

      <H3>6. ブラウザで開く</H3>
      <P>
        <Code>http://localhost:3000</Code> にアクセス。K-OSのブートシーケンスが
        スクロールし、デスクトップが読み込まれ、もう中にいます。それだけ。
        K-OSが動いています。
      </P>

      <Aside title="開発サーバーは動き続けます" variant="info">
        <Code>npm run dev</Code> を起動したターミナルは、アプリのサービングで
        忙しい状態です。開いたままに。ソースファイルを編集すると、サーバーが
        変更を検知し、ブラウザが自動でリフレッシュします（Hot Module Reload
        と呼びます）。サーバーを止めるには、そのターミナルで <Code>Ctrl+C</Code>。
      </Aside>

      <H2>必要かもしれない他のコマンド</H2>

      <H3><Code>npm run build</Code></H3>
      <P>
        K-OSのプロダクションビルドを作成。TypeScriptコンパイラを実行し、
        全部をバンドルし、アセットを最適化。GitHub Pagesのデプロイや、本番
        向けにサイトを出荷するものが使います。TypeScriptエラーがあるか、
        <Code>npm run dev</Code> は許容するが本番が許容しない問題があると
        失敗します。
      </P>

      <H3><Code>npm run lint</Code></H3>
      <P>
        型チェッカーを実行。コードに型エラーがないか教えてくれます。プル
        リクエストを送る前に実行。
      </P>

      <H3><Code>npm run preview:export</Code></H3>
      <P>
        静的エクスポート（<Code>koolskull.github.io/k-os</Code> に出荷される
        のと同じ出力）をビルドし、ローカルのポート4044でサービング。dev
        モードだけでなくプロダクションビルドで変更が動くか確認するときに
        使います。URLは <Code>http://localhost:4044/k-os/</Code> — パス
        プレフィックス <Code>/k-os/</Code> に注意。
      </P>

      <H2>うまくいかないとき</H2>

      <H3>"npm: command not found"</H3>
      <P>Node.jsがインストールされていないか、ターミナルセッションが
        検出していません。nodejs.orgからNodeをインストールし、ターミナルを
        閉じて再度開きます。</P>

      <H3>"port 3000 is already in use"</H3>
      <P>
        他の何かがポート3000を使用中（忘れた以前の <Code>npm run dev</Code>{" "}
        かも）。他のプロセスを止めるか、別のポートで実行：
      </P>
      <CodeBlock>{`PORT=3050 npm run dev`}</CodeBlock>

      <H3>"Cannot find module ..."</H3>
      <P>
        依存関係が完全にインストールされませんでした。<Code>node_modules</Code>{" "}
        を削除して再度インストール：
      </P>
      <CodeBlock>{`rm -rf node_modules package-lock.json
npm install --legacy-peer-deps`}</CodeBlock>

      <H3>ブラウザが空白ページや "ECONNREFUSED" を表示</H3>
      <UList>
        <Li>ターミナルを確認 — 開発サーバーはまだ動いてる？エラーでクラッシュした？</Li>
        <Li>ブラウザは正しいポートを向いてる？（通常3000。）</Li>
        <Li>別のブラウザを試す。Audio + WebGL + Web MIDIは最近のChrome/Firefox/Safariで最も良く動きます。</Li>
      </UList>

      <H2>次に読むもの</H2>
      <P>
        K-OSが動いたら、実際のアプリに飛び込みましょう：
      </P>
      <UList>
        <Li><Crossref to="what-is-a-tracker" /> — Datamoshpitを使い始めたいなら。</Li>
        <Li><Crossref to="dmpit-format" /> — 保存されたプロジェクトの保存方法に興味があるなら。</Li>
        <Li><Crossref to="the-rules" /> — コードに貢献したいなら。</Li>
      </UList>
    </>
  );
}
