# Office Survival 1999 promo

A 20-second, 1920×1080, 60 fps game promo. It uses the actual game models with frame-driven character animation and moving cameras, plus the game's 8bit Card, Badge, Button and Progress components. V4 replaces the music with Kevin MacLeod's "Funk Game Loop", prepared as a 20-second cue at 120 BPM with a short ending fade. The approved V3 video frames and timestamps are copied unchanged. The edit uses the HyperFrames story and motion workflow and is built in Remotion.

## Preview and render

Requires Node.js 22 or newer. Install the game dependencies from the repository root with `pnpm install --frozen-lockfile`, then run these commands from this video folder.

```sh
npm ci
npm run dev
```

The composition is `OfficeSurvival1999`. To export the MP4:

```sh
npx remotion render src/index.ts OfficeSurvival1999 out/office-survival-1999-promo-v4.mp4 --codec=h264 --crf=20 --gl=angle
```

On this Windows machine, the render uses the installed Chrome browser:

```powershell
npx remotion render src/index.ts OfficeSurvival1999 out/office-survival-1999-promo-v4.mp4 --codec=h264 --crf=20 --gl=angle --browser-executable='C:\Program Files\Google\Chrome\Application\chrome.exe'
```

Prepare the licensed soundtrack and copy the approved V3 video stream into V4 with `python scripts/prepare-soundtrack.py`. This checks that all video packet hashes and timestamps match. Include the credit in `MUSIC-CREDIT.txt` in the description wherever the video is posted; the track is licensed under CC BY 3.0. The credit is also embedded in the MP4 metadata.

The models in `src/game/` are snapshots of the game models, roster and office layout, with local imports and lint cleanup. Every pose and camera move is calculated from the video frame. The render does not require a browser recording or live game server. Older captures and soundtracks remain as editable source material.

The UI imports the existing game components from the repository. `npm run build:ui` compiles their Tailwind styles into `src/8bit-compiled.css`. The pixel font is loaded locally, and CSS animation clocks are disabled in the video so all reveals follow the timeline.

## Edit structure

The eight beats are: rush into the office, meet Jim, delegate to Dwight, Michael's meeting, run through the aisle, the full team, make it to 5 PM, and the animated cast with a play call to action. `SPEC.md` documents the current timing. The composition is `src/OfficePromo.tsx` and the animated 3D set is `src/CinemaWorld.tsx`. `scripts/audit-video.py` checks the finished file for frame cadence and duplicate frames and creates motion review sheets.
