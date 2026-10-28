require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "GravatarQuickEditor"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :http => "https://registry.npmjs.org/react-native-gravatar-quick-editor/-/react-native-gravatar-quick-editor-#{s.version}.tgz" }
  s.swift_version = "5.0"

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  # Last CocoaPods release of the official SDK. Quick Editor lives in GravatarUI.
  # Trunk dropped CocoaPods after 3.4.0; that tag is also the latest GitHub release.
  s.dependency "GravatarUI", "3.4.0"

  install_modules_dependencies(s)
end
