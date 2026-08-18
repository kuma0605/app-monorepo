# RNOH SpinKit 编译时 Package 命名错误

## Summary

在编译 Harmony 工程时，遇到了 ArkTS 编译错误：

```text
> hvigor ERROR: ArkTS Compiler Error
1 ERROR: 10505001 ArkTS Compiler Error
Error Message: '"@react-native-ohos/react-native-spinkit/ts"' has no exported member named 'SpinKitPackage'. Did you mean 'RNSpinKitPackage'? At File: /Users/dylan/CodeHub/SAMRApp/harmony/entry/src/main/ets/RNPackagesFactory.ets:11:10
```

## Symptom

在使用 DevEco Studio 或通过命令行构建 HarmonyOS 应用时，ArkTS 编译器报错，提示 `@react-native-ohos/react-native-spinkit/ts` 模块中不存在导出的 `SpinKitPackage`，并提示是否应为 `RNSpinKitPackage`。

## Root Cause

在鸿蒙版的 `@react-native-ohos/react-native-spinkit` 中，导出的主 Package 类被命名为 `RNSpinKitPackage`：

```typescript
// node_modules/@react-native-ohos/react-native-spinkit/harmony/spinKit/src/main/ets/SpinKitPackage.ets
export class RNSpinKitPackage extends RNOHPackage { ... }
```

但在 `RNPackagesFactory.ets` 模版中，直接以 `SpinKitPackage` 进行导入和实例化，导致名称不匹配。

## Fix

修改 [RNPackagesFactory.ets](file:///Users/dylan/CodeHub/SAMRApp/harmony/entry/src/main/ets/RNPackagesFactory.ets) 文件：

1. **修改导入**：

   ```typescript
   // 修改前
   import {SpinKitPackage} from '@react-native-ohos/react-native-spinkit/ts';

   // 修改后
   import {RNSpinKitPackage} from '@react-native-ohos/react-native-spinkit/ts';
   ```

2. **修改实例化**：

   ```typescript
   // 修改前
   new SpinKitPackage(ctx),

   // 修改后
   new RNSpinKitPackage(ctx),
   ```

## Verification

重新在 DevEco Studio 中构建 Harmony 工程，验证该 ArkTS 编译报错不再出现。
