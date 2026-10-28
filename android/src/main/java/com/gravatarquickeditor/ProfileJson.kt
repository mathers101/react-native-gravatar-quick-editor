package com.gravatarquickeditor

import com.gravatar.restapi.models.CryptoWalletAddress
import com.gravatar.restapi.models.GalleryImage
import com.gravatar.restapi.models.Interest
import com.gravatar.restapi.models.Language
import com.gravatar.restapi.models.Link
import com.gravatar.restapi.models.Profile
import com.gravatar.restapi.models.ProfileContactInfo
import com.gravatar.restapi.models.ProfilePayments
import com.gravatar.restapi.models.ProfileSectionVisibility
import com.gravatar.restapi.models.VerifiedAccount
import org.json.JSONArray
import org.json.JSONObject

internal fun Profile.toQuickEditorJson(): JSONObject {
  val json = JSONObject()
  json.put("hash", hash)
  json.put("display_name", displayName)
  json.put("profile_url", profileUrl.toString())
  json.put("avatar_url", avatarUrl.toString())
  json.put("avatar_alt_text", avatarAltText)
  json.put("location", location)
  json.put("description", description)
  json.put("job_title", jobTitle)
  json.put("company", company)
  json.put("verified_accounts", JSONArray(verifiedAccounts.map { it.toQuickEditorJson() }))
  json.put("pronunciation", pronunciation)
  json.put("pronouns", pronouns)
  userId?.let { json.put("user_id", it) }
  userLogin?.let { json.put("user_login", it) }
  timezone?.let { json.put("timezone", it) }
  languages?.let { values ->
    json.put("languages", JSONArray(values.map { it.toQuickEditorJson() }))
  }
  firstName?.let { json.put("first_name", it) }
  lastName?.let { json.put("last_name", it) }
  isOrganization?.let { json.put("is_organization", it) }
  headerImage?.let { json.put("header_image", it) }
  backgroundColor?.let { json.put("background_color", it) }
  links?.let { values -> json.put("links", JSONArray(values.map { it.toQuickEditorJson() })) }
  interests?.let { values ->
    json.put("interests", JSONArray(values.map { it.toQuickEditorJson() }))
  }
  payments?.let { json.put("payments", it.toQuickEditorJson()) }
  contactInfo?.let { json.put("contact_info", it.toQuickEditorJson()) }
  gallery?.let { values -> json.put("gallery", JSONArray(values.map { it.toQuickEditorJson() })) }
  numberVerifiedAccounts?.let { json.put("number_verified_accounts", it) }
  lastProfileEdit?.let { json.put("last_profile_edit", it) }
  registrationDate?.let { json.put("registration_date", it) }
  sectionVisibility?.let { json.put("section_visibility", it.toQuickEditorJson()) }
  return json
}

private fun VerifiedAccount.toQuickEditorJson(): JSONObject =
  JSONObject()
    .put("service_type", serviceType)
    .put("service_label", serviceLabel)
    .put("service_icon", serviceIcon.toString())
    .put("url", url.toString())
    .put("is_hidden", isHidden)

private fun Language.toQuickEditorJson(): JSONObject =
  JSONObject()
    .put("code", code)
    .put("name", name)
    .put("is_primary", isPrimary)
    .put("order", order)

private fun Link.toQuickEditorJson(): JSONObject =
  JSONObject().put("label", label).put("url", url.toString())

private fun Interest.toQuickEditorJson(): JSONObject =
  JSONObject().put("id", id).put("name", name)

private fun CryptoWalletAddress.toQuickEditorJson(): JSONObject =
  JSONObject().put("label", label).put("address", address)

private fun ProfilePayments.toQuickEditorJson(): JSONObject =
  JSONObject()
    .put("links", JSONArray(links.map { it.toQuickEditorJson() }))
    .put("crypto_wallets", JSONArray(cryptoWallets.map { it.toQuickEditorJson() }))

private fun ProfileContactInfo.toQuickEditorJson(): JSONObject {
  val json = JSONObject()
  homePhone?.let { json.put("home_phone", it) }
  workPhone?.let { json.put("work_phone", it) }
  cellPhone?.let { json.put("cell_phone", it) }
  email?.let { json.put("email", it) }
  contactForm?.let { json.put("contact_form", it.toString()) }
  calendar?.let { json.put("calendar", it.toString()) }
  return json
}

private fun GalleryImage.toQuickEditorJson(): JSONObject {
  val json = JSONObject().put("url", url.toString())
  altText?.let { json.put("alt_text", it) }
  return json
}

private fun ProfileSectionVisibility.toQuickEditorJson(): JSONObject {
  val json = JSONObject()
  hiddenContactInfo?.let { json.put("hidden_contact_info", it) }
  hiddenLinks?.let { json.put("hidden_links", it) }
  hiddenInterests?.let { json.put("hidden_interests", it) }
  hiddenWallet?.let { json.put("hidden_wallet", it) }
  hiddenPhotos?.let { json.put("hidden_photos", it) }
  hiddenVerifiedAccounts?.let { json.put("hidden_verified_accounts", it) }
  return json
}
