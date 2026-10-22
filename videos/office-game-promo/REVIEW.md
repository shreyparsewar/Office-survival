# Promo V4 review

Delivered file: `out/office-survival-1999-promo-v4.mp4`.

V4 changes the soundtrack to "Funk Game Loop" by Kevin MacLeod: a recorded funk arrangement with bass, organ, guitar and drum kit. Source tempo is 104 BPM; the edit uses pitch-preserving adjustment to 120 BPM, a 20-second excerpt, a 0.04-second opening fade and a 0.85-second ending fade. No transition sound effects are added. The CC BY 3.0 attribution is in MUSIC-CREDIT.txt and embedded in the MP4 metadata.

All 1,200 compressed video packets and their timestamps match the approved V3 export exactly. The audio was replaced without re-encoding the picture.

V3 uses the game's actual 8bit Card, Badge, Button and Progress components. Text uses the local Press Start 2P font, fixed alignment and 0.13-second fades. Rotating, scaling and bouncing headline animations are removed. Card padding and badge spacing were checked in the exported MP4.

Final encoded audio measures -18.02 LUFS integrated, -2.81 dBTP true peak and 1.50 LU loudness range. Levels were measured rather than auditioned by ear.

The 3D scene uses game models rendered directly on the Remotion timeline. Jim walks, Dwight types, Michael gestures, the player runs, and the final cast waves. Cameras track, dive, and sweep. Cuts use directional slashes, a paper sweep, a whip, and a clock iris.

Review repairs: moved Michael's camera through the open doorway to keep his face clear; moved the running camera away from a foreground coworker; added directional shadows and a final-stage fill light.

## Validation

- Remotion ESLint and TypeScript checks pass.
- App TypeScript check passes.
- H.264, yuv420p, 1920×1080, 60 fps; AAC stereo soundtrack.
- Video and audio streams are each 20.000 seconds; the video has 1,200 frames.
- Full Chrome playback completed. The final headless playback check reported 3 dropped frames among 1,196 monitored frames and zero corrupted frames. Video packet hashes and timestamps remain identical to V3.
- Video packet hashes and timestamps verified against the approved V3 picture.

Older exports are retained for comparison. README links point to V4. The video uses the actual game assets with trailer-specific camera and character choreography. Include MUSIC-CREDIT.txt in the description/caption when posting.
