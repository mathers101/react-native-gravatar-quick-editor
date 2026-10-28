package com.gravatarquickeditor

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.gravatar.Gravatar
import com.gravatar.quickeditor.GravatarQuickEditor
import com.gravatar.quickeditor.ui.editor.AboutEditorConfiguration
import com.gravatar.quickeditor.ui.editor.AboutEditorResult
import com.gravatar.quickeditor.ui.editor.AboutInputField
import com.gravatar.quickeditor.ui.editor.AuthenticationMethod
import com.gravatar.quickeditor.ui.editor.AvatarPickerAndAboutEditorConfiguration
import com.gravatar.quickeditor.ui.editor.AvatarPickerConfiguration
import com.gravatar.quickeditor.ui.editor.AvatarPickerContentLayout
import com.gravatar.quickeditor.ui.editor.AvatarPickerResult
import com.gravatar.quickeditor.ui.editor.GravatarQuickEditorDismissReason
import com.gravatar.quickeditor.ui.editor.GravatarQuickEditorParams
import com.gravatar.quickeditor.ui.editor.GravatarUiMode
import com.gravatar.quickeditor.ui.editor.QuickEditorScopeOption
import com.gravatar.quickeditor.ui.oauth.OAuthParams
import com.gravatar.types.Email
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

class GravatarQuickEditorModule(reactContext: ReactApplicationContext) :
  NativeGravatarQuickEditorSpec(reactContext) {

  private val mainScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val editorOpen = AtomicBoolean(false)
  private var session: Session? = null
  private var editorView: View? = null
  private var dismissSource: String = "user"

  override fun open(optionsJson: String, promise: Promise) {
    mainScope.launch {
      if (!editorOpen.compareAndSet(false, true)) {
        promise.reject("already_open", "The Gravatar Quick Editor is already open.")
        return@launch
      }

      val activity = reactApplicationContext.currentActivity
      if (activity == null) {
        editorOpen.set(false)
        promise.reject(
          "activity_unavailable",
          "No foreground activity is available to present the Gravatar Quick Editor.",
        )
        return@launch
      }

      try {
        val options = JSONObject(optionsJson)
        val email = options.getString("email")
        applySdkConfiguration(options)
        val content = activity.findViewById<ViewGroup>(android.R.id.content)
        val childCountBefore = content.childCount
        val current = Session(promise)
        session = current
        GravatarQuickEditor.show(
          activity,
          buildParams(options, email),
          buildAuthentication(options),
          { update ->
            when (update) {
              is AvatarPickerResult -> emitUpdate(JSONObject().put("type", "avatar_updated"))
              is AboutEditorResult ->
                emitUpdate(
                  JSONObject()
                    .put("type", "profile_updated")
                    .put("profile", update.profile.toQuickEditorJson()),
                )
              else -> Unit
            }
          },
          { reason -> finish(reason, dismissSource) },
        )
        if (content.childCount > childCountBefore) {
          editorView = content.getChildAt(content.childCount - 1)
        }
        if (editorOpen.get()) {
          emitEvent(JSONObject().put("kind", "opened"))
        }
      } catch (error: Exception) {
        val current = session
        session = null
        editorView = null
        editorOpen.set(false)
        current?.promise?.reject("native_error", error.message, error)
      }
    }
  }

  override fun close() {
    mainScope.launch {
      if (!editorOpen.get()) {
        return@launch
      }
      dismissSource = "app"
      val view = editorView
      editorView = null
      (view?.parent as? ViewGroup)?.removeView(view)
      finish(GravatarQuickEditorDismissReason.Finished, "app")
    }
  }

  override fun isOpen(): Boolean = editorOpen.get()

  override fun logout(email: String, promise: Promise) {
    mainScope.launch {
      try {
        GravatarQuickEditor.logout(Email(email))
        promise.resolve(null)
      } catch (error: Exception) {
        promise.reject("native_error", error.message, error)
      }
    }
  }

  private fun applySdkConfiguration(options: JSONObject) {
    val activity = reactApplicationContext.currentActivity ?: return
    Gravatar.context(activity.applicationContext)
    val apiKey = options.optString("apiKey")
    if (apiKey.isNotEmpty()) {
      Gravatar.apiKey(apiKey)
    }
  }

  private fun buildParams(options: JSONObject, email: String): GravatarQuickEditorParams {
    return GravatarQuickEditorParams.Builder()
      .setEmail(Email(email))
      .setUiMode(uiMode(options.optString("colorScheme", "system")))
      .setScopeOption(scopeOption(options))
      .build()
  }

  private fun buildAuthentication(options: JSONObject): AuthenticationMethod {
    val token = options.optString("authToken")
    if (token.isNotEmpty()) {
      return AuthenticationMethod.Bearer(token)
    }
    return AuthenticationMethod.OAuth(
      OAuthParams.Builder()
        .setClientId(options.getString("clientId"))
        .setRedirectUri(options.getString("redirectUri"))
        .build(),
    )
  }

  private fun scopeOption(options: JSONObject): QuickEditorScopeOption {
    val layout = contentLayout(options.optString("avatarContentLayout", "horizontal"))
    val fields = aboutFields(options.optJSONArray("aboutFields"))
    return when (options.optString("scope", "avatars")) {
      "about" ->
        QuickEditorScopeOption.aboutEditor(AboutEditorConfiguration(fields))
      "avatars_and_about" ->
        QuickEditorScopeOption.avatarAndAbout(
          AvatarPickerAndAboutEditorConfiguration(
            layout,
            fields,
            if (options.optString("initialPage") == "about") {
              AvatarPickerAndAboutEditorConfiguration.Page.AboutEditor
            } else {
              AvatarPickerAndAboutEditorConfiguration.Page.AvatarPicker
            },
          ),
        )
      else ->
        QuickEditorScopeOption.avatarPicker(AvatarPickerConfiguration(layout))
    }
  }

  private fun aboutFields(values: JSONArray?): Set<AboutInputField> {
    if (values == null || values.length() == 0) {
      return AboutInputField.all
    }
    return buildSet {
      for (index in 0 until values.length()) {
        when (values.optString(index)) {
          "display_name" -> add(AboutInputField.DisplayName)
          "about_me" -> add(AboutInputField.AboutMe)
          "pronunciation" -> add(AboutInputField.Pronunciation)
          "pronouns" -> add(AboutInputField.Pronouns)
          "location" -> add(AboutInputField.Location)
          "job_title" -> add(AboutInputField.JobTitle)
          "company" -> add(AboutInputField.Company)
          "first_name" -> add(AboutInputField.FirstName)
          "last_name" -> add(AboutInputField.LastName)
        }
      }
    }.ifEmpty { AboutInputField.all }
  }

  private fun contentLayout(value: String): AvatarPickerContentLayout {
    return if (value == "vertical") {
      AvatarPickerContentLayout.Vertical
    } else {
      AvatarPickerContentLayout.Horizontal
    }
  }

  private fun uiMode(value: String): GravatarUiMode {
    return when (value) {
      "light" -> GravatarUiMode.LIGHT
      "dark" -> GravatarUiMode.DARK
      else -> GravatarUiMode.SYSTEM
    }
  }

  private fun emitUpdate(update: JSONObject) {
    val current = session ?: return
    current.updates.put(update)
    val event = JSONObject().put("kind", "update").put("updateType", update.getString("type"))
    if (update.has("profile")) {
      event.put("profile", update.get("profile"))
    }
    emitEvent(event)
  }

  private fun finish(reason: GravatarQuickEditorDismissReason, source: String) {
    val current = session ?: return
    session = null
    editorView = null
    editorOpen.set(false)
    dismissSource = "user"
    val dismissReason = when (reason) {
      GravatarQuickEditorDismissReason.OauthFailed -> "oauth_failed"
      GravatarQuickEditorDismissReason.InvalidToken -> "invalid_token"
      GravatarQuickEditorDismissReason.Finished -> "finished"
    }
    val status = when (dismissReason) {
      "finished" -> if (current.updates.length() > 0) "success" else "cancelled"
      else -> "error"
    }
    emitEvent(
      JSONObject()
        .put("kind", "closed")
        .put("dismissReason", dismissReason)
        .put("source", source),
    )
    val result = JSONObject()
      .put("status", status)
      .put("dismissReason", dismissReason)
      .put("source", source)
      .put("updates", current.updates)
    if (status == "error") {
      result.put("errorCode", dismissReason)
    }
    current.promise.resolve(result.toString())
  }

  private fun emitEvent(payload: JSONObject) {
    emitOnSessionEvent(payload.toString())
  }

  private class Session(val promise: Promise) {
    val updates: JSONArray = JSONArray()
  }

  companion object {
    const val NAME = NativeGravatarQuickEditorSpec.NAME
  }
}
