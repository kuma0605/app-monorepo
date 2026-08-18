import { RNAbility } from '@rnoh/react-native-openharmony';
import window from '@ohos.window';
import { SplashScreen } from '@react-native-ohos/react-native-splash-screen/src/main/ets/SplashScreen'

export default class EntryAbility extends RNAbility {
  getPagePath() {
    return 'pages/Index';
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    let startWindowIcon = $r('app.media.splashImg');
    let startWindowBackground = "#FFFFFF";
    let startPageUrl = 'pages/SplashScreenPage';
    SplashScreen.show(this.context, windowStage, startWindowIcon, startWindowBackground, startPageUrl).then(() => {
      super.onWindowStageCreate(windowStage);
    })
  }
}