# o2-layer-motion

[![Build Status](https://travis-ci.org/novelsphere/o2-layer-motion.svg?branch=master)](https://travis-ci.org/novelsphere/o2-layer-motion)

Move layers with predefined motions.

- Partial port of KAICHO's `LayerMotionPlugin.ks` from [here](http://www.geocities.jp/keep_creating/krkrplugins/)
- Define complicated motions first, then move layers later
- Can move X / Y separately
  - e.g. One motion for X, one for Y
  - X and Y motions can have different duration and loop count

- Motions can be sync of async
- Used in [The house in fata morgana](http://novect.net/top2.html)

予めモーションを用意してレイヤーを動かす。

- [KAICHO氏の `LayerMotionPlugin.ks`](http://www.geocities.jp/keep_creating/krkrplugins/) の一部を o2engine に移植したものです
- 複雑なモーションを予め定義して、後でそのモーションでレイヤーを動かす
- X と Y 軸を別で動かせる
  - 例えば X のみのモーションと Y のみのモーション
  - X と Y のモーションに違う長さとループ回数を指定できます

- [ファタモルガーナの館](http://novect.net/top2.html) で使われてる

## Usage 使い方

- Download `layer-motion.js`

- Move the file to your project's plugin folder

- Add this to the beginning of your `first.ks`
  ```
  [o2_loadplugin module="layer-motion.js"]
  ```

- Define a motion like this
  ```
  [motion_define name="Walking" locatey="(-20,500,-2),(0,500,2)" loop=0]
  ```
  - You can specific the x motion by the `locatex` attribute


- This motion means:

  1. move Y upward for 20 pixel, with duration of 500 ms, and acceleration of -2
  2. move Y back to the original position, with duration of 500, and acceleration of 2

- Start the motion

  ```
  [motion_start layer=0 page=fore name="Walking"]
  ```

  - This will start the motion and run the next tag without waiting


- Stop the motion

  ```
  [motion_stop layer=0 page=fore name="Walking"]
  ```

------

- `layer-motion.js` をダウンロード

- ファイルをプロジェクトの plugin フォルダーに移動

- `first.ks` の最初にこれを追加

  ```
  [o2_loadplugin module="layer-motion.js"]
  ```

- こういう風にモーションを定義する

  ```
  [motion_define name="てくてく" locatey="(-20,500,-2),(0,500,2)" loop=0]
  ```

  - 横のモーションを `locatex` 属性で指定できる

- これはこういうモーションです

  1. Y を上 20px に移動する、移動にかかる時間は 500ms、加速度は -2
  2. Y を元のところに移動するう、移動にかかる時間は 500ms、加速度は 2

- モーションを開始する

  ```
  [motion_start layer=0 page=fore name="Walking"]
  ```

  - モーションが終わるのを待たないです

- モーションを停止する

  ```
  [motion_stop layer=0 page=fore name="Walking"]
  ```

------

### Tag Reference タグリファレンス

#### [motion_define]

Define a motion, motion along x and y axis can be defined separately.

モーションデータを定義する。モーションデータは、横方向と縦方向で別々に定義する。

- name
  - Motion ID
- locatex
  - Path along x axis
  - Every point is formed by 3 numbers, they are
    - The relative position to the original position
    - Duration
    - Acceleration (see [`[move]`](https://developer.novelsphere.jp/doc/o2doc2/content/ref_tag.html#move))
  - Example: `(-20, 1000, 2)(20, 500, -2)`
- locatey
  - like `locatex`, but for y axis
- loop
  - How many time to loop
  - default is 1, 0 means infinity loop.
- loopx
  - How many time to loop the x motion
  - Overrides `loop`
- loopy
  - How many time to loop the y motion
  - Overrides `loop`

- name
  - モーションIDを指定する。以降、このIDでモーション
    データを参照できるようになる。同じIDで複数
    [motion_define]された場合、最後のもので上書きされる。
- locatex
  - X座標パス
  - X座標のモーションパスを指定する。パスは三つの数値で
    構成され、それぞれ「対象レイヤの元座標から相対座標」、
    「移動にかかる時間(ms)」、「加速度([move](https://developer.novelsphere.jp/doc/o2doc2/content/ref_tag.html#move)タグ参照)」を
    表す。デリミタとして空白があってはならない。
    "(100,1000,2),(-100,500,-2)"は、『X=100に1秒で加速度2で
    移動、そこからX=-100に1秒で加速度-2で移動』を表す。
    指定されていなければ、そのモーションではレイヤは
    その方向に動かないことを表す。
- locatey
  - Y座標パス
  - Y座標のモーションパスを同上。
- loop
  - loop回数|1(def)
  - モーションのループ回数を表す。「おじぎ」なら
    一度しか実行しないが、「てくてく」ならループしたい、
    という場合に指定する。[motion_start]で一時的に上書き
    することも可能。デフォルトは1。0で無限ループする。
- loopx
  - X方向loop回数|1(def)
  - loopを上書き可能なX方向のloop回数。
- loopy
  - Y方向loop回数|1(def)
  - loopを上書き可能なY方向のloop回数。

#### [motion_start]

Start the motion.
モーションを開始する。

- name
  - Motion ID
- layer
  - The layer to move
- page
  - fore(default) / back
- ix
  - The default x position to start, omitting means the current position
- iy
  - The default y position to start, omitting means the current position
- loopx
  - How many time to loop in x direction
  - Default: 1
- loopy
  - How many time to loop in x direction
  - Default: 1
- wait
  - true|false(def)
  - Should the tag wait until the motion ends, infinity loop never ends.
- canskip
  - true|false(def)
  - Can user skip the motion by clicking
  - Only useful when wait = true

- name
  - モーションID
- layer
  - 対象レイヤ番号(0(def)～)
  - モーションを適用するレイヤ番号を指定する。
- page
  - 対象ページ(fore(def)|back)
  - モーションを適用するページを指定する。
- ix
  - 開始時左上X座標(省略=現在の座標から)
  - モーション開始する座標を指定する。指定されていれば、
    まずそこに移動してからモーションを開始する。指定されて
    いなければ、現在のレイヤ表示位置からモーションを開始する。
- iy
  - 開始時左上Y座標(省略=現在の座標から)
- loopx
  - X方向loop回数|1(def)
  - loopを上書き可能なX方向のloop回数。
- loopy
  - Y方向loop回数|1(def)
  - loopを上書き可能なY方向のloop回数。
- wait
  - true|false(def)
  - モーションの終了を待つかどうかを指定する。デフォルト
    では待つ。無限ループするモーションの時は必ずfalseに
    しないと、そこから進まなくなってしまうので注意。
- canskip
  - true|false(def)
  - クリックで skip 可能かどうか

#### [motion_stop]

Stop the motion.
動作中のモーションを止める。

- name
  - Motion ID
- layer
  - The target layer.
  - Default: image layer 0
- page
  - fore(default) | back
- lastpos
  - true(def)|false
  - Should the layer moves to the final position of the motion, or just stop here.

- name
  - モーション名
- layer
  - 対象レイヤ番号(0～)
- page
  - 対象ページ(fore|back)
- lastpos
  - true(def)|false
  - レイヤを最終位置に移動させるかどうか。最終位置とは、
    そのモーションがスキップせず終了した時に到達する位置。
    falseならこのタグが実行された時点での位置で停止する。