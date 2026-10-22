# Revised promo specification

20 seconds / 1920×1080 / 60 fps / 1,200 timeline frames.

Actual game models, roster and office layout rendered directly in Remotion ThreeCanvas. Character poses and camera paths use timeline time. No browser recordings or screenshot holds in this version.

| Seconds | Action | Editorial beat |
| --- | --- | --- |
| 0–2 | Camera arrival into an active office | Your shift. Your problem. |
| 2–4.5 | Jim walks with a tracking camera | Work hard. Socialize harder. |
| 4.5–7 | Dwight types; task progress advances | Delegate. Get it done. |
| 7–9 | Michael gestures with mug in hand | Another meeting?! |
| 9–12 | Player runs down the aisle; papers fly | Keep moving. |
| 12–14.5 | Camera sweep over the animated team | 10 coworkers. Zero chill. |
| 14.5–17 | Office payoff with clock advancing | Make it to 5 PM. |
| 17–20 | Animated cast on a lit stage | Office Survival 1999. Play the game. |

Motion: camera tracking and dives, joint animation, 0.4 s directional slashes, 0.54 s paper sweep, 0.58 s clock iris. Text stays aligned inside the game's actual 8bit cards and reveals with a 0.13 s opacity fade. No text bounce, rotation or scale. Final title holds over 2 s.

Palette: navy #102a39, cream #f8f3df, green #378457, amber #d6a64f. Press Start 2P throughout the UI. Original 120 BPM stereo music at about 2 dB lower RMS than V2; transition sweeps and bass impacts removed, hi-hats reduced by half, and snare level reduced.

QA: lint and typecheck; representative shot frames; decoded motion and transition sheets; exact frame count and timestamp cadence; check for consecutive duplicate frames and frozen runs. No source recording is used, avoiding dropped capture frames.
