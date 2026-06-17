# Idle Clock

一个离线可用的暗色全屏时钟页面，适合在电脑闲置时作为低干扰屏幕显示。

## 直接打开

双击 `index.html` 即可运行。页面不需要安装依赖，不需要网络，也不需要本地服务。

进入浏览器全屏：

- 点击底部的全屏按钮。
- 或按 `F11` 使用浏览器全屏。
- 页面内也支持按 `F` 请求全屏。

退出全屏：

- 按 `Esc`，交给浏览器或系统正常退出。

## 控制

鼠标移动时底部控制栏会显示，静止约 2 秒后隐藏。

- `F`：进入或退出页面全屏
- `T`：切换下一个主题
- `V`：切换显示风格
- `S`：显示或隐藏秒
- `C`：恢复时钟居中
- `H`：隐藏控制栏

底部控制栏还可以切换显示风格、12/24 小时制、调节字号、亮度、时钟左右/上下位置和三档漂移。

漂移档位：

- `关闭`：时钟固定在你设置的位置
- `轻微`：默认档，适合长时间挂屏
- `明显`：移动范围更大，适合想更明显降低固定显示感的场景

位置控制：

- `横`：调整左右位置，默认居中
- `纵`：调整上下位置，默认居中
- `居中`：一键恢复左右和上下位置到中心

内置显示风格：

- `Digital`：极简大数字
- `Flip`：翻页钟风格
- `Nixie`：低亮辉光管风格
- `Dot Matrix`：点阵电子屏风格

## Edge App 模式

可以创建一个 Windows 快捷方式，目标填入类似命令：

```powershell
msedge --app="file:///C:/Users/zyq66/Documents/时钟屏保/index.html"
```

如果复制到别的电脑，只需要把路径替换成那台电脑上的 `index.html` 位置。

## 复制到另一台电脑

复制整个项目目录即可。保持下面三个文件在同一目录：

- `index.html`
- `styles.css`
- `app.js`

## 重置设置

设置保存在浏览器的 `localStorage` 中。要重置，可以打开浏览器开发者工具，在 Console 里运行：

```js
localStorage.removeItem("idle-clock-settings-v1");
localStorage.removeItem("idle-clock-settings-v2");
location.reload();
```

也可以在浏览器站点数据里清除本地文件页面对应的数据。

## 为什么 V1 不是 Windows 屏保

V1 的重点是先把时钟本身做成稳定、好看、可复制的静态页面。Windows `.scr` 屏保或 WebView2 包装器属于后续 V2，最好在这个页面实际使用满意后再做。


## 效果展示 - 自由切换主题与个性化调整
![image.png](https://raw.gitcode.com/user-images/assets/10147290/407b45d7-870b-496a-aeca-3ebb8ebfbeb3/image.png 'image.png')
![image.png](https://raw.gitcode.com/user-images/assets/10147290/77c3fa6e-8902-45d5-88f2-14a6951d2ccc/image.png 'image.png')