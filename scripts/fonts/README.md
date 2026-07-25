# 霞鹜文楷站点子集

`characters.json` 记录当前 `src` 中正文与代码分别使用的字符。构建会先运行
`pnpm fonts:check`；新增文章包含未收录字符时，构建会提示重新生成字体。

字体源固定为官方 [LXGW WenKai v1.522][release]。新环境可以先下载并校验
所需的四个 TTF，再安装锁定版本的 FontTools 与 Brotli：

```sh
pnpm fonts:download
python3 -m pip install "fonttools==4.60.2" "brotli==1.2.0"
pnpm fonts:subset
```

下载产物保存在忽略提交的 `scripts/fonts/source`。如果没有下载，脚本会从
macOS 的 `~/Library/Fonts` 读取字体；其他位置可用 `LXGW_WENKAI_FONT_DIR`
指定。生成的 WOFF2 位于 `src/assets/fonts`，字体许可位于
`public/fonts/OFL.txt`。源 TTF 的 SHA-256 锁定在 `sources.json`；升级字体
版本时需显式更新下载地址、校验值并检查页面视觉变化。

[release]: https://github.com/lxgw/LxgwWenKai/releases/tag/v1.522
