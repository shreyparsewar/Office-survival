# Office Survival 1999 promo

A 20-second, 1920×1080, 30 fps game promo. It uses captured footage and screenshots from the running game, an original retro instrumental, and animated typography and transitions. The edit was planned with the HyperFrames story and motion workflow and built in Remotion.

## Preview and render

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

The composition is `OfficeSurvival1999`. To export the MP4:

```sh
npx remotion render src/index.ts OfficeSurvival1999 out/office-survival-1999-promo.mp4 --codec=h264
```

On this Windows machine, the render uses the installed Chrome browser:

```powershell
npx remotion render src/index.ts OfficeSurvival1999 out/office-survival-1999-promo.mp4 --codec=h264 --browser-executable='C:\Program Files\Google\Chrome\Application\chrome.exe'
```

The music is generated from `scripts/make-music.py`. The game captures live in `public/captures/`; the render does not require the game server.

## Edit structure

The six beats are: clock in, meet the team, assign work, advance time, survive until 5 PM, and the title card. `STORYLINES.md` and `SPEC.md` document the concept and timing. The editable composition is `src/OfficePromo.tsx`.
