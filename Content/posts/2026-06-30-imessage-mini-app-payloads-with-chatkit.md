---
date: 2026-06-30 18:22
description: Reverse-engineering Photon's Spectrum iMessage extension and ChatKit's private plugin-payload APIs to send iMessage mini-app messages from a Mac.
tags: macOS, Reverse-Engineering, iMessage, ChatKit
---

# Sending iMessage Mini-App Payloads from macOS

I have been super excited by the stuff the guys at [Photon](https://photon.codes/) have been doing with iMessages. They kind of nerd-sniped me with their launch letting you programmatically send custom mini-apps. 

Basically, they let you send arbitrary web content via their helper iMessage app extension. I believe they also support sending custom payloads for any iMessage mini-app. Their helper app extension `Spectrum` makes it so you don't need to worry about needing to setup your own app extension, instead you just need to send the web payload. 

These notes are just to scratch my own reverse-engineering itch to figure out how Photon/Spectrum works. I would not use this for production — just use their API and services. While editing this post, I noticed Linq has also launched a similar service. 

tl;dr The interesting part is inside Messages.app's private ChatKit stack:

```text
MSMessage
  -> CKBrowserItemPayload / IMPluginPayload
  -> CKComposition
  -> IMMessage
  -> CKConversation sendMessage:onService:newComposition:
```

If you also want their default Jump Jump preview image, you pass a hidden `CKIMFileTransfer` as the `shelfMediaObject`. That produces a normal delivered iMessage app payload row plus a hidden JPEG attachment in `chat.db`.

## REing Spectrum 

![Spectrum by Photon](/assets/posts/photon/photon_spectrum.png)

![Hacker News Payload](/assets/posts/photon/photon_hn_full.png)

After I got my hands on the unencrypted version of their iMessages app extension, I unpacked it to check whether there were any magic entitlements or backend services involved. Spectrum is simply an iOS 26 message payload provider.

The extension Info.plist has:

```text
NSExtensionPointIdentifier = com.apple.message-payload-provider
CFBundleIdentifier = codes.photon.Spectrum.MessagesExtension
```

The host app is basically a shell:

```text
CFBundleIdentifier = codes.photon.Spectrum
LSApplicationLaunchProhibited = true
```

The extension links public Apple frameworks:

```text
/System/Library/Frameworks/Messages.framework/Messages
/System/Library/Frameworks/WebKit.framework/WebKit
/System/Library/Frameworks/UIKit.framework/UIKit
/System/Library/Frameworks/Foundation.framework/Foundation
```

The imported Objective-C classes include:

```text
MSMessagesAppViewController
MSMessage
MSMessageTemplateLayout
WKWebView
WKWebViewConfiguration
NSURLSession
UIGraphicsImageRenderer
UIImage
```

Nothing out of the ordinary. I'm not sure what Apple's policy is on WebKit views inside iMessage extensions, but Spectrum got approved on the App Store, so presumably it's fine.

The IPA also contains `MiniApps.json` with the Jump Jump game being a default app that is available from the start:

```json
{
  "featured": [
    {
      "id": "jump-jump",
      "url": "https://jump-jump-production.up.railway.app/",
      "fallbackTitle": "Jump Jump",
      "fallbackSubtitle": "A mobile web recreation of the Jump Jump charge-and-land loop."
    }
  ]
}
```

I did not see a Photon backend URL or obvious allowlist in the strings. The bundled app list is just a local default.

The most useful strings in the extension binary were:

```text
metadata request failed url=%{public}s error=%{public}s
manifest request failed url=%{public}s error=%{public}s
failed to decode web app manifest url=%{public}s error=%{public}s
failed to write Open Graph preview media error=%{public}s
failed to write generated preview media error=%{public}s
og:image:url
og:image
twitter:image
og:title
twitter:title
og:description
description
webp
WEBP
```

So the model is roughly:

1. The message carries a URL and template layout data.
2. Spectrum fetches metadata, Open Graph tags, and maybe a web app manifest.
3. It writes/generates preview media for the message.
4. When opened, the selected message is rendered by Spectrum's `WKWebView`.

That means the "web access" is not coming from iMessage transport. It is coming from the installed message payload provider extension. iMessage delivers the plugin payload. Spectrum receives it and uses WebKit.

## What the delivered row looks like

The good row had the same shape as a real mini-app send from iPhone:

```text
is_sent = 1
is_delivered = 1
error = 0
text = NULL
balloon_bundle_id = com.apple.messages.MSMessageExtensionBalloonPlugin:P8XT6232SL:codes.photon.Spectrum.MessagesExtension
payload_data = NSKeyedArchiver bplist
cache_has_attachments = 1
part_count = 2
```

The hidden preview image appears as an attachment:

```text
transfer_state = 5
hide_attachment = 1
mime_type = image/jpeg
uti = public.jpeg
```

The payload itself is an archived dictionary with keys like:

```text
URL
ai
appid
layoutClass
an
userInfo
```

Where:

- `URL` is the web URL to open in the iMessage app surface.
- `ai` is app/preview image data.
- `appid` is the App Store adam id.
- `an` is the app name.
- `layoutClass` is usually `MSMessageTemplateLayout`.
- `userInfo` carries caption/subcaption fields.

For Spectrum/Photon, the bundle id I observed was:

```text
com.apple.messages.MSMessageExtensionBalloonPlugin:P8XT6232SL:codes.photon.Spectrum.MessagesExtension
```

## The snippet

This is the core LLDB script shape. This lets us attach to `Messages.app`, create an `MSMessage`, turn it into a private plugin payload, wrap that in a `CKComposition`, optionally attach a hidden preview image, and then send through the existing `CKConversation`.

Replace:

- `RECIPIENT`
- `TARGET_URL`
- `PREVIEW_JPEG`
- `APP_BUNDLE_ID`
- `APP_NAME`
- `APP_ADAM_ID`

```lldb
expr -l objc++ -O -- ({
  id list = ((id(*)(Class,SEL))objc_msgSend)(
    (Class)objc_getClass("CKConversationList"),
    @selector(sharedConversationList)
  );

  id conv = ((id(*)(id,SEL,id))objc_msgSend)(
    list,
    @selector(conversationForExistingChatWithChatIdentifier:),
    @"RECIPIENT"
  );

  id svc = ((id(*)(id,SEL))objc_msgSend)(
    conv,
    @selector(sendingService)
  );

  id targetURL = ((id(*)(Class,SEL,id))objc_msgSend)(
    (Class)objc_getClass("NSURL"),
    @selector(URLWithString:),
    @"TARGET_URL"
  );

  id previewURL = ((id(*)(Class,SEL,id))objc_msgSend)(
    (Class)objc_getClass("NSURL"),
    @selector(fileURLWithPath:),
    @"PREVIEW_JPEG"
  );

  id transfer = ((id(*)(id,SEL,id,id,id,id,id,bool,bool))objc_msgSend)(
    (id)((id(*)(Class,SEL))objc_msgSend)(
      (Class)objc_getClass("CKIMFileTransfer"),
      @selector(alloc)
    ),
    @selector(initWithFileURL:transcoderUserInfo:attributionInfo:adaptiveImageGlyphContentIdentifier:adaptiveImageGlyphContentDescription:hideAttachment:isScreenshot:),
    previewURL,
    nil,
    nil,
    nil,
    nil,
    true,
    false
  );

  id imageData = ((id(*)(Class,SEL,id))objc_msgSend)(
    (Class)objc_getClass("NSData"),
    @selector(dataWithContentsOfFile:),
    @"PREVIEW_JPEG"
  );

  id layout = ((id(*)(id,SEL))objc_msgSend)(
    (id)((id(*)(Class,SEL))objc_msgSend)(
      (Class)objc_getClass("MSMessageTemplateLayout"),
      @selector(alloc)
    ),
    @selector(init)
  );

  ((void(*)(id,SEL,id))objc_msgSend)(layout, @selector(setCaption:), @"TITLE");
  ((void(*)(id,SEL,id))objc_msgSend)(layout, @selector(setImageTitle:), @"TITLE");
  ((void(*)(id,SEL,id))objc_msgSend)(layout, @selector(setSubcaption:), @"SUBTITLE");
  ((void(*)(id,SEL,id))objc_msgSend)(layout, @selector(setMediaFileURL:), previewURL);
  ((void(*)(id,SEL,id))objc_msgSend)(layout, @selector(setMediaData:), imageData);

  id ms = ((id(*)(id,SEL))objc_msgSend)(
    (id)((id(*)(Class,SEL))objc_msgSend)(
      (Class)objc_getClass("MSMessage"),
      @selector(alloc)
    ),
    @selector(init)
  );

  ((void(*)(id,SEL,id))objc_msgSend)(ms, @selector(setURL:), targetURL);
  ((void(*)(id,SEL,id))objc_msgSend)(ms, @selector(setLayout:), layout);

  id adam = ((id(*)(Class,SEL,long long))objc_msgSend)(
    (Class)objc_getClass("NSNumber"),
    @selector(numberWithLongLong:),
    APP_ADAM_ID
  );

  id pluginPayload = ((id(*)(id,SEL,id,id,id,bool))objc_msgSend)(
    ms,
    @selector(_pluginPayloadWithAppIconData:appName:adamID:allowDataPayloads:),
    imageData,
    @"APP_NAME",
    adam,
    true
  );

  ((void(*)(id,SEL,id))objc_msgSend)(
    pluginPayload,
    @selector(setPluginBundleID:),
    @"APP_BUNDLE_ID"
  );

  id comp = ((id(*)(id,SEL,id,id,id,id))objc_msgSend)(
    (id)((id(*)(Class,SEL))objc_msgSend)(
      (Class)objc_getClass("CKComposition"),
      @selector(alloc)
    ),
    @selector(initWithText:subject:shelfPluginPayload:shelfMediaObject:),
    nil,
    nil,
    pluginPayload,
    transfer
  );

  id messages = ((id(*)(id,SEL,id,id))objc_msgSend)(
    comp,
    @selector(messagesFromCompositionFirstGUIDForMessage:sendingService:),
    nil,
    svc
  );

  id msg = ((id(*)(id,SEL,unsigned long))objc_msgSend)(
    messages,
    @selector(objectAtIndex:),
    0UL
  );

  ((void(*)(id,SEL,id,id,bool))objc_msgSend)(
    conv,
    @selector(sendMessage:onService:newComposition:),
    msg,
    svc,
    true
  );

  msg;
})

detach
quit
```

Run it like this:

```bash
lldb -b -p "$(pgrep -x Messages | head -1)" -s send-miniapp.lldb
```

## Spectrum payload for Hacker News

Using HN for my examples has kind of become a hello-world ritual at this point.

I decided to use HN's logo as the hidden preview attachment.

```bash
curl -LfsS https://news.ycombinator.com/y18.svg -o /tmp/hn-y18.svg
sips -s format jpeg /tmp/hn-y18.svg --out "$HOME/Library/Containers/com.apple.MobileSMS/Data/tmp/hn-y18-preview.jpeg"
sips -z 512 512 "$HOME/Library/Containers/com.apple.MobileSMS/Data/tmp/hn-y18-preview.jpeg" \
  --out "$HOME/Library/Containers/com.apple.MobileSMS/Data/tmp/hn-og-preview.jpeg"
```

Then use:

```text
TARGET_URL = https://news.ycombinator.com/
PREVIEW_JPEG = /Users/me/Library/Containers/com.apple.MobileSMS/Data/tmp/hn-og-preview.jpeg
TITLE = Hacker News
SUBTITLE = news.ycombinator.com
APP_NAME = Spectrum
APP_ADAM_ID = 6777616651LL
APP_BUNDLE_ID = com.apple.messages.MSMessageExtensionBalloonPlugin:P8XT6232SL:codes.photon.Spectrum.MessagesExtension
```

The delivered row had:

```text
cache_has_attachments = 1
is_delivered = 1
hide_attachment = 1
payload URL = https://news.ycombinator.com/
```

## Why the obvious approaches did not work

AppleScript can send text and files, but it does not expose the plugin payload surface.

Directly inserting into `chat.db` gives you local artifacts, not an actual delivered iMessage — the `imagent`/IDS daemon state has to agree with what's in the database.

Patching the transport dictionary too late can get the IDS send to happen, but Messages may persist the local row as a normal image/file message instead of a plugin payload.

The reliable path was letting ChatKit build the message:

```text
MSMessage
  -> private plugin payload
  -> CKComposition with shelfPluginPayload and shelfMediaObject
  -> messagesFromCompositionFirstGUIDForMessage:sendingService:
  -> sendMessage:onService:newComposition:
```

## Debugging queries

Useful `chat.db` checks:

```bash
sqlite3 "$HOME/Library/Messages/chat.db" "
SELECT
  m.ROWID,
  datetime((m.date/1000000000)+978307200,'unixepoch','localtime'),
  quote(m.text),
  m.balloon_bundle_id,
  length(m.payload_data),
  m.is_sent,
  m.is_delivered,
  m.error,
  m.guid,
  m.cache_has_attachments,
  length(m.attributedBody),
  length(m.message_summary_info),
  m.part_count
FROM message m
JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
JOIN chat c ON c.ROWID = cmj.chat_id
WHERE c.chat_identifier = 'RECIPIENT'
ORDER BY m.ROWID DESC
LIMIT 10;
"
```

Dump the payload:

```bash
sqlite3 "$HOME/Library/Messages/chat.db" "
SELECT writefile('/tmp/payload.bplist', payload_data)
FROM message
WHERE ROWID = MESSAGE_ROWID;
"

plutil -p /tmp/payload.bplist
```

Check the hidden attachment:

```bash
sqlite3 -header -line "$HOME/Library/Messages/chat.db" "
SELECT *
FROM attachment
WHERE ROWID IN (
  SELECT attachment_id
  FROM message_attachment_join
  WHERE message_id = MESSAGE_ROWID
);
"
```

## Notes

This needs a local Messages process with your account already signed in, and SIP needs to be disabled.

The important conceptual bit is that iMessage mini-app sends are normal `IMMessage`s with a balloon bundle id and plugin payload, and ChatKit already knows how to produce them if you feed it the right private objects.
