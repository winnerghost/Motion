# Pip Explains — daily facts Shorts engine

Code-driven motion graphics for a YouTube Shorts / Instagram Reels facts channel.
Every video stars **Pip**, the channel's signature character: a round, glossy, curious
creature with a glowing "idea" antenna. Pip explains each fact and acts it out.

Output: **1080×1920, 60 fps, H.264, loudness −14 LUFS** (ready to upload).

| Episode | Topic | Length |
|---|---|---|
| `EP001-tickle` | Why can't you tickle yourself? | 42 s |
| `EP002-tickle-foot-reply` | Reply to a comment: "Bro i can tickle my own foot" (two kinds of tickle) | 29 s |
| `EP003-wombat-cubes` | Why does the wombat poop cubes? (shelved) | 45 s |
| `EP004-recorded-voice` | Why does your voice sound weird in recordings? (with an audio demo) | 35 s |

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

## Website (link in bio)

`site/` is the channel's website: a fast, editorial single page (plain HTML + TypeScript, ~26 KB of JS gzipped, no framework).

Signature motion, built around Pip's antenna light:
- **Lights-out menu**: the page loses power with a flicker, the menu button becomes Pip's glowing bulb, and a dusty spotlight beam swings across the dark room to light each word letter by letter. The pool of light reveals a picture on the wall. Picking a section cuts the light, moves you there in the dark, and the lights flicker back on in the new room (`site/src/menu.ts`)
- **Lights on** intro: a bulb flickers awake and its spotlight opens onto the stage
- **"Curiosity?" → "Curiosity, answered."** headline sequence with a light sweep
- **Pip watches you**: live pupils and eyelids drawn over blank-eyed video loops (`Lux-Hero`, `Lux-Host` in `src/web/LuxClips.tsx`). He follows the cursor or finger, blinks, squints when you get close, gets sleepy after 11 pm, dozes off if you go quiet, and gets dizzy if you fling the page
- **Projector reel** film gallery, manifesto words that light up as they are read, light-fill platform rows, footer letters that catch the light
- One rAF loop that measures first and writes after; transform/opacity only; the beam is pre-rendered once so the menu runs at ~60 fps

Interactive features:
- **Labs** (`labs.ts`): *Your two voices* records 4 s from the mic (or uses a sample of Pip's voice) and plays it back "in your head" (bone-conduction filters) vs. "as others hear it"; nothing is uploaded. *The tickle delay* adds 0–300 ms between your tap and the light, after Blakemore, Wolpert & Frith (1999)
- **Fact or myth** (`game.ts`, statements in `facts.ts`): five statements a day, the same set for everyone, swipe or tap, streaks saved on the device, and a 1080×1920 story card to share the score (`share.ts`)
- **Share this answer**: every question in the index can be shared as a story card
- **Next-film countdown** (daily at 7:00 PM IST, set in `site/src/countdown.ts`)
- Type **"why"** anywhere for a secret fact; custom **404** page ("This page is in the dark")

```bash
cd site && npm install && npm run build   # -> site/dist
# or from the repo root (uses the root node_modules):
npx vite build --config site/vite.config.ts
npx vite preview --config site/vite.config.ts   # local preview on :4173
```
Deploy:
- **Vercel linked to this GitHub repo**: the root `vercel.json` builds `site/` and serves `site/dist`, so every push deploys automatically.
- **Manual upload**: deploy the contents of `site/dist` plus `site/vercel.json` (caching headers, clean URLs).

## What's in here

| Path | What it is |
|---|---|
| `src/character/Pip.tsx` | Pip, fully puppetable: eyes, lids, brows, mouth (lip-sync), arms with IK-style bends, fingers, antenna physics, squash & stretch, goggles |
| `src/components/Brain.tsx` | Reusable cartoon brain with face, mask, glowing regions |
| `src/components/Voice.tsx` | Phone, sunglasses, ear sticker, sound rings, flowing sound paths, EQ bars |
| `src/components/Wombat.tsx` | Wombat guest star, poop cube/ball/blob, rock, trophy, gut tube + cross-section diagrams |
| `src/components/Props.tsx` | Laugh-o-meter, robot arm (IK), feather, joystick, wave cards, sliders, stamp, speech bubble, "HA" bursts, pills |
| `src/components/Hud.tsx` | Word-by-word karaoke captions + series title chip |
| `src/components/Background.tsx` | Studio backdrop: gradients, bokeh, grid floor, grain, vignette |
| `src/lib/anim.ts` | Keyframes, springs, easing, organic wobble, camera shake |
| `src/lib/shots.tsx` | Shared shot helpers: shot transitions, camera, stage, sound design (voice + ducked music + SFX cues) |
| `scripts/prepare_audio.py` | Word timings snapped to the real audio, caption chunking, lip-sync envelope |
| `scripts/make_sfx.py` | The channel's original sound kit + background loop, synthesised from scratch (no licensing) |
| `scripts/render.mjs` | Render + loudness normalisation |
| `src/PipSheet.tsx` | Pip's expression sheet (`PipSheet` composition) |
| `src/web/LuxClips.tsx` | Cinematic website loops of Pip and the social share card |
| `src/brand/Brand.tsx` | Profile picture (`Avatar`) and YouTube banner (`Banner`, `BannerSafeArea`) |
| `channel/` | Launch kit: names, bios, descriptions, image prompts, upload templates, rendered logo + banner |

## Sources (EP004)

- Reinfeldt, Östli, Håkansson & Stenfelt (2010). *Hearing one's own voice during phoneme vocalization: Transmission by air and bone conduction.* J. Acoust. Soc. Am. 128(2), 751–762.
- The occlusion effect: blocking the ear canal boosts the low-frequency, bone-conducted part of your own voice.
- The two "Hey, I'm Pip" lines are an EQ dramatisation (bass-boosted vs. high-passed), not a measurement.

## Sources (EP003)

- Yang, Lee, Chan, Martin, Edwards, Carver & Hu (2021). *Intestines of non-uniform stiffness mold the corners of wombat feces.* Soft Matter 17, 475–488.
- Yang & Hu: balloon tests of wombat intestines (APS Division of Fluid Dynamics, 2018).
- 2019 Ig Nobel Prize in Physics.

## Sources (EP001)

- Blakemore, Wolpert & Frith (1998). *Central cancellation of self-produced tickle sensation.* Nature Neuroscience 1, 635–640.
- Blakemore, Frith & Wolpert (1999). *Spatio-temporal prediction modulates the perception of self-produced stimuli.* Journal of Cognitive Neuroscience 11, 551–559.

## Licensing notes

- Remotion is free for individuals and companies of up to 3 people; larger teams need a company license (remotion.dev/license).
- Fonts: Fredoka and Bricolage Grotesque (SIL Open Font License).
- Voice: ElevenLabs library voice; commercial use is covered by a paid ElevenLabs plan.
