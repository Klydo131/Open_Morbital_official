Mobile:
![[Pasted image 20260504155318.png]]


Desktop:
![[ChatGPT Image May 4, 2026, 03_31_40 PM, Orbit v1.4.png]]

Be sure to add sliders for Music selection and feature selection, I don't want to get stuck on boxes while I want to play my next music at the bottom or features that I can't see top to bottom

---

I dont want to see these kind of error EVER AGAIN:
![[Pasted image 20260504160902.png]]
Find a way to fix this while making the system secured to hackers, I want ANY URL from youtube videos (karaoke,music,etc),music and Spotify music CAN BE PLAYED in this Music platform.


# ORBIT v1.4 — Final Build Specification

## Project

**Orbit v1.4**

## Build Target

Orbit v1.4 is a polished local-first PWA music player deployed on **Vercel** and integrated with **Supabase** for optional online features.

The app must work in three states:

1. **Offline local player**
2. **Online connected player**
3. **Installed Chrome PWA**

The UI must match the supplied Orbit v1.4 reference images as closely as possible.

This version must correct the failed UI direction of v1.3. The v1.4 interface must be clean, professional, premium, and functional.

---

# 1. Non-Negotiable UI Requirement

The Orbit v1.4 UI must be built **1:1 from the new reference images**.

The desktop image and mobile image are the visual source of truth.

The final app must preserve:

- dark navy/blue glass interface
- retro-wave music player identity
- realistic CD visual
- large central playback hub
- left navigation panel
- right queue panel
- bottom console bar
- mobile responsive version
- neon cyan/purple highlights
- soft borders and inner shadows
- professional spacing
- clean typography
- no clutter
- no childish sci-fi wording

The UI must look like a real premium music app, not a placeholder prototype.

---

# 2. Visual Direction

## Required Style

Orbit v1.4 must look like:

- retro-wave music hardware
- premium dark glass UI
- blue/violet neon media player
- polished desktop music application
- clean PWA interface
- modern but nostalgic
- professional enough for public release

## Do Not Use

Do not use:

- generic Tailwind dashboard UI
- plain cards
- bright white sections
- cheap gradient backgrounds
- oversized random icons
- inconsistent spacing
- unstyled browser controls
- fake SaaS layout
- Spotify clone layout
- YouTube Music clone layout

## Removed From Previous Mockup

The new v1.4 UI must **not** include:

- the phrase `Your Personal Music Spaceship`
- bottom-left `Power` button
- excessive product metaphor labels
- unnecessary technical badges crowding the top bar
- fake system controls that do not do anything

---

# 3. Desktop Layout Source of Truth

The desktop UI must follow this structure:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ LEFT BRAND AREA        TOP ONLINE/OFFLINE STATUS                    WINDOWS │
├──────────────────────┬───────────────────────────────────────┬──────────────┤
│ SIDEBAR              │ CENTRAL PLAYER                         │ QUEUE PANEL  │
│                      │                                       │              │
│ ORBIT v1.4           │ Large CD visual                        │ UP NEXT      │
│ RETRO WAVE PLAYER    │ Mood button                            │ Clear        │
│                      │ Vertical volume slider                  │ Track list   │
│ Now Playing          │ Track display panel                     │ Save Queue   │
│ Library              │ Progress bar                            │ Load Queue   │
│ Playlists            │ Transport controls                      │              │
│ Radio                │                                       │              │
│ Discover             │                                       │              │
│ Karaoke              │                                       │              │
│ Themes               │                                       │              │
│ Settings             │                                       │              │
│                      │                                       │              │
│ Import Music         │                                       │              │
│ Paste URL            │                                       │              │
│ Browse Files         │                                       │              │
├──────────────────────┴───────────────────────────────────────┴──────────────┤
│ CLOCK / LCD MESSAGE / DISPLAY CONTROLS / EJECT                               │
└──────────────────────────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────────┐
│ 9:41                       │
│ Menu     ORBIT v1.4   Gear │
├────────────────────────────┤
│ LOCAL SHIP        ONLINE   │
├────────────────────────────┤
│ Large CD visual            │
├────────────────────────────┤
│ Track title                │
│ Artist                     │
│ Source badge               │
├────────────────────────────┤
│ Progress bar               │
├────────────────────────────┤
│ Shuffle Prev Play Next Loop│
├────────────────────────────┤
│ Save Offline | Go Online   │
├────────────────────────────┤
│ Up Next                    │
├────────────────────────────┤
│ Player | Library | Vault | Queue │
└────────────────────────────┘

```
`
Mobile must not be a crushed desktop layout. It must be a designed mobile player.

Next, read the following images below for further instructions:

![[Pasted image 20260504194141.png]]

![[Pasted image 20260504194235.png]]

![[Pasted image 20260504194252.png]]
![[Pasted image 20260504194407.png]]

## Required Functions

- Drag and drop local audio files.
- Browse local audio files.
- Paste supported URL.
- Validate file type.
- Show clear error if unsupported.
- Add valid tracks to local library or current queue.
- Do not upload local files. (“**Do not upload local files**” means: when a user chooses or drops an audio file from their computer/phone, **Orbit must play it locally on the device and must not send that actual audio file to Supabase, Vercel, your server, or any third-party service.**)
  
  ![[Pasted image 20260504194652.png]]
![[Pasted image 20260504194714.png]]

![[Pasted image 20260504194730.png]]

![[Pasted image 20260504194820.png]]

![[Pasted image 20260504194832.png]]

![[Pasted image 20260504194845.png]]

![[Pasted image 20260504194903.png]]

![[Pasted image 20260504194939.png]]

![[Pasted image 20260504195016.png]]
![[Pasted image 20260504195056.png]]
# 18. Vercel Requirement

Orbit v1.4 must deploy to Vercel.

Use Vercel for:

- production hosting
- preview deployments
- HTTPS
- static frontend app
- PWA delivery
- GitHub deployment pipeline

![[Pasted image 20260504195156.png]]

# 19. Supabase Requirement

Supabase must be integrated and must work with the Vercel deployment.

Use Supabase for:

- optional authentication
- optional user profile
- optional settings sync
- optional cloud playlist metadata later
- future online mode foundation

Do not use Supabase for:

- storing local audio files
- uploading music files
- tracking listening history
- hidden analytics
- ad profiling
- private file indexing without consent
![[Pasted image 20260504195237.png]]

# 20. Supabase Tables for v1.4

Create minimal tables only.

Do not overbuild.

## profiles

Stores optional user profile.

```
SQL

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## user_settings

Stores optional synced settings only.

```
SQL

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id text default 'orbit-retrowave',
  sync_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);
```

## playlist_metadata

Optional metadata only. Do not store audio.

```
SQL

create table if not exists playlist_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Row Level Security

Enable RLS on all user tables.

```
SQL

alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table playlist_metadata enable row level security;
```

Basic owner policies:

```
create policy "Users can read their own profile"
on profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

create policy "Users can read their own settings"
on user_settings for select
using (auth.uid() = user_id);

create policy "Users can insert their own settings"
on user_settings for insert
with check (auth.uid() = user_id);

create policy "Users can update their own settings"
on user_settings for update
using (auth.uid() = user_id);

create policy "Users can read their own playlist metadata"
on playlist_metadata for select
using (auth.uid() = user_id);

create policy "Users can insert their own playlist metadata"
on playlist_metadata for insert
with check (auth.uid() = user_id);

create policy "Users can update their own playlist metadata"
on playlist_metadata for update
using (auth.uid() = user_id);

create policy "Users can delete their own playlist metadata"
on playlist_metadata for delete
using (auth.uid() = user_id);
```

![[Pasted image 20260504195709.png]]

# 22. PWA Requirement

Orbit v1.4 must be installable from Chrome.

Required:

- `manifest.webmanifest`
- app icons
- service worker
- offline shell caching
- standalone display mode
- install prompt
- mobile responsive UI

Manifest example:

```
JSON
{
  "name": "Orbit v1.4",
  "short_name": "Orbit",
  "description": "A private retro-wave music player for online and offline listening.",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "theme_color": "#071025",
  "background_color": "#050816",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Use `vite-plugin-pwa`.

# 23. Local Storage Requirement

Use IndexedDB/Dexie for local state.

Store locally:

- track metadata
- playlist data
- queue state
- settings
- theme preference
- recently loaded local references where technically possible

Do not upload local files.

Do not store actual audio blobs unless user explicitly chooses a supported offline cache feature.

# 24. Required Folder Structure

Use this structure:

```
src/
  app/
    App.tsx
    routes/
      NowPlaying.tsx
      Library.tsx
      Playlists.tsx
      Radio.tsx
      Discover.tsx
      Karaoke.tsx
      Themes.tsx
      Settings.tsx

  components/
    layout/
      DesktopShell.tsx
      MobileShell.tsx
      TopStatusBar.tsx
      Sidebar.tsx
      QueuePanel.tsx
      BottomConsole.tsx

    player/
      CDPlayer.tsx
      PlaybackHub.tsx
      TrackReadout.tsx
      ProgressBar.tsx
      TransportControls.tsx
      VolumeSlider.tsx
      VisualizerBars.tsx

    import/
      ImportMusicPanel.tsx
      DropZone.tsx
      PasteUrlButton.tsx
      BrowseFilesButton.tsx

    queue/
      QueueItem.tsx
      SaveQueueButton.tsx
      LoadQueueButton.tsx

    online/
      OnlineStatus.tsx
      SupabaseStatus.tsx
      AuthPanel.tsx

    settings/
      PrivacySettings.tsx
      PwaSettings.tsx
      SupabaseSettings.tsx

  core/
    audio/
      audioEngine.ts
      playbackController.ts
      mediaSession.ts

    storage/
      db.ts
      trackRepository.ts
      playlistRepository.ts
      queueRepository.ts
      settingsRepository.ts

    import/
      ingestService.ts
      metadataService.ts
      albumArtService.ts
      urlImportService.ts

    online/
      supabaseClient.ts
      authService.ts
      settingsSyncService.ts

    pwa/
      registerServiceWorker.ts
      installPrompt.ts
      networkStatus.ts

  store/
    playerStore.ts
    libraryStore.ts
    queueStore.ts
    uiStore.ts
    networkStore.ts
    onlineStore.ts

  styles/
    tokens.css
    base.css
    orbit-v14.css
    responsive.css
```

# 25. Design Tokens

Use these tokens as the visual base.

```
CSS

:root {
  --orbit-bg: #050816;
  --orbit-bg-deep: #020611;

  --orbit-panel: #0b1530;
  --orbit-panel-2: #101d3d;
  --orbit-panel-3: #17295a;
  --orbit-glass: rgba(16, 29, 61, 0.78);

  --orbit-border: rgba(105, 145, 230, 0.45);
  --orbit-border-bright: rgba(115, 170, 255, 0.8);

  --orbit-text: #eef4ff;
  --orbit-muted: #9da9c8;
  --orbit-dim: #66708f;

  --orbit-cyan: #35d9ff;
  --orbit-blue: #3478ff;
  --orbit-blue-deep: #1239a8;
  --orbit-violet: #7457ff;
  --orbit-purple: #a855f7;
  --orbit-pink: #ff4fd8;
  --orbit-green: #39e889;

  --orbit-radius-sm: 8px;
  --orbit-radius-md: 14px;
  --orbit-radius-lg: 22px;
  --orbit-radius-xl: 32px;

  --orbit-glow-blue: 0 0 30px rgba(52, 120, 255, 0.42);
  --orbit-glow-cyan: 0 0 24px rgba(53, 217, 255, 0.34);
  --orbit-glow-purple: 0 0 28px rgba(168, 85, 247, 0.4);

  --orbit-shadow-device: 0 30px 90px rgba(0, 0, 0, 0.68);
  --orbit-inset: inset 0 1px 0 rgba(255, 255, 255, 0.08),
                 inset 0 -1px 0 rgba(0, 0, 0, 0.45);
}
```

# 26. Functional Requirements

## Playback

Must support:

- play
- pause
- previous
- next
- shuffle
- repeat
- seek
- volume
- queue
- current time
- duration
- current track display

## Import

Must support:

- drag and drop files
- browse files
- paste URL
- validation
- metadata extraction
- album art extraction where possible

## Queue

Must support:

- add track
- remove track
- clear queue
- save queue
- load queue
- persist queue locally
- highlight current track

## Library

Must support:

- local tracks
- search
- metadata
- album art
- source type
- add to queue
- save locally

## Online

Must support:

- Supabase connection check
- optional login screen
- sync status
- online unavailable state
- app continues working if Supabase fails

## PWA

Must support:

- install button or browser install flow
- offline shell
- responsive layout
- mobile app-like experience
  
# 27. Build Order

Build in this exact order.

## Phase 1 — UI Reconstruction

Rebuild the v1.4 UI to match the new reference images.

Do not start advanced online features until the UI shell is visually correct.

Required components:

- DesktopShell
- MobileShell
- Sidebar
- TopStatusBar
- PlaybackHub
- CDPlayer
- QueuePanel
- ImportMusicPanel
- BottomConsole

## Phase 2 — Local Playback

Connect:

- audio engine
- local file import
- play/pause
- seek
- volume
- track metadata
- album art
- queue

## Phase 3 — Local Persistence

Connect:

- Dexie
- local library
- saved playlists
- saved queue
- user settings
- theme state

## Phase 4 — PWA

Add:

- manifest
- service worker
- install support
- offline app shell
- icons
- mobile polish

## Phase 5 — Vercel Deployment

Add:

- production build
- Vercel config
- environment variables
- preview deployment verification
- production deployment verification

## Phase 6 — Supabase Integration

Add:

- Supabase client
- optional auth
- connection status
- settings sync
- RLS tables
- no audio upload

## Phase 7 — QA and Polish

Check:

- desktop visual match
- mobile visual match
- no broken spacing
- no UI overlap
- no v1.3-style failed layout
- offline mode works
- online mode works
- Supabase fails gracefully
- Vercel deployment works
- PWA install works

# 28. Acceptance Criteria

Orbit v1.4 is accepted only if:

- UI closely matches the new desktop reference
- UI closely matches the new mobile reference
- no `Your Personal Music Spaceship` text appears
- no bottom-left power button appears
- sidebar matches the reference
- import panel matches the reference
- central CD is visually dominant
- queue panel matches the reference
- bottom console matches the reference
- app deploys on Vercel
- Supabase environment variables work in Vercel
- Supabase connects successfully when configured
- app still works when Supabase is unavailable
- local file playback works
- queue works
- local persistence works
- PWA install works in Chrome
- offline app shell works
- no local music files are uploaded
- no analytics or hidden tracking exists
- code is readable and maintainable

# 29. Final Instruction to Builder

Build Orbit v1.4 as a real application, not a mockup.

The UI must be treated as product-grade art direction. Match the supplied images closely.

Vercel and Supabase must both be integrated correctly:

- Vercel hosts and deploys the PWA.
- Supabase powers optional online identity and sync.
- Local playback remains independent from Supabase.
- Offline mode must never break.
- No tracking or audio upload is allowed.

The result must feel like a finished premium retro-wave music player that can be publicly deployed.

```
This version is much stricter and cleaner than the previous markdown. It removes the overbuilt “spaceship” language from the visible UI, keeps the concept in the architecture, and makes the new reference image the real source of truth.
::contentReference[oaicite:1]{index=1}
```