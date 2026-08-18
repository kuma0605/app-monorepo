#include "RNOH/PackageProvider.h"
#include "AsyncStoragePackage.h"
#include "DocumentPickerPackage.h"
#include "FileViewerPackage.h"
#include "GestureHandlerPackage.h"
#include "LinearGradientPackage.h"
#include "MaskedPackage.h"
#include "PermissionsPackage.h"
#include "RNFSPackage.h"
#include "ReanimatedPackage.h"
#include "ReanimatedWorkletPackage.h"
#include "SafeAreaViewPackage.h"
#include "SpinKitPackage.h"
#include "SplashScreenPackage.h"
#include "generated/RNOHGeneratedPackage.h"
#include "WebViewPackage.h"

using namespace rnoh;
std::vector<std::shared_ptr<Package>>
PackageProvider::getPackages(Package::Context ctx) {
  return {std::make_shared<RNOHGeneratedPackage>(ctx),
          std::make_shared<SafeAreaViewPackage>(ctx),
          std::make_shared<ReanimatedPackage>(ctx),
          std::make_shared<ReanimatedWorkletPackage>(ctx),
          std::make_shared<GestureHandlerPackage>(ctx),
          std::make_shared<DocumentPickerPackage>(ctx),
          std::make_shared<AsyncStoragePackage>(ctx),
          std::make_shared<FileViewerPackage>(ctx),
          std::make_shared<LinearGradientPackage>(ctx),
          std::make_shared<MaskedPackage>(ctx),
          std::make_shared<PermissionsPackage>(ctx),
          std::make_shared<RNFSPackage>(ctx),
          std::make_shared<SpinKitPackage>(ctx),
          std::make_shared<SplashScreenPackage>(ctx),
        std::make_shared<WebViewPackage>(ctx)};
}