# RNOH Metro No Apps Connected

## Summary

在 Harmony/OpenHarmony 虚拟机已经启动 App 的情况下，Metro 仍可能提示：

```text
warn No apps connected. Sending "reload" to all React Native apps failed.
Make sure your app is running in the simulator or on a phone connected via USB.
```

这不表示鸿蒙虚拟机没有运行 App，而是表示 Metro 没有发现任何 React Native 运行时连接到它的开发通道，因此无法发送 reload / Fast Refresh 消息。

## Symptom

- DevEco 中 Harmony 虚拟机已启动，App 页面也能显示。
- Metro 终端按 `r` 或触发 reload 时提示 `No apps connected`。
- 代码修改后，Metro 不能把 reload 消息推送给鸿蒙 App。

## Root Cause

当前工程在 `Index.ets` 中使用了 `MetroJSBundleProvider()`：

```ts
new MetroJSBundleProvider();
```

默认情况下，它会访问类似下面的地址：

```text
http://localhost:8081/index.bundle?platform=harmony&dev=true&minify=false
```

问题在于：在 Harmony 虚拟机里，`localhost` 指的是虚拟机自己，不是运行 Metro 的 Mac。

因此不做端口转发时，链路是：

```text
Harmony VM localhost:8081 -> Harmony VM itself -> no Metro server
```

Metro 实际运行在 Mac 上：

```text
Mac localhost:8081 -> Metro
```

如果鸿蒙侧没有真正从 Metro 拉 bundle，也没有建立热重载连接，Metro 就会认为当前没有已连接 App。

## Fix

执行 `hdc rport`，把鸿蒙设备/虚拟机侧的 `localhost:8081` 转发到电脑侧的 `localhost:8081`：

```bash
hdc rport tcp:8081 tcp:8081
```

执行后，链路变为：

```text
Harmony VM localhost:8081 -> forwarded to Mac localhost:8081 -> Metro
```

此时鸿蒙 App 访问 `localhost:8081` 就能连到 Mac 上的 Metro，Metro 也能发现已连接的 App。

## Verification

1. 启动 Metro：

```bash
npm start
```

2. 执行端口转发：

```bash
hdc rport tcp:8081 tcp:8081
```

3. 重新启动 Harmony App。

4. 在 Metro 终端按 `r`，确认不再出现 `No apps connected`，并且 App 能收到 reload。

## Reactotron 调试端口转发 (9090)

如果项目中集成了 Reactotron，在鸿蒙虚拟机/设备上运行时，也需要对 Reactotron 的默认端口 `9090` 进行端口转发，否则 Reactotron 客户端无法接收到 App 发出的日志与状态。

### 端口转发命令

在终端执行：

```bash
hdc rport tcp:9090 tcp:9090
```

### 链路机制

```text
Harmony VM localhost:9090 -> forwarded to Mac localhost:9090 -> Reactotron
```

## Notes

- `hdc rport` 需要在设备/虚拟机可被 `hdc` 识别后执行。
- 如果重启模拟器、重启 DevEco、切换设备，需要重新执行上述的 `hdc rport` 端口转发命令（包括 `8081` 和 `9090`）。
- 真机也可以使用电脑局域网 IP 配置 Metro / Reactotron 地址，但虚拟机场景下端口转发通常更直接。
- App 页面能显示不代表它已经连上 Metro；它可能正在使用打进包里的 `bundle.harmony.js`。
