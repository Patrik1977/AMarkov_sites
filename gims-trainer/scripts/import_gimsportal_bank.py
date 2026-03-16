#!/usr/bin/env python3
"""Import question bank with media from gimsportal.online into offline trainer.

Usage:
  GIMS_PORTAL_PHONE='+7985...' GIMS_PORTAL_PASSWORD='***' \
    python3 scripts/import_gimsportal_bank.py

Optional envs:
  GIMS_PORTAL_MAX_PAGES=50            # limit per test for smoke
  GIMS_PORTAL_TEST_IDS=129,132,133    # process only selected test ids
"""

from __future__ import annotations

import html
import json
import os
import re
import ssl
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib import parse, request
from urllib.error import HTTPError, URLError
from http.cookiejar import CookieJar

BASE = "https://gimsportal.online"
LOGIN_URL = f"{BASE}/lk/lections/testing/test-1.php?login=yes"
LOGIN_BACKURL = "/lk/lections/testing/test-1.php"

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
IMAGES_DIR = ROOT / "assets" / "images" / "questions"
OUT_JS = DATA_DIR / "questions-gimsportal.js"
OUT_REPORT = DATA_DIR / "gimsportal-import-report.json"
OUT_MANIFEST = DATA_DIR / "question-media-manifest.js"
EXISTING_BANK_JS = DATA_DIR / "questions-gims-exams.js"

TESTS = [
    {
        "course_id": 59,
        "test_id": 129,
        "section": "area",
        "vesselType": None,
        "area": "inland-waterways",
        "topic": "Район плавания - ВВП",
        "subtopic": "Тренировочный банк gimsportal.online",
        "tag": "area-vvp",
    },
    {
        "course_id": 59,
        "test_id": 132,
        "section": "type",
        "vesselType": "jetski",
        "area": None,
        "topic": "Гидроцикл",
        "subtopic": "Тренировочный банк gimsportal.online",
        "tag": "type-jetski",
    },
    {
        "course_id": 59,
        "test_id": 133,
        "section": "type",
        "vesselType": "motor",
        "area": None,
        "topic": "Маломерное моторное судно",
        "subtopic": "Тренировочный банк gimsportal.online",
        "tag": "type-motor",
    },
]

RE_TOTAL = re.compile(r"Вопрос<br\s*/?>\s*(\d+)\s*из\s*(\d+)", re.S | re.I)
RE_HIDDEN = re.compile(r'name="([^"]+)"[^>]*value="([^"]*)"', re.I)
RE_OPTION = re.compile(
    r'<input[^>]+name="answer"[^>]+value="([^"]+)"[^>]*>\s*&nbsp;\s*<span[^>]*>(.*?)</span>',
    re.S | re.I,
)
RE_CORRECT = re.compile(
    r'<div[^>]+id="learn-test-message"[^>]*>.*?Правильный ответ:\s*(.*?)</span>',
    re.S | re.I,
)
RE_QUESTION_BLOCK = re.compile(
    r'<div class="learn-question-name"[^>]*>(.*?)</div>\s*</div>\s*[\r\n\t ]*<!-- сам вопрос -->',
    re.S | re.I,
)
RE_SPAN = re.compile(r"<span[^>]*>(.*?)</span>", re.S | re.I)
RE_IMG_SRC = re.compile(r'<img[^>]+src="([^"]+)"', re.S | re.I)


class AuthExpired(RuntimeError):
    pass


def log(msg: str) -> None:
    print(msg, flush=True)


def is_auth_page(html_text: str) -> bool:
    return (
        "Авторизация в личный кабинет ученика" in html_text
        and 'name="form_auth"' in html_text
    )


def clean_html_text(value: str) -> str:
    if value is None:
        return ""
    text = value
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def norm_prompt(value: str) -> str:
    out = clean_html_text(value).lower().replace("ё", "е")
    out = re.sub(r"\s+", " ", out).strip()
    return out


def norm_answer(value: str) -> str:
    out = norm_prompt(value)
    out = out.replace('"', "").replace("«", "").replace("»", "")
    out = re.sub(r"[^0-9a-zа-я]+", "", out)
    return out


def create_opener() -> request.OpenerDirector:
    jar = CookieJar()
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    opener = request.build_opener(
        request.HTTPCookieProcessor(jar),
        request.HTTPSHandler(context=ssl_ctx),
    )
    opener.addheaders = [
        (
            "User-Agent",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        ),
        ("Accept-Language", "ru,en;q=0.8"),
        ("Connection", "close"),
    ]
    return opener


def fetch_text(
    opener: request.OpenerDirector,
    url: str,
    data: Optional[Dict[str, str]] = None,
    tries: int = 4,
    timeout: int = 35,
) -> str:
    payload = None
    headers = {}
    if data is not None:
        payload = parse.urlencode(data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    last_error = None
    for attempt in range(1, tries + 1):
        try:
            req = request.Request(url, data=payload, headers=headers)
            with opener.open(req, timeout=timeout) as resp:
                raw = resp.read()
            return raw.decode("utf-8", errors="ignore")
        except (HTTPError, URLError, TimeoutError, ssl.SSLError) as err:
            last_error = err
            time.sleep(min(1.2 * attempt, 4))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def fetch_bytes(
    opener: request.OpenerDirector,
    url: str,
    tries: int = 4,
    timeout: int = 35,
) -> bytes:
    last_error = None
    for attempt in range(1, tries + 1):
        try:
            req = request.Request(url)
            with opener.open(req, timeout=timeout) as resp:
                return resp.read()
        except (HTTPError, URLError, TimeoutError, ssl.SSLError) as err:
            last_error = err
            time.sleep(min(1.2 * attempt, 4))
    raise RuntimeError(f"Failed to download {url}: {last_error}")


def login(opener: request.OpenerDirector, phone: str, password: str) -> None:
    html_text = fetch_text(
        opener,
        LOGIN_URL,
        data={
            "AUTH_FORM": "Y",
            "TYPE": "AUTH",
            "USER_REMEMBER": "Y",
            "backurl": LOGIN_BACKURL,
            "USER_PHONE": phone,
            "USER_PASSWORD": password,
        },
    )
    if "Неверный логин или пароль" in html_text:
        raise RuntimeError("Login failed: wrong phone/password")
    if "h-auth__exit" not in html_text and "logout=yes" not in html_text:
        raise RuntimeError("Login failed: no authenticated markers in response")


def parse_total_questions(html_text: str) -> int:
    m = RE_TOTAL.search(html_text)
    if not m:
        raise RuntimeError("Cannot parse total questions from start page")
    return int(m.group(2))


def parse_page(html_text: str) -> Dict[str, object]:
    if is_auth_page(html_text):
        raise AuthExpired("auth-required")

    info: Dict[str, object] = {
        "prompt": "",
        "options": [],
        "option_ids": [],
        "image_src": None,
        "hidden": {},
        "current": None,
        "total": None,
    }

    m_total = RE_TOTAL.search(html_text)
    if m_total:
        info["current"] = int(m_total.group(1))
        info["total"] = int(m_total.group(2))

    hidden = {}
    for name, value in RE_HIDDEN.findall(html_text):
        hidden[name] = html.unescape(value)
    info["hidden"] = hidden

    m_block = RE_QUESTION_BLOCK.search(html_text)
    if not m_block:
        raise RuntimeError("Question block not found")
    q_block = m_block.group(1)

    m_span = RE_SPAN.search(q_block)
    if not m_span:
        raise RuntimeError("Question prompt not found")
    info["prompt"] = clean_html_text(m_span.group(1))

    m_img = RE_IMG_SRC.search(q_block)
    if m_img:
        info["image_src"] = html.unescape(m_img.group(1).strip())

    options = []
    option_ids = []
    for opt_id, opt_text_html in RE_OPTION.findall(html_text):
        option_ids.append(opt_id.strip())
        options.append(clean_html_text(opt_text_html))
    info["options"] = options
    info["option_ids"] = option_ids

    if len(options) < 2:
        raise RuntimeError("Parsed less than 2 options")

    return info


def parse_correct_text(answered_html: str) -> Optional[str]:
    if is_auth_page(answered_html):
        raise AuthExpired("auth-required")
    m = RE_CORRECT.search(answered_html)
    if not m:
        return None
    return clean_html_text(m.group(1))


def resolve_correct_index(options: List[str], correct_text: str) -> Optional[int]:
    if not options or not correct_text:
        return None

    target_hard = norm_answer(correct_text)
    if target_hard:
        for idx, option in enumerate(options):
            if norm_answer(option) == target_hard:
                return idx

    target_soft = norm_prompt(correct_text)
    if target_soft:
        for idx, option in enumerate(options):
            opt_soft = norm_prompt(option)
            if opt_soft == target_soft:
                return idx
            if len(target_soft) >= 5 and (target_soft in opt_soft or opt_soft in target_soft):
                return idx
    return None


def load_existing_explanations(path: Path) -> Dict[str, Dict[str, object]]:
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    m = re.search(r"var imported = (\[.*\]);\s*var existing", text, re.S)
    if not m:
        return {}
    try:
        arr = json.loads(m.group(1))
    except json.JSONDecodeError:
        return {}

    mapping: Dict[str, Dict[str, object]] = {}
    for item in arr:
        prompt = norm_prompt(item.get("prompt", ""))
        if not prompt:
            continue
        mapping[prompt] = {
            "correctIndex": item.get("correctIndex"),
            "explanationShort": item.get("explanationShort") or "",
            "explanationLong": item.get("explanationLong") or "",
            "whyWrongOptions": item.get("whyWrongOptions") or [],
        }
    return mapping


def download_image(
    opener: request.OpenerDirector,
    image_src: str,
    file_stem: str,
    image_cache: Dict[str, str],
) -> Optional[str]:
    if not image_src:
        return None

    absolute = parse.urljoin(BASE, image_src)
    if absolute in image_cache:
        return image_cache[absolute]

    parsed = parse.urlparse(absolute)
    ext = Path(parsed.path).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}:
        ext = ".jpg"

    filename = f"{file_stem}{ext}"
    rel_path = f"assets/images/questions/{filename}"
    dst = IMAGES_DIR / filename
    if not dst.exists():
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        content = fetch_bytes(opener, absolute)
        dst.write_bytes(content)
    image_cache[absolute] = rel_path
    return rel_path


def build_why_wrong(options: List[str], correct_index: int) -> List[Dict[str, object]]:
    result = []
    for idx, _ in enumerate(options):
        if idx == correct_index:
            continue
        result.append(
            {
                "index": idx,
                "text": "Этот вариант не совпадает с правильным ответом для данного вопроса.",
            }
        )
    return result


def collect_test_questions(
    opener: request.OpenerDirector,
    meta: Dict[str, object],
    existing_map: Dict[str, Dict[str, object]],
    phone: str,
    password: str,
    max_pages: Optional[int] = None,
) -> Tuple[List[Dict[str, object]], Dict[str, object]]:
    course_id = meta["course_id"]
    test_id = meta["test_id"]

    start_url = f"{BASE}/lk/lections/testing/test.php?COURSE_ID={course_id}&TEST_ID={test_id}"

    start_html = fetch_text(
        opener,
        start_url,
        data={
            "COURSE_ID": str(course_id),
            "ID": str(test_id),
            "next": "Начать",
        },
    )
    if is_auth_page(start_html):
        login(opener, phone, password)
        start_html = fetch_text(
            opener,
            start_url,
            data={
                "COURSE_ID": str(course_id),
                "ID": str(test_id),
                "next": "Начать",
            },
        )

    total = parse_total_questions(start_html)
    effective_total = min(total, max_pages) if max_pages else total
    log(f"[test {test_id}] pages: {total}, processing: {effective_total}")

    collected: List[Dict[str, object]] = []
    image_cache: Dict[str, str] = {}
    consecutive_failures = 0
    stats = {
        "course_id": course_id,
        "test_id": test_id,
        "total": total,
        "processed": effective_total,
        "collected": 0,
        "with_media": 0,
        "correct_from_message": 0,
        "correct_from_existing": 0,
        "correct_fallback_zero": 0,
        "errors": [],
    }

    for page in range(1, effective_total + 1):
        page_url = f"{BASE}/lk/lections/testing/test.php?COURSE_ID={course_id}&TEST_ID={test_id}&PAGE={page}"

        if page == 1 or page % 20 == 0 or consecutive_failures >= 3:
            login(opener, phone, password)
            consecutive_failures = 0

        success = False
        last_err = None

        for page_try in range(1, 4):
            try:
                page_html = fetch_text(opener, page_url)
                parsed_page = parse_page(page_html)

                options = parsed_page["options"]  # type: ignore[assignment]
                option_ids = parsed_page["option_ids"]  # type: ignore[assignment]
                hidden = parsed_page["hidden"]  # type: ignore[assignment]
                prompt = parsed_page["prompt"]  # type: ignore[assignment]

                if not options or not option_ids:
                    raise RuntimeError("No options parsed")

                check_html = fetch_text(
                    opener,
                    start_url,
                    data={
                        "sessid": str(hidden.get("sessid", "")),
                        "TEST_RESULT": str(hidden.get("TEST_RESULT", "")),
                        "PAGE": str(hidden.get("PAGE", "")),
                        "answer": str(option_ids[0]),
                        "ANSWERED": "Y",
                        "next": "Далее",
                    },
                )
                correct_text = parse_correct_text(check_html) or ""
                correct_index = resolve_correct_index(options, correct_text)
                if correct_index is not None:
                    stats["correct_from_message"] += 1

                existing = existing_map.get(norm_prompt(prompt), {})
                if correct_index is None and isinstance(existing.get("correctIndex"), int):
                    candidate = int(existing["correctIndex"])
                    if 0 <= candidate < len(options):
                        correct_index = candidate
                        stats["correct_from_existing"] += 1

                if correct_index is None:
                    correct_index = 0
                    stats["correct_fallback_zero"] += 1

                image_src = parsed_page.get("image_src")
                media_obj = None
                if isinstance(image_src, str) and image_src.strip():
                    stem = f"gimsportal-c{course_id}-t{test_id}-p{page:04d}"
                    rel_media = download_image(opener, image_src.strip(), stem, image_cache)
                    if rel_media:
                        media_obj = {
                            "type": "image",
                            "src": rel_media,
                            "alt": str(prompt),
                        }
                        stats["with_media"] += 1

                explanation_short = f"Правильный ответ по gimsportal.online: {correct_text or options[correct_index]}."
                explanation_long = explanation_short
                if existing:
                    ex_short = str(existing.get("explanationShort") or "").strip()
                    ex_long = str(existing.get("explanationLong") or "").strip()
                    if ex_short:
                        explanation_short = ex_short
                    if ex_long:
                        explanation_long = ex_long
                    elif ex_short:
                        explanation_long = ex_short

                why_wrong = build_why_wrong(options, correct_index)
                existing_why = existing.get("whyWrongOptions")
                if isinstance(existing_why, list):
                    valid = []
                    for row in existing_why:
                        if (
                            isinstance(row, dict)
                            and isinstance(row.get("index"), int)
                            and 0 <= row["index"] < len(options)
                            and row["index"] != correct_index
                        ):
                            valid.append({"index": row["index"], "text": str(row.get("text") or "").strip()})
                    if valid:
                        why_wrong = valid

                question = {
                    "id": f"gimsportal-{course_id}-{test_id}-{page}",
                    "source": f"gimsportal.online:{course_id}:{test_id}:{page}",
                    "section": meta["section"],
                    "vesselType": meta["vesselType"],
                    "area": meta["area"],
                    "topic": meta["topic"],
                    "subtopic": meta["subtopic"],
                    "difficulty": "medium",
                    "prompt": prompt,
                    "options": options,
                    "correctIndex": correct_index,
                    "explanationShort": explanation_short,
                    "explanationLong": explanation_long,
                    "whyWrongOptions": why_wrong,
                    "tags": [
                        "imported",
                        "gimsportal",
                        f"course-{course_id}",
                        f"test-{test_id}",
                        str(meta["tag"]),
                    ],
                }
                if media_obj:
                    question["media"] = media_obj

                collected.append(question)
                stats["collected"] += 1
                consecutive_failures = 0
                success = True
                break
            except AuthExpired:
                login(opener, phone, password)
                last_err = "auth-required"
                continue
            except Exception as err:  # pylint: disable=broad-except
                last_err = err
                time.sleep(0.8 * page_try)
                continue

        if not success:
            consecutive_failures += 1
            msg = f"page {page}: {last_err}"
            stats["errors"].append(msg)
            log(f"[test {test_id}] WARN {msg}")

        if page % 25 == 0 or page == effective_total:
            log(f"[test {test_id}] {page}/{effective_total}")
        time.sleep(0.03)

    return collected, stats


def write_bank_js(questions: List[Dict[str, object]]) -> None:
    payload = json.dumps(questions, ensure_ascii=False, separators=(",", ":"))
    content = (
        "(function attachGimsPortalBank(global){\n"
        f"  var imported = {payload};\n"
        "  var existing = Array.isArray(global.QuestionBankOfficialData) ? global.QuestionBankOfficialData : [];\n"
        "  global.QuestionBankOfficialData = imported.concat(existing);\n"
        "})(window);\n"
    )
    OUT_JS.write_text(content, encoding="utf-8")


def write_manifest_js() -> int:
    files = []
    if IMAGES_DIR.exists():
        for path in IMAGES_DIR.rglob("*"):
            if path.is_file():
                rel = path.relative_to(ROOT).as_posix()
                files.append(rel)
    files = sorted(set(files))
    payload = json.dumps(files, ensure_ascii=False, indent=2)
    content = (
        "(function attachQuestionMediaManifest(global) {\n"
        f"  global.QuestionMediaManifest = {payload};\n"
        "})(window);\n"
    )
    OUT_MANIFEST.write_text(content, encoding="utf-8")
    return len(files)


def parse_selected_test_ids() -> Optional[set]:
    raw = os.getenv("GIMS_PORTAL_TEST_IDS", "").strip()
    if not raw:
        return None
    out = set()
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        if part.isdigit():
            out.add(int(part))
    return out or None


def main() -> int:
    phone = os.getenv("GIMS_PORTAL_PHONE", "").strip()
    password = os.getenv("GIMS_PORTAL_PASSWORD", "").strip()
    if not phone or not password:
        log("Set env vars GIMS_PORTAL_PHONE and GIMS_PORTAL_PASSWORD")
        return 2

    max_pages_env = os.getenv("GIMS_PORTAL_MAX_PAGES", "").strip()
    max_pages = int(max_pages_env) if max_pages_env.isdigit() and int(max_pages_env) > 0 else None
    selected_test_ids = parse_selected_test_ids()

    existing_map = load_existing_explanations(EXISTING_BANK_JS)
    opener = create_opener()

    log("Login...")
    login(opener, phone, password)
    log("Login OK")

    all_questions: List[Dict[str, object]] = []
    test_reports: List[Dict[str, object]] = []

    tests_to_run = [
        t for t in TESTS if selected_test_ids is None or int(t["test_id"]) in selected_test_ids
    ]

    for meta in tests_to_run:
        q_list, report = collect_test_questions(
            opener,
            meta,
            existing_map,
            phone,
            password,
            max_pages=max_pages,
        )
        all_questions.extend(q_list)
        test_reports.append(report)

    deduped = []
    seen = set()
    for row in all_questions:
        key = (
            row.get("section"),
            row.get("vesselType"),
            row.get("area"),
            norm_prompt(str(row.get("prompt") or "")),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)

    write_bank_js(deduped)
    manifest_count = write_manifest_js()

    report = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "tests": test_reports,
        "totalCollectedRaw": len(all_questions),
        "totalAfterScopedDedupe": len(deduped),
        "mediaManifestCount": manifest_count,
        "outputFile": str(OUT_JS.relative_to(ROOT)),
    }
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    log(f"Done. questions={len(deduped)} manifest={manifest_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
