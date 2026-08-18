import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import {SafeAreaViewPackage} from '@react-native-ohos/react-native-safe-area-context/ts';
import { ReanimatedPackage} from '@react-native-ohos/react-native-reanimated/ts';
import { ReanimatedWorkletPackage } from '@react-native-ohos/react-native-worklets';
import GestureHandlerPackage from '@react-native-ohos/react-native-gesture-handler';
import { DocumentPickerPackage } from '@react-native-ohos/react-native-document-picker/ts';
import { AsyncStoragePackage } from '@react-native-ohos/async-storage/ts';
import { FsPackage } from '@react-native-ohos/react-native-fs/ts';
import { RNFileViewerPackage } from '@react-native-ohos/react-native-file-viewer/ts';
import { PermissionsPackage } from '@react-native-ohos/react-native-permissions/ts';
import { RNSpinKitPackage } from '@react-native-ohos/react-native-spinkit/ts';
import { SplashScreenPackage } from '@react-native-ohos/react-native-splash-screen/ts';
import LinearGradientPackage from '@react-native-ohos/react-native-linear-gradient';
import MaskedPackage from '@react-native-ohos/masked-view';
import { WebViewPackage } from '@react-native-ohos/react-native-webview/ts';


export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new SafeAreaViewPackage(ctx),
    new ReanimatedPackage(ctx),
    new ReanimatedWorkletPackage(ctx),
    new GestureHandlerPackage(ctx),
    new DocumentPickerPackage(ctx),
    new AsyncStoragePackage(ctx),
    new FsPackage(ctx),
    new RNFileViewerPackage(ctx),
    new PermissionsPackage(ctx),
    new RNSpinKitPackage(ctx),
    new SplashScreenPackage(ctx),
    new LinearGradientPackage(ctx),
    new MaskedPackage(ctx),
    new WebViewPackage(ctx),
  ];
}