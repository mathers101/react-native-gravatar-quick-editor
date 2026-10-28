import Foundation
import UIKit
import Gravatar
import GravatarUI

@objc(GravatarQuickEditorImpl)
public final class GravatarQuickEditorImpl: NSObject {
  @objc public static let shared = GravatarQuickEditorImpl()

  private var isEditorOpen = false
  private var updates: [[String: Any]] = []
  private var presentedController: UIViewController?
  private var onEvent: ((String) -> Void)?
  private var onResolved: ((String) -> Void)?
  private var onRejected: ((String, String) -> Void)?
  private var didFinish = false
  private var dismissSource = "user"

  @objc public func editorIsOpen() -> Bool {
    isEditorOpen
  }

  @objc public func open(
    optionsJson: String,
    presenter parent: UIViewController,
    onEvent: @escaping (String) -> Void,
    onResolved: @escaping (String) -> Void,
    onRejected: @escaping (String, String) -> Void
  ) {
    if isEditorOpen {
      onRejected("already_open", "The Gravatar Quick Editor is already open.")
      return
    }

    guard let data = optionsJson.data(using: .utf8),
          let options = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      onRejected("native_error", "Quick Editor options were not valid JSON.")
      return
    }

    let emailAddress = (options["email"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if emailAddress.isEmpty {
      onRejected("missing_email", "An email address is required to open the Gravatar Quick Editor.")
      return
    }

    self.onEvent = onEvent
    self.onResolved = onResolved
    self.onRejected = onRejected
    self.updates = []
    self.didFinish = false
    self.isEditorOpen = true

    let apiKey = options["apiKey"] as? String
    let clientId = options["clientId"] as? String
    let redirectUri = options["redirectUri"] as? String
    let secrets: Configuration.OAuthSecrets?
    if let clientId, let redirectUri, !clientId.isEmpty, !redirectUri.isEmpty {
      secrets = Configuration.OAuthSecrets(clientID: clientId, redirectURI: redirectUri)
    } else {
      secrets = nil
    }

    Task { @MainActor in
      await Configuration.shared.configure(with: apiKey, oauthSecrets: secrets)
      guard self.isEditorOpen, !self.didFinish else { return }

      let presenter = QuickEditorPresenter(
        email: Email(emailAddress),
        scopeOption: self.scopeOption(from: options),
        configuration: QuickEditorConfiguration(interfaceStyle: self.interfaceStyle(from: options)),
        token: self.token(from: options)
      )
      presenter.present(
        in: parent,
        onUpdate: { [weak self] update in
          self?.handle(update: update)
        },
        onDismiss: { [weak self] in
          guard let self else { return }
          self.finish(reason: "finished", source: self.dismissSource)
        }
      )
      self.presentedController = parent.presentedViewController
      self.emit(["kind": "opened"])
    }
  }

  @objc public func closeEditor() {
    Task { @MainActor in
      guard self.isEditorOpen else { return }
      self.dismissSource = "app"
      let controller = self.presentedController
      self.presentedController = nil
      if let controller {
        controller.dismiss(animated: true) {
          self.finish(reason: "finished", source: "app")
        }
      } else {
        self.finish(reason: "finished", source: "app")
      }
    }
  }

  @objc public func logout(email: String) {
    OAuthSession.shared.deleteSession(with: Email(email))
  }

  private func handle(update: QuickEditorUpdateType) {
    if update is QuickEditorUpdate.Avatar {
      let payload: [String: Any] = ["type": "avatar_updated"]
      updates.append(payload)
      emit(["kind": "update", "updateType": "avatar_updated"])
      return
    }

    guard let about = update as? QuickEditorUpdate.AboutInfo else { return }
    let profile = profileObject(about.profile)
    var payload: [String: Any] = ["type": "profile_updated"]
    payload["profile"] = profile
    updates.append(payload)
    emit([
      "kind": "update",
      "updateType": "profile_updated",
      "profile": profile,
    ])
  }

  private func finish(reason: String, source: String) {
    guard !didFinish else { return }
    didFinish = true
    isEditorOpen = false
    dismissSource = "user"
    presentedController = nil
    let status: String
    if reason == "finished" {
      status = updates.isEmpty ? "cancelled" : "success"
    } else {
      status = "error"
    }
    emit([
      "kind": "closed",
      "dismissReason": reason,
      "source": source,
    ])
    var result: [String: Any] = [
      "status": status,
      "dismissReason": reason,
      "source": source,
      "updates": updates,
    ]
    if status == "error" {
      result["errorCode"] = reason
    }
    if let json = jsonString(result) {
      onResolved?(json)
    } else {
      onRejected?("native_error", "Could not encode the Quick Editor result.")
    }
    onEvent = nil
    onResolved = nil
    onRejected = nil
    updates = []
  }

  private func scopeOption(from options: [String: Any]) -> QuickEditorScopeOption {
    let fields = aboutFields(from: options["aboutFields"] as? [String] ?? [])
    let layout = avatarLayout(from: options["avatarContentLayout"] as? String)
    switch options["scope"] as? String {
    case "about":
      return .aboutEditor(AboutEditorConfiguration(fields: fields))
    case "avatars_and_about":
      let page: AvatarPickerAndAboutEditorConfiguration.Page =
        (options["initialPage"] as? String) == "about" ? .aboutEditor : .avatarPicker
      return .avatarPickerAndAboutInfoEditor(
        AvatarPickerAndAboutEditorConfiguration(
          contentLayout: layout,
          fields: fields,
          initialPage: page
        )
      )
    default:
      let vertical = (options["avatarContentLayout"] as? String) == "vertical"
      return .avatarPicker(vertical ? .verticalLarge : .horizontalInstrinsicHeight)
    }
  }

  private func avatarLayout(from value: String?) -> AvatarPickerContentLayout {
    if value == "vertical" {
      return .vertical(presentationStyle: .large)
    }
    return .horizontal(presentationStyle: .intrinsicHeight)
  }

  private func aboutFields(from names: [String]) -> AboutInfoField {
    if names.isEmpty {
      return .all
    }
    var fields = AboutInfoField()
    for name in names {
      switch name {
      case "display_name": fields.insert(.displayName)
      case "about_me": fields.insert(.aboutMe)
      case "pronunciation": fields.insert(.pronunciation)
      case "pronouns": fields.insert(.pronouns)
      case "location": fields.insert(.location)
      case "job_title": fields.insert(.jobTitle)
      case "company": fields.insert(.company)
      case "first_name": fields.insert(.firstName)
      case "last_name": fields.insert(.lastName)
      default: break
      }
    }
    return fields.isEmpty ? .all : fields
  }

  private func interfaceStyle(from options: [String: Any]) -> UIUserInterfaceStyle {
    switch options["colorScheme"] as? String {
    case "light": return .light
    case "dark": return .dark
    default: return .unspecified
    }
  }

  private func token(from options: [String: Any]) -> String? {
    guard let token = options["authToken"] as? String, !token.isEmpty else {
      return nil
    }
    return token
  }

  private func profileObject(_ profile: Profile) -> [String: Any] {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    guard let data = try? encoder.encode(profile),
          let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      return [:]
    }
    return object
  }

  private func emit(_ payload: [String: Any]) {
    guard let json = jsonString(payload) else { return }
    onEvent?(json)
  }

  private func jsonString(_ payload: Any) -> String? {
    guard JSONSerialization.isValidJSONObject(payload),
          let data = try? JSONSerialization.data(withJSONObject: payload),
          let json = String(data: data, encoding: .utf8)
    else {
      return nil
    }
    return json
  }
}
