# Promo V3 review

Delivered file: `out/office-survival-1999-promo-v3.mp4`.

V3 uses the game's actual 8bit Card, Badge, Button and Progress components. Text uses the local Press Start 2P font, fixed alignment and 0.13-second fades. Rotating, scaling and bouncing headline animations are removed. Card padding and badge spacing were checked in the exported MP4.

Transition noise sweeps and bass hits are removed. Hi-hat level is halved, snare level reduced, and music playback volume reduced from 0.8 to 0.65. Combined audio RMS is 2.13 dB lower than V2.

The 3D scene uses game models rendered directly on the Remotion timeline. Jim walks, Dwight types, Michael gestures, the player runs, and the final cast waves. Cameras track, dive, and sweep. Cuts use directional slashes, a paper sweep, a whip, and a clock iris.

Review repairs: moved Michael's camera through the open doorway to keep his face clear; moved the running camera away from a foreground coworker; added directional shadows and a final-stage fill light.

## Validation

- Remotion ESLint and TypeScript checks pass.
- App TypeScript check passes.
- H.264, yuv420p, 1920×1080, 60 fps; AAC stereo soundtrack.
- Video stream is exactly 20.000 seconds and 1,200 decoded frames. AAC padding gives the container a 20.011-second duration.
- Full Chrome playback test reports zero dropped frames and zero corrupted frames after preload.
- Reviewed representative shot frames, the final title layout, task panel, and badge spacing decoded from the delivered MP4.

Older exports are retained for comparison. README links point to V3. The video uses the actual game assets with trailer-specific camera and character choreography.
