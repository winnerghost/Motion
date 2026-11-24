# Pip Explains — daily facts Shorts engine

Code-driven motion graphics for a YouTube Shorts / Instagram Reels facts channel.
Every video stars **Pip**, the channel's signature character: a round, glossy, curious
creature with a glowing "idea" antenna. Pip explains each fact and acts it out.

Output: **1080×1920, 60 fps, H.264, loudness −14 LUFS** (ready to upload).

| Episode | Topic | Length |
|---|---|---|
| `EP001-tickle` | Why can't you tickle yourself? | 42 s |

## How a video is built

```
script ─► ElevenLabs voiceover ─► word timestamps ─► scenes (React + SVG) ─► render ─► MP4
```

1. **Script** (~100–120 words, 35–45 s). Rules that keep people watching:
   - **0–2 s hook**: a challenge or a claim that opens a question ("Try to tickle yourself. Right now.").
   - Show the answer as a **story** (cause → proof → payoff), not a list.
   - Every 2–3 s something new happens on screen.
   - End on a line that **loops** back into the first frame ("So… try again.").
   - **Every fact must be verifiable**; put the source on screen and in the description.
2. **Voiceover**: ElevenLabs `eleven_v4`, voice *"USA Millennial Voice"* (keep the same voice for every episode — it is part of the brand).
   Save it as `public/episodes/epNNN/vo.mp3` and the word timestamps (Scribe) as `words.raw.json`.
3. **Prepare audio** → captions, lip-sync and loudness:
   ```bash
   python3 scripts/prepare_audio.py public/episodes/epNNN
   ffmpeg -i public/episodes/epNNN/vo.mp3 -af loudnorm=I=-16:TP=-1.5 -ar 48000 public/episodes/epNNN/vo.wav
   ```
4. **Animate**: copy `src/episodes/ep001/` to a new folder, keep the beat table `T` (it is
   driven by the word timestamps, so every animation lands on the spoken word), and
   rebuild the shots. Register it in `src/Root.tsx`.
5. **Preview & render**
   ```bash
   npm install
   npm run studio            # live preview in the browser, scrub the timeline
   npm run render -- EP001-tickle   # -> out/EP001-tickle.mp4
   ```

## What's in here

| Path | What it is |
|---|---|
| `src/character/Pip.tsx` | Pip, fully puppetable: eyes, lids, brows, mouth (lip-sync), arms with IK-style bends, fingers, antenna physics, squash & stretch, goggles |
| `src/components/Brain.tsx` | Reusable cartoon brain with face, mask, glowing regions |
| `src/components/Props.tsx` | Laugh-o-meter, robot arm (IK), feather, joystick, wave cards, sliders, stamp, speech bubble, "HA" bursts, pills |
| `src/components/Hud.tsx` | Word-by-word karaoke captions + series title chip |
| `src/components/Background.tsx` | Studio backdrop: gradients, bokeh, grid floor, grain, vignette |
| `src/lib/anim.ts` | Keyframes, springs, easing, organic wobble, camera shake |
| `scripts/prepare_audio.py` | Word timings snapped to the real audio, caption chunking, lip-sync envelope |
| `scripts/make_sfx.py` | The channel's original sound kit + background loop, synthesised from scratch (no licensing) |
| `scripts/render.mjs` | Render + loudness normalisation |
| `src/PipSheet.tsx` | Pip's expression sheet (`PipSheet` composition) |

## Sources (EP001)

- Blakemore, Wolpert & Frith (1998). *Central cancellation of self-produced tickle sensation.* Nature Neuroscience 1, 635–640.
- Blakemore, Frith & Wolpert (1999). *Spatio-temporal prediction modulates the perception of self-produced stimuli.* Journal of Cognitive Neuroscience 11, 551–559.

## Licensing notes

- Remotion is free for individuals and companies of up to 3 people; larger teams need a company license (remotion.dev/license).
- Fonts: Fredoka and Bricolage Grotesque (SIL Open Font License).
- Voice: ElevenLabs library voice; commercial use is covered by a paid ElevenLabs plan.
