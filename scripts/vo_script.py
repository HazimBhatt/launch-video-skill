"""Generate a timed, copy-paste Voiceover Script for external TTS / ElevenLabs / Studio voice artists.

  node scripts/py.mjs scripts/vo_script.py <project>

Reads script.json + data/lines.json and writes:
  data/voiceover-script.md      (Timestamped table + WPM check + delivery notes)
  renders/voiceover-script.txt  (Clean script ready to paste into ElevenLabs / TTS)
"""
import argparse, json
from pathlib import Path


def fmt_ts(sec):
    m, s = divmod(max(0.0, float(sec)), 60.0)
    return f'{int(m):02d}:{s:04.1f}'


def export_vo_script(project_dir):
    P = Path(project_dir)
    S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
    lj_path = P / 'data/lines.json'
    lj = json.loads(lj_path.read_text(encoding='utf-8')) if lj_path.exists() else {}
    lines_timing = lj.get('lines', [])
    dur = float(lj.get('duration', 0.0))
    title = S.get('title', P.name)
    bpm = S.get('bpm', 124)
    music = S.get('music', 'none')

    rows = []
    clean_chunks = []
    total_words = 0
    prev_end = None

    for i, sln in enumerate(S.get('lines', [])):
        spoken = (sln.get('vo') or sln.get('text') or '').strip()
        if not spoken:
            continue
        words_n = len([w for w in spoken.split() if w.strip()])
        total_words += words_n

        if i < len(lines_timing):
            st = float(lines_timing[i]['start'])
            en = float(lines_timing[i]['end'])
        else:
            st = float(i) * 2.5
            en = st + 2.2
        win = max(0.2, en - st)
        wpm = round((words_n / win) * 60)

        gap_before = round(st - prev_end, 2) if prev_end is not None else round(st, 2)
        if clean_chunks and gap_before >= 0.45:
            clean_chunks.append(f'... ({gap_before:.1f}s pause)')
        clean_chunks.append(spoken)
        prev_end = en

        note = (sln.get('cueNote') or sln.get('visual') or '').strip()
        warn = ' [tight]' if wpm > 185 else ''
        rows.append(
            f"| `B{i+1:02d}` | `{fmt_ts(st)}` -> `{fmt_ts(en)}` | {win:.1f}s | {words_n}w (~{wpm} WPM{warn}) | {spoken} | {note} |"
        )

    avg_wpm = round((total_words / max(1.0, dur)) * 60) if dur > 0 else 135
    paste_block = '\n'.join(clean_chunks)

    md = f"""# Voiceover Script — {title}

- **Total Video Runtime:** `{dur:.2f}s` (`@ {bpm} BPM`)
- **Video Audio Layer:** `{"Tactile SFX only (no music)" if str(music) == "none" else f"Music ({music}) + SFX"}`
- **Total Word Count:** `{total_words} words` (~`{avg_wpm} WPM` including visual pauses)
- **Recommended Delivery:** Crisp, confident, conversational builder tone (~135-150 WPM). Leave natural breaths on pauses so every visual cut lands cleanly.

---

## Clean Copy-Paste Script (For ElevenLabs / External Voice Platform)

```text
{paste_block}
```

---

## Cue-by-Cue Sync Sheet

| Beat | Time Window | Duration | Pacing | Spoken Line | On-Screen Visual Moment |
| :--- | :--- | :--- | :--- | :--- | :--- |
{chr(10).join(rows)}

> **Tip:** Once you download your generated voice track (`vo.mp3` / `vo.wav`), drop it straight onto the video timeline at `00:00.0` in your editor — or run `node scripts/py.mjs scripts/words.py . --audio path/to/vo.mp3` inside the project to mux & inspect aligned timing.
"""
    (P / 'data').mkdir(exist_ok=True)
    (P / 'renders').mkdir(exist_ok=True)
    (P / 'data/voiceover-script.md').write_text(md, encoding='utf-8')
    (P / 'renders/voiceover-script.txt').write_text(paste_block + '\n', encoding='utf-8')
    return P / 'data/voiceover-script.md', P / 'renders/voiceover-script.txt', total_words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project')
    a = ap.parse_args()
    md_path, txt_path, words_n = export_vo_script(a.project)
    print(f'{md_path} + {txt_path} ({words_n} words)')


if __name__ == '__main__':
    main()
