#!/usr/bin/env bash
# Repack document-picker / file-viewer .har with patched ETS sources.
# npm 自带的 .har 是源码包（含 ts.ts）；hvigor assembleHar 产出字节码 har，运行时无法解析 /ts 子路径。
# 源码直链会导致启动崩溃：cannot find record '&@react-native-ohos/.../ts&...'
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_MODULES="$ROOT/node_modules"

repack_one() {
  local pkg_dir="$1"
  local ets_file="$2"
  local har_path="$3"

  if [[ ! -f "$har_path" ]]; then
    echo "repack-ohos-hars: skip missing $har_path"
    return 0
  fi

  local work
  work="$(mktemp -d)"
  mkdir -p "$work/package"
  tar -xf "$har_path" -C "$work" 2>/dev/null || tar -xf "$har_path" -C "$work/package" --strip-components=1 2>/dev/null || {
    # Fresh npm har uses package/ prefix
    tar -xf "$har_path" -C "$work"
  }

  if [[ ! -d "$work/package/src/main/ets" ]]; then
    echo "repack-ohos-hars: unexpected har layout at $har_path" >&2
    rm -rf "$work"
    return 1
  fi

  cp "$pkg_dir/src/main/ets/$ets_file" "$work/package/src/main/ets/$ets_file"
  find "$work" -name '._*' -delete
  find "$work" -name '.DS_Store' -delete

  COPYFILE_DISABLE=1 tar --exclude='._*' --exclude='.DS_Store' -cf "$har_path" -C "$work" package
  rm -rf "$work"
  echo "repack-ohos-hars: updated $har_path"
}

repack_one \
  "$NODE_MODULES/@react-native-ohos/react-native-document-picker/harmony/document_picker" \
  "documentPickerTurboModule.ts" \
  "$NODE_MODULES/@react-native-ohos/react-native-document-picker/harmony/document_picker.har"

repack_one \
  "$NODE_MODULES/@react-native-ohos/react-native-file-viewer/harmony/file_viewer" \
  "RNFileViewerTurboModule.ts" \
  "$NODE_MODULES/@react-native-ohos/react-native-file-viewer/harmony/file_viewer.har"
