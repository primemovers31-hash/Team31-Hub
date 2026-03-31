$ErrorActionPreference = "Stop"

$script:EnglishCulture = [System.Globalization.CultureInfo]::GetCultureInfo("en-US")

function Convert-ToSlug {
  param([string]$Text)
  if ($null -eq $Text) { $Text = "" }
  $slug = $Text.ToLowerInvariant() -replace "[^a-z0-9]+", "-"
  return $slug.Trim("-")
}

function Convert-HtmlFragmentToText {
  param([string]$Html)

  if ([string]::IsNullOrWhiteSpace($Html)) {
    return ""
  }

  $text = $Html
  $text = [regex]::Replace($text, "(?is)<br\s*/?>", "`n")
  $text = [regex]::Replace($text, '(?is)<a [^>]*?title="([^"]+)"[^>]*>.*?</a>', '$1')
  $text = [regex]::Replace($text, "(?is)<a [^>]*?href=""([^""]+)""[^>]*>.*?</a>", '$1')
  $text = [regex]::Replace($text, "(?is)<span [^>]*>(.*?)</span>", '$1')
  $text = [regex]::Replace($text, "(?is)<[^>]+>", "")
  $text = [System.Net.WebUtility]::HtmlDecode($text)
  $text = [regex]::Replace($text, "\s+", " ")
  return $text.Trim()
}

function Convert-ToSafePreview {
  param([string]$Text)

  $preview = if ($null -eq $Text) { "" } else { $Text }
  $preview = [regex]::Replace($preview, "(?i)\b(retard|midget)\b", "[redacted]")
  $preview = [regex]::Replace($preview, "(?i)\b(dick|boob|boobs|tits|testicles|goon|smash)\b", "[redacted]")
  $preview = [regex]::Replace($preview, "(?i)(legal age|touch legally|femboy butt slut)", "[redacted]")
  if ($preview.Length -gt 170) {
    $preview = $preview.Substring(0, 167).TrimEnd() + "..."
  }
  return $preview.Trim()
}

function Convert-ToIsoDate {
  param([string]$Timestamp)

  if ([string]::IsNullOrWhiteSpace($Timestamp)) {
    return ""
  }

  try {
    $trimmed = $Timestamp.Trim()
    $zoneMatch = [regex]::Match($trimmed, '^(?<dateText>.+?)\s+(?<zone>CDT|CST)$')
    $dateText = if ($zoneMatch.Success) { $zoneMatch.Groups["dateText"].Value } else { $trimmed }
    $zone = if ($zoneMatch.Success) { $zoneMatch.Groups["zone"].Value } else { "CST" }
    $formats = @("dddd, MMMM d, yyyy h:mm tt", "dddd, MMMM dd, yyyy h:mm tt")
    $parsed = [DateTime]::ParseExact($dateText, $formats, $script:EnglishCulture, [System.Globalization.DateTimeStyles]::AllowWhiteSpaces)
    $offsetHours = if ($zone -eq "CDT") { -5 } else { -6 }
    return ([DateTimeOffset]::new($parsed, [TimeSpan]::FromHours($offsetHours))).ToString("o")
  } catch {
    return ""
  }
}

function Get-MessageCategories {
  param([string]$Text)

  $lower = if ($null -eq $Text) { "" } else { $Text.ToLowerInvariant() }
  $categories = [System.Collections.Generic.List[string]]::new()
  $scoreDelta = 0

  $rules = @(
    @{ Category = "Helpful"; Delta = 18; Patterns = @("fixed my bad", "problem dealt with", "have it back", "my bad", "i'll be there", "i will be there", "at tech now") },
    @{ Category = "Harassment"; Delta = -30; Patterns = @("shut up", "moron", "dont deserve rights", "don't deserve rights", "little bro", "i dont care", "i don't care") },
    @{ Category = "Threat"; Delta = -38; Patterns = @("break them all", "beat", "throw you", "i will break", "touch legally") },
    @{ Category = "Slur"; Delta = -70; Patterns = @("retard", "midget") },
    @{ Category = "Sexualized"; Delta = -60; Patterns = @("legal age", "touch legally", "dick", "boob", "tits", "testicles", "goon", "femboy") },
    @{ Category = "Attendance"; Delta = -8; Patterns = @("can't make it", "cant make it", "away from my computer", "skipping", "i am sick", "i'm sick") },
    @{ Category = "Admin"; Delta = 8; Patterns = @("give me mod back", "server", "mute the rythm channel", "problem dealt with", "link you will always be able to rejoin") }
  )

  foreach ($rule in $rules) {
    foreach ($pattern in $rule.Patterns) {
      if ($lower.Contains($pattern)) {
        if (-not $categories.Contains($rule.Category)) {
          [void]$categories.Add($rule.Category)
          $scoreDelta += [int]$rule.Delta
        }
        break
      }
    }
  }

  if ($lower -match "^https?://") {
    if (-not $categories.Contains("Link-only")) {
      [void]$categories.Add("Link-only")
      $scoreDelta -= 2
    }
  }

  return [pscustomobject]@{
    Categories = $categories.ToArray()
    ScoreDelta = $scoreDelta
  }
}

function Get-AttachmentNames {
  param([string]$Html)

  $safeHtml = if ($null -eq $Html) { "" } else { $Html }
  $matches = [regex]::Matches($safeHtml, '(?is)<p class="MuiTypography-root MuiTypography-body2 css-1arprak">(?<value>[^<]+)</p>')
  $values = foreach ($match in $matches) {
    $value = Convert-HtmlFragmentToText $match.Groups["value"].Value
    if ($value -match "\.[A-Za-z0-9]{2,5}$") {
      $value
    }
  }
  return @($values | Select-Object -Unique)
}

function Get-RelativeWebPath {
  param(
    [string]$RootPath,
    [string]$TargetPath
  )

  $rootUri = New-Object System.Uri((Resolve-Path $RootPath).Path.TrimEnd("\") + "\")
  $targetUri = New-Object System.Uri((Resolve-Path $TargetPath).Path)
  $relative = $rootUri.MakeRelativeUri($targetUri).ToString()
  return [System.Uri]::UnescapeDataString($relative)
}

function Get-DiscordTitleMetadata {
  param([string]$TitleText)

  $normalized = if ($null -eq $TitleText) { "" } else { [System.Net.WebUtility]::HtmlDecode($TitleText) }
  $normalized = $normalized -replace "`r", ""

  $usernameMatch = [regex]::Match($normalized, '(?m)Username:\s*(.+)$')
  $displayNameMatch = [regex]::Match($normalized, '(?m)Display Name:\s*(.+)$')
  $serverNicknameMatch = [regex]::Match($normalized, '(?m)Server Nickname:\s*(.+)$')
  $userIdMatch = [regex]::Match($normalized, '(?m)User ID:\s*(\d+)')
  $joinedServerMatch = [regex]::Match($normalized, '(?m)Joined Server:\s*(.+)$')
  $roles = @()
  $rolesMatch = [regex]::Match($normalized, '(?m)^Roles:\s*(.+)$')
  if ($rolesMatch.Success) {
    $roles = @(
      $rolesMatch.Groups[1].Value -split "\s*,\s*" |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
  }

  return [pscustomobject]@{
    username = if ($usernameMatch.Success) { $usernameMatch.Groups[1].Value.Trim() } else { "" }
    displayName = if ($displayNameMatch.Success) { $displayNameMatch.Groups[1].Value.Trim() } else { "" }
    serverNickname = if ($serverNicknameMatch.Success) { $serverNicknameMatch.Groups[1].Value.Trim() } else { "" }
    userId = if ($userIdMatch.Success) { $userIdMatch.Groups[1].Value.Trim() } else { "" }
    joinedServer = if ($joinedServerMatch.Success) { $joinedServerMatch.Groups[1].Value.Trim() } else { "" }
    roles = @($roles)
  }
}

function Get-DiscordMessageBlocks {
  param(
    [string]$RawHtml,
    [string]$SourcePath
  )

  $blockPattern = '(?is)<div class="MuiStack-root (?<blockClass>css-py77qc|css-7k6pj0)" id="(?<snowflake>\d+)">(?<content>.*?)(?=<div class="MuiStack-root (?:css-py77qc|css-7k6pj0)" id="\d+"|$)'
  $timestampPattern = '(?is)(?:<span class="MuiTypography-root MuiTypography-caption[^"]*" title="|<div class="MuiBox-root css-moni8" title=")(?<timestamp>(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), [^"]+ (?:CDT|CST))"'
  $messagePattern = '(?is)<p class="MuiTypography-root MuiTypography-body1 css-sdpfzd" id="message-data-(?<messageIndex>\d+)">(?<body>.*?)</p>'

  $blocks = @()
  $currentAuthor = $null
  $blockMatches = [regex]::Matches($RawHtml, $blockPattern)

  foreach ($blockMatch in $blockMatches) {
    $blockClass = $blockMatch.Groups["blockClass"].Value
    $blockContent = $blockMatch.Groups["content"].Value

    if ($blockClass -eq "css-py77qc") {
      $authorMatch = [regex]::Match($blockContent, '(?is)<strong title="(?<title>[^"]+)"[^>]*>(?<visible>.*?)</strong>')
      if ($authorMatch.Success) {
        $authorMeta = Get-DiscordTitleMetadata $authorMatch.Groups["title"].Value
        $currentAuthor = [pscustomobject]@{
          username = $authorMeta.username
          displayName = $authorMeta.displayName
          serverNickname = $authorMeta.serverNickname
          userId = $authorMeta.userId
          joinedServer = $authorMeta.joinedServer
          roles = @($authorMeta.roles)
          visible = Convert-HtmlFragmentToText $authorMatch.Groups["visible"].Value
        }
      }
    }

    $messageMatch = [regex]::Match($blockContent, $messagePattern)
    if (-not $messageMatch.Success) {
      continue
    }

    $timestampMatch = [regex]::Match($blockContent, $timestampPattern)
    $bodyHtml = $messageMatch.Groups["body"].Value
    $bodyText = Convert-HtmlFragmentToText $bodyHtml
    $categories = Get-MessageCategories $bodyText
    $attachments = @((Get-AttachmentNames $blockContent))
    $displayName = ""
    $username = ""
    $serverNickname = ""
    $userId = ""
    $joinedServer = ""
    $visibleName = ""
    $roles = @()

    if ($currentAuthor) {
      $displayName = if ($currentAuthor.displayName) { $currentAuthor.displayName } else { $currentAuthor.visible }
      $username = if ($currentAuthor.username) { $currentAuthor.username } else { $currentAuthor.visible }
      $serverNickname = $currentAuthor.serverNickname
      $userId = $currentAuthor.userId
      $joinedServer = $currentAuthor.joinedServer
      $visibleName = $currentAuthor.visible
      $roles = @($currentAuthor.roles)
    }

    $blocks += [pscustomobject]@{
      authorUserId = $userId
      authorDisplay = $displayName
      authorUsername = $username
      authorVisible = $visibleName
      authorServerNickname = $serverNickname
      authorJoinedServer = $joinedServer
      authorRoles = $roles
      id = $messageMatch.Groups["messageIndex"].Value
      snowflake = $blockMatch.Groups["snowflake"].Value
      timestampLabel = if ($timestampMatch.Success) { $timestampMatch.Groups["timestamp"].Value } else { "" }
      timestampIso = if ($timestampMatch.Success) { Convert-ToIsoDate $timestampMatch.Groups["timestamp"].Value } else { "" }
      text = $bodyText
      preview = if ($bodyText) { Convert-ToSafePreview $bodyText } elseif ($attachments.Count) { "Attachment only message." } else { "Empty or embed-only message." }
      categories = @($categories.Categories)
      scoreDelta = [int]$categories.ScoreDelta
      linkCount = [regex]::Matches($bodyHtml, '(?is)href=').Count
      attachmentNames = $attachments
      sourcePath = $SourcePath
    }
  }

  return $blocks
}

$hubRoot = Split-Path -Parent $PSScriptRoot
$generalRoot = Join-Path $hubRoot "General Files"
$outputPath = Join-Path $hubRoot "data\\team31-hub-data.js"

$roster = @(
  @{ firstName = "Graham"; lastName = "Pinnell"; room = "324"; role = "Student" },
  @{ firstName = "Braden"; lastName = "Cowan"; room = "324"; role = "Student" },
  @{ firstName = "Vinny"; lastName = "Wilson"; room = "324"; role = "Student" },
  @{ firstName = "James"; lastName = "Haney"; room = "322"; role = "Student" },
  @{ firstName = "Zachary"; lastName = "Pursell"; room = "322"; role = "Student" },
  @{ firstName = "Hudson"; lastName = "Crisp"; room = "322"; role = "Student" },
  @{ firstName = "Noah"; lastName = "Thompson"; room = "320"; role = "Student" },
  @{ firstName = "Jimmy"; lastName = "Awtrey"; room = "320"; role = "Student" },
  @{ firstName = "Kieran"; lastName = "Dye"; room = "320"; role = "Student" },
  @{ firstName = "Ethan"; lastName = "Guldan"; room = "318"; role = "Student" },
  @{ firstName = "Anders"; lastName = "Olson"; room = "318"; role = "Student" },
  @{ firstName = "Jace"; lastName = "Sanders"; room = "318"; role = "Student" },
  @{ firstName = "Miles"; lastName = "Stackenwalt"; room = "306"; role = "Student" },
  @{ firstName = "Jonathan"; lastName = "Coone"; room = "306"; role = "Student" },
  @{ firstName = "Bryson"; lastName = "Koehling"; room = "306"; role = "Student" },
  @{ firstName = "Cate"; lastName = "Johnson"; room = "300"; role = "Student" },
  @{ firstName = "Shari"; lastName = "Schenfield"; room = "304"; role = "Mentor" },
  @{ firstName = "Mark"; lastName = "Schenfield"; room = "304"; role = "Mentor" },
  @{ firstName = "Jennifer"; lastName = "Chruchill"; room = "307"; role = "Mentor" },
  @{ firstName = "Crystal"; lastName = "Finch"; room = "307"; role = "Mentor" },
  @{ firstName = "Mason"; lastName = "Harper"; room = "308"; role = "Mentor" },
  @{ firstName = "Triana"; lastName = "Harper"; room = "308"; role = "Mentor" },
  @{ firstName = "Todd"; lastName = "Langley"; room = "309"; role = "Mentor" },
  @{ firstName = "Jacob"; lastName = "Johnson"; room = "309"; role = "Mentor" },
  @{ firstName = "Kevin"; lastName = "Poe"; room = "312"; role = "Mentor" },
  @{ firstName = "Cheyenne"; lastName = "Phillips"; room = "312"; role = "Mentor" }
)

$codenameAdjectives = @("Midnight", "Velvet", "Static", "Maroon", "Ghost", "Iron", "Cipher", "Neon", "Signal", "Titan", "Granite", "Voltage")
$codenameNouns = @("Falcon", "Relay", "Circuit", "Atlas", "Beacon", "Rook", "Wrench", "Comet", "Anvil", "Viper", "Mirage", "Echo")
$specialtiesStudent = @("Build Ops", "Programming", "CAD Intel", "Drive Crew", "Pit Support", "Electrical", "Media Recon", "Strategy")
$specialtiesMentor = @("Mentor Control", "Operations Support", "Build Oversight", "Systems Advisor", "Safety Watch", "Strategy Counsel")

$receiptFolders = Get-ChildItem -Path $generalRoot -Directory -ErrorAction SilentlyContinue
$receiptMembers = @()

foreach ($folder in $receiptFolders) {
  $baseFirstName = ($folder.Name -replace "\s+General$", "").Trim()
  $rosterMember = $roster | Where-Object { $_.firstName -eq $baseFirstName } | Select-Object -First 1
  if (-not $rosterMember) { continue }

  $htmlFile = Get-ChildItem -Path $folder.FullName -Filter "general_page_1.html" -Recurse -File | Select-Object -First 1
  if (-not $htmlFile) { continue }

  $raw = Get-Content -Path $htmlFile.FullName -Raw -Encoding UTF8
  $sourcePath = Get-RelativeWebPath -RootPath $hubRoot -TargetPath $htmlFile.FullName
  $parsedBlocks = @(Get-DiscordMessageBlocks -RawHtml $raw -SourcePath $sourcePath)
  $ownerGroup = $parsedBlocks | Where-Object { $_.authorUserId } | Group-Object authorUserId | Sort-Object Count -Descending | Select-Object -First 1
  $ownerUserId = if ($ownerGroup) { $ownerGroup.Name } else { "" }
  $ownerBlocks = if ($ownerUserId) { @($parsedBlocks | Where-Object { $_.authorUserId -eq $ownerUserId }) } else { @() }
  $ownerMeta = $ownerBlocks | Select-Object -First 1
  $avatarRoot = Join-Path $folder.FullName "avatars"

  if ($ownerUserId -and (Test-Path (Join-Path $avatarRoot $ownerUserId))) {
    $avatarFile = Get-ChildItem -Path (Join-Path $avatarRoot $ownerUserId) -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
  } else {
    $avatarFile = Get-ChildItem -Path $avatarRoot -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
  }

  $messages = @(
    $ownerBlocks | ForEach-Object {
      [pscustomobject]@{
        id = $_.id
        snowflake = $_.snowflake
        timestampLabel = $_.timestampLabel
        timestampIso = $_.timestampIso
        text = $_.text
        preview = $_.preview
        categories = @($_.categories)
        scoreDelta = $_.scoreDelta
        linkCount = $_.linkCount
        attachmentNames = @($_.attachmentNames)
        sourcePath = $_.sourcePath
      }
    }
  )

  $hashSeed = [Math]::Abs($baseFirstName.GetHashCode())
  $specialtyPool = if ($rosterMember.role -eq "Mentor") { $specialtiesMentor } else { $specialtiesStudent }
  $datedMessages = @($messages | Where-Object { -not [string]::IsNullOrWhiteSpace($_.timestampIso) })
  $firstSeen = ($datedMessages | Sort-Object timestampIso | Select-Object -First 1).timestampIso
  $lastSeen = ($datedMessages | Sort-Object timestampIso -Descending | Select-Object -First 1).timestampIso
  $flaggedMessages = @($messages | Where-Object { $_.categories.Count -gt 0 })
  $positiveSignals = @($messages | Where-Object { $_.categories -contains "Helpful" -or $_.categories -contains "Admin" })
  $baseScore = if ($rosterMember.role -eq "Mentor") { 820 } else { 710 }
  $scoreSum = ($messages | Measure-Object -Property scoreDelta -Sum).Sum
  if ($null -eq $scoreSum) { $scoreSum = 0 }
  $receiptScore = $baseScore + $scoreSum
  $receiptScore = [Math]::Max(420, [Math]::Min(980, [int]$receiptScore))

  $receiptMembers += [pscustomobject]@{
    id = Convert-ToSlug("$($rosterMember.firstName)-$($rosterMember.lastName)-$($rosterMember.room)")
    firstName = $rosterMember.firstName
    lastName = $rosterMember.lastName
    name = "$($rosterMember.firstName) $($rosterMember.lastName)"
    room = $rosterMember.room
    role = $rosterMember.role
    codename = "$($codenameAdjectives[$hashSeed % $codenameAdjectives.Count]) $($codenameNouns[$hashSeed % $codenameNouns.Count])"
    specialty = $specialtyPool[$hashSeed % $specialtyPool.Count]
    discordDisplay = if ($ownerMeta) { $ownerMeta.authorDisplay } else { $baseFirstName }
    discordUsername = if ($ownerMeta) { $ownerMeta.authorUsername } else { "" }
    discordUserId = if ($ownerMeta) { $ownerMeta.authorUserId } else { "" }
    joinedServer = if ($ownerMeta) { $ownerMeta.authorJoinedServer } else { "" }
    roles = if ($ownerMeta) { @($ownerMeta.authorRoles) } else { @() }
    serverNickname = if ($ownerMeta) { $ownerMeta.authorServerNickname } else { "" }
    avatarPath = if ($avatarFile) { Get-RelativeWebPath -RootPath $hubRoot -TargetPath $avatarFile.FullName } else { "" }
    sourceFolder = Get-RelativeWebPath -RootPath $hubRoot -TargetPath $folder.FullName
    messageCount = $messages.Count
    flaggedCount = $flaggedMessages.Count
    helpfulCount = $positiveSignals.Count
    attachmentCount = @($messages | Where-Object { $_.attachmentNames.Count -gt 0 }).Count
    linkOnlyCount = @($messages | Where-Object { $_.categories -contains "Link-only" }).Count
    firstSeen = if ($firstSeen) { $firstSeen } else { "" }
    lastSeen = if ($lastSeen) { $lastSeen } else { "" }
    score = $receiptScore
    note = if ($flaggedMessages.Count) { "Receipts imported from Discord export. Review flagged items before using any score publicly." } else { "Receipts imported from Discord export." }
    topCategories = @($flaggedMessages | ForEach-Object { $_.categories } | Group-Object | Sort-Object Count -Descending | Select-Object -First 4 | ForEach-Object { $_.Name })
    messages = $messages
  }
}

$receiptById = @{}
foreach ($member in $receiptMembers) {
  $receiptById[$member.id] = $member
}

$allMembers = foreach ($member in $roster) {
  $id = Convert-ToSlug("$($member.firstName)-$($member.lastName)-$($member.room)")
  if ($receiptById.ContainsKey($id)) {
    $receiptById[$id]
    continue
  }

  $hashSeed = [Math]::Abs($id.GetHashCode())
  $specialtyPool = if ($member.role -eq "Mentor") { $specialtiesMentor } else { $specialtiesStudent }
  [pscustomobject]@{
    id = $id
    firstName = $member.firstName
    lastName = $member.lastName
    name = "$($member.firstName) $($member.lastName)"
    room = $member.room
    role = $member.role
    codename = "$($codenameAdjectives[$hashSeed % $codenameAdjectives.Count]) $($codenameNouns[$hashSeed % $codenameNouns.Count])"
    specialty = $specialtyPool[$hashSeed % $specialtyPool.Count]
    discordDisplay = ""
    discordUsername = ""
    discordUserId = ""
    joinedServer = ""
    serverNickname = ""
    roles = @()
    avatarPath = ""
    sourceFolder = ""
    messageCount = 0
    flaggedCount = 0
    helpfulCount = 0
    attachmentCount = 0
    linkOnlyCount = 0
    firstSeen = ""
    lastSeen = ""
    score = if ($member.role -eq "Mentor") { 810 } else { 700 }
    note = "No Discord export loaded for this member yet."
    topCategories = @()
    messages = @()
  }
}

$evidenceFeed = @(
  $allMembers |
    ForEach-Object {
      $member = $_
      foreach ($message in $member.messages) {
        if ($message.categories.Count -eq 0) { continue }
        [pscustomobject]@{
          memberId = $member.id
          memberName = $member.name
          room = $member.room
          role = $member.role
          discordDisplay = $member.discordDisplay
          timestampIso = $message.timestampIso
          timestampLabel = $message.timestampLabel
          preview = $message.preview
          categories = $message.categories
          attachmentNames = $message.attachmentNames
          sourcePath = $message.sourcePath
          messageId = $message.id
          scoreDelta = $message.scoreDelta
        }
      }
    }
) | Sort-Object @{ Expression = { $_.scoreDelta } ; Descending = $false }, @{ Expression = { $_.timestampIso } ; Descending = $true }

$summary = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  receiptFolders = $receiptMembers.Count
  totalMembers = $allMembers.Count
  totalMessages = ($receiptMembers | Measure-Object -Property messageCount -Sum).Sum
  totalFlaggedMessages = ($receiptMembers | Measure-Object -Property flaggedCount -Sum).Sum
}

$data = [pscustomobject]@{
  summary = $summary
  members = @($allMembers | Sort-Object @{ Expression = { $_.score } ; Descending = $true }, lastName, firstName)
  evidenceFeed = @($evidenceFeed | Select-Object -First 160)
}

$json = $data | ConvertTo-Json -Depth 8
$js = "window.TEAM31_HUB_DATA = $json;"
Set-Content -Path $outputPath -Value $js -Encoding UTF8

Write-Output "Generated $outputPath"
Write-Output ("Members: " + $summary.totalMembers)
Write-Output ("Receipt folders: " + $summary.receiptFolders)
Write-Output ("Messages parsed: " + $summary.totalMessages)
Write-Output ("Flagged messages: " + $summary.totalFlaggedMessages)
