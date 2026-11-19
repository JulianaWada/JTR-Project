"""
Makes the narration for the animated lessons with Microsoft's Nigerian English voice "Ezinne"
(en-NG-EzinneNeural, through the free edge-tts package). One MP3 per narration step:
  academy/public/lessons/<course>/<lesson>/step-01.mp3, step-02.mp3, ...
Run from the academy folder:  pip install edge-tts  then  python scripts/lesson-voice/make_voice.py [lesson numbers]
The lines come from scripts/lesson-voice/lines.json (refresh it with: npx tsx scripts/lesson-voice/export-lines.ts > scripts/lesson-voice/lines.json).
"""
import asyncio, json, os, sys
import edge_tts

VOICE = "en-NG-EzinneNeural"
RATE = "-4%"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))


async def main(only):
    lines = json.load(open(os.path.join(HERE, "lines.json"), encoding="utf-8"))
    for course, lessons in lines.items():
        for lesson, steps in lessons.items():
            if only and lesson not in only:
                continue
            out = os.path.join(ROOT, "public", "lessons", course, lesson)
            os.makedirs(out, exist_ok=True)
            for i, text in enumerate(steps, 1):
                path = os.path.join(out, f"step-{i:02d}.mp3")
                for attempt in range(4):
                    try:
                        await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
                        break
                    except Exception as e:  # network hiccup: try again
                        print("retry", path, e)
                        await asyncio.sleep(2 + attempt * 3)
                print(path)


asyncio.run(main(sys.argv[1:]))
