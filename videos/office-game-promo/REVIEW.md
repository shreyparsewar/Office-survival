# Promo V2 review

Delivered file: `out/office-survival-1999-promo-v2.mp4`.

The revision replaces still-image scenes and browser-captured video with the game models rendered directly on the Remotion timeline. Jim walks, Dwight types, Michael gestures, the player runs, and the final cast waves. Cameras track, dive, and sweep. Titles use staggered spring entrances; cuts use directional slashes, a paper sweep, a whip, and a clock iris. The stereo score includes timed transition accents.

Review repairs: moved Michael's camera through the open doorway to keep his face clear; moved the running camera away from a foreground coworker; added directional shadows and a final-stage fill light.

## Validation

- Remotion ESLint and TypeScript checks pass.
- App TypeScript check passes.
- H.264, yuv420p, 1920×1080, 60 fps; AAC stereo soundtrack.
- Video stream is exactly 20.000 seconds and 1,200 decoded frames. AAC padding gives the container a 20.011-second duration.
- Frame timestamps are consistently 0.016666–0.016667 seconds apart.
- No consecutive duplicate decoded frames. Longest near-static interval at the audit threshold is one frame (0.0167 seconds).
- Full Chrome playback test reports zero dropped frames and zero corrupted frames after preload.
- Reviewed representative frames plus motion and transition contact sheets decoded from the delivered MP4.

The older export is retained for comparison. README links point to V2. The new video uses the actual game assets with trailer-specific camera and character choreography.
