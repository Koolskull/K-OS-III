import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function TerminalBasics() {
  return (
    <>
      <Lead>
        <Strong>ターミナル</Strong>（コマンドライン、シェル、コンソールとも
        呼ばれる）は、コンピューターへのテキストのみのインターフェースです。
        コマンドをタイプし、Enterを押すと、コンピューターが応答します。
        古めかしく見えますが、開発者が持つ最も強力なツールのひとつです。
        自分のマシンでK-OSを動かすには、ターミナルを使う必要があります — でも
        短時間で、わずかなコマンドだけです。
      </Lead>

      <H2>なぜわざわざ</H2>
      <P>
        コンピューターでするほぼすべての作業は、ターミナルがすることのラッパー
        です。ソフトウェアをインストールするグラフィカルアプリは、ファイルを
        ダウンロードして展開するターミナルコマンドのラッパーです。Finderの
        ウィンドウは、ファイルを一覧・開くターミナルコマンドのラッパーです。
        ラッパーは見た目が良いですが、ターミナルはより多く、より速く、コマンド
        をつなげることもできます。
      </P>
      <P>
        K-OS固有では、ターミナルが必要なのは：Node.js依存関係のインストール
        （1コマンド）、ローカル開発サーバーの起動（1コマンド）、GitHubから
        プロジェクト更新の取得（1コマンド）。それだけ。常駐する必要はありません。
      </P>

      <H2>開く方法</H2>
      <H3>macOSで</H3>
      <UList>
        <Li><Code>⌘ + Space</Code> でSpotlightを開き、<Strong>terminal</Strong> とタイプ、Enter。</Li>
        <Li>または Finder → アプリケーション → ユーティリティ → ターミナル。</Li>
      </UList>
      <H3>Windowsで</H3>
      <UList>
        <Li>Windowsキーを押し、<Strong>terminal</Strong> とタイプ、Enter。（Windows 11はWindows Terminalを搭載；Windows 10にはPowerShell — どちらも動きます。）</Li>
        <Li>最もLinuxに近い体験には、Microsoft Storeから <Strong>WSL</Strong>（Windows Subsystem for Linux）をインストール。K-OSの説明はUnix系シェルを前提としており、WSLがそれを提供します。</Li>
      </UList>
      <H3>Linuxで</H3>
      <UList>
        <Li>たぶんもう知っているはず。多くのディストロで <Code>Ctrl+Alt+T</Code>、またはデスクトップを右クリック → "Open Terminal"。</Li>
      </UList>

      <H2>見えるもの</H2>
      <P>
        <Code>$</Code> または <Code>%</Code> または <Code>&gt;</Code> で終わる
        プロンプトの隣に点滅するカーソル。それがあなたのタイプを待っている
        シェルです。プロンプトの前にあるものは情報：ユーザー名、現在のフォルダ、
        時には時刻。今のところ気にしなくていいです。
      </P>
      <CodeBlock label="典型的なプロンプトの見た目">
{`koolskull@laptop ~/Documents $ _`}
      </CodeBlock>

      <H2>実際に必要な5つのコマンド</H2>
      <P>
        簡潔なリスト。これらをマスターすれば、K-OSが求めるすべてができます。
      </P>
      <Aside title="コマンドの規約" variant="info">
        このマニュアルが <Code>cd K-OS-III</Code> のようなコマンドを示すとき、
        正確に <Code>cd K-OS-III</Code> とタイプして、Enterを押します。
        ターミナルがアクションを実行し、結果を表示します（または何も表示しない、
        アクションがサイレントに成功した場合）。
      </Aside>

      <H3>1. <Code>pwd</Code> — "print working directory"</H3>
      <P>現在いるフォルダを教えてくれます。迷ったらこれを実行。</P>
      <CodeBlock>{`pwd`}</CodeBlock>

      <H3>2. <Code>ls</Code> — 現在のフォルダ内のファイルを一覧</H3>
      <P>
        いるフォルダの中身を表示。<Code>ls -la</Code> は隠しファイルと詳細
        （サイズ、更新日時）を表示。
      </P>
      <CodeBlock>{`ls
ls -la`}</CodeBlock>

      <H3>3. <Code>cd</Code> — "change directory"（フォルダに移動）</H3>
      <P>
        <Code>cd Documents</Code> でDocumentsというフォルダに移動（現在の
        フォルダにあれば）。<Code>cd ..</Code> で1階層上に。<Code>cd ~</Code>{" "}
        でホームフォルダに戻ります。
      </P>
      <CodeBlock>{`cd Documents
cd ~/Projects/K-OS-III
cd ..`}</CodeBlock>

      <H3>4. <Code>git clone</Code> — GitHubからプロジェクトをダウンロード</H3>
      <P>
        リモートリポジトリを現在のフォルダにコピー。K-OSは{" "}
        <Code>github.com/Koolskull/K-OS-III</Code> にあります：
      </P>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>
        終わったら、<Code>ls</Code> で現在の場所に新しい <Code>K-OS-III</Code>{" "}
        フォルダが表示されます。<Code>cd</Code> で入ります。
      </P>

      <H3>5. <Code>npm</Code> — Node Package Manager</H3>
      <P>
        K-OSはNode.jsプロジェクトです。<Code>npm</Code> は依存ライブラリを
        インストールし、スクリプトを実行するツールです。K-OSが必要とする正確な
        npmコマンドは次のページ（<Crossref to="running-k-os-locally" />）にあります。
        今は <Code>npm</Code> でローカル開発サーバーを起動することだけ知って
        おけばいいです。
      </P>

      <H2>時間を節約するコツ</H2>
      <UList>
        <Li>
          <Strong>Tab補完。</Strong>ファイル名を部分的にタイプしてTab、シェルが
          補完します。2回押すと候補一覧。
        </Li>
        <Li>
          <Strong>上矢印。</Strong>最後に実行したコマンドを呼び出します。上矢印
          2回で2つ前のコマンド、など。指の節約。
        </Li>
        <Li>
          <Strong><Code>Ctrl+C</Code> で実行中のコマンドを停止。</Strong>開発
          サーバーが動いていて停止したいとき、それがキーストローク。Cmd+Wでも、
          ターミナルを閉じるのでもなく — Ctrl+C。
        </Li>
        <Li>
          <Strong><Code>Ctrl+L</Code>（または <Code>clear</Code>）で画面をクリア。</Strong>{" "}
          出力がうるさくなったとき。
        </Li>
        <Li>
          <Strong>フォルダをターミナルウィンドウにドラッグ＆ドロップ</Strong>すると、
          ほとんどのOSでフォルダのフルパスが貼り付けられます。タイプする正確な
          パスを思い出せないときに便利。
        </Li>
      </UList>

      <H2>うまくいかないとき</H2>
      <UList>
        <Li>
          <Code>command not found</Code> — 実行しようとしたプログラムが
          インストールされていない（またはPATHに無い）。npmの場合は
          Node.jsが必要。
        </Li>
        <Li>
          <Code>permission denied</Code> — 通常、所有していないフォルダに
          書き込もうとしている。多くの場合、所有しているフォルダ（ホーム
          ディレクトリ、システムフォルダではない）から実行すれば解決。
        </Li>
        <Li>
          <Code>no such file or directory</Code> — パスのタイプミス、または
          思っている場所にいない。<Code>pwd</Code> と <Code>ls</Code> で位置
          を確認。
        </Li>
        <Li>
          <Strong>ターミナルが固まっている。</Strong><Code>Ctrl+C</Code> を試す。
          助けにならなければ、ターミナルを閉じて新しいのを開く。
        </Li>
      </UList>

      <H2>次に読むもの</H2>
      <P>
        ターミナルを開いて方位を確認したら、<Crossref to="running-k-os-locally" />{" "}
        で実際のK-OSコマンドへ。
      </P>
    </>
  );
}
