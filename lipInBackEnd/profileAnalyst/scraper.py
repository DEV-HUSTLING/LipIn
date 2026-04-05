from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
import json
import time
import random
import argparse
import os
import datetime
import threading

load_dotenv()

if os.getenv("FLY_APP_NAME"):
    SESSION_FILE = "/data/linkedin_session.json"
else:
    SESSION_FILE = os.path.join(os.path.dirname(__file__), "linkedin_session.json")


def _env_flag(name: str, default: bool = True) -> bool:
    v = (os.getenv(name) or "").strip().lower()
    if v in ("0", "false", "no", "off"):
        return False
    if v in ("1", "true", "yes", "on"):
        return True
    return default


USE_SESSION_FILE = _env_flag("LINKEDIN_USE_SESSION_FILE", True)


def _filter_storage_state_linkedin_only(state: dict) -> dict:
    cookies = []
    for c in state.get("cookies") or []:
        dom = (c.get("domain") or "").lower().lstrip(".")
        if dom == "linkedin.com" or dom.endswith(".linkedin.com"):
            cookies.append(c)
    origins = []
    for o in state.get("origins") or []:
        origin = (o.get("origin") or "").lower()
        if "linkedin.com" in origin:
            origins.append(o)
    return {"cookies": cookies, "origins": origins}


def _save_linkedin_session(context) -> None:
    raw = context.storage_state()
    filtered = _filter_storage_state_linkedin_only(raw)
    if not filtered.get("cookies"):
        filtered = raw
    os.makedirs(os.path.dirname(SESSION_FILE) or ".", exist_ok=True)
    with open(SESSION_FILE, "w", encoding="utf-8") as f:
        json.dump(filtered, f)


_SCRAPE_SEMAPHORE = threading.Semaphore(3)

BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-infobars",
    "--disable-dev-shm-usage",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

VIEWPORT = {"width": 1920, "height": 1080}


def _random_delay(min_s=1.0, max_s=3.0):
    time.sleep(random.uniform(min_s, max_s))


def _scroll_to_bottom(page):
    prev_height = 0
    for _ in range(20):
        page.evaluate("window.scrollBy(0, 600)")
        time.sleep(random.uniform(0.4, 0.8))
        curr_height = page.evaluate("document.body.scrollHeight")
        if curr_height == prev_height:
            break
        prev_height = curr_height
    page.evaluate("window.scrollTo(0, 0)")
    time.sleep(0.5)


def _click_see_more(page, selector):
    try:
        btn = page.locator(selector).first
        if btn.is_visible(timeout=2000):
            btn.click()
            _random_delay(0.5, 1.0)
    except Exception:
        pass


def _expand_see_more_in_main(page, max_clicks: int = 12):
    for _ in range(max_clicks):
        clicked = page.evaluate("""
            () => {
                const badHref = (h) => {
                    if (!h) return false;
                    const u = h.toLowerCase();
                    return u.includes('/details/') || u.includes('/overlay/')
                        || u.includes('/analytics') || u.includes('/dashboard')
                        || u.includes('/feed/') || u.includes('/premium/')
                        || u.includes('/mynetwork/') || u.includes('recent-activity')
                        || u.includes('/safety/go');
                };
                const main = document.querySelector('main');
                // SDUI About card expandable controls
                const aboutSec = main && (
                    main.querySelector('section[componentkey*="About"]')
                    || [...main.querySelectorAll('section')].find((s) => {
                        const h2 = s.querySelector('h2');
                        const ht = ((h2 && h2.innerText) || '').trim();
                        return /^about$/i.test(ht);
                    })
                );
                if (aboutSec) {
                    const btn = aboutSec.querySelector('[data-testid="expandable-text-button"]');
                    if (btn && btn.offsetParent !== null) {
                        btn.click();
                        return true;
                    }
                }
                const root = main || document.body;
                const candidates = root.querySelectorAll(
                    'button, [role="button"], span.artdeco-button__text, a'
                );
                for (const el of candidates) {
                    if (el.tagName === 'A' && badHref(el.getAttribute('href'))) continue;
                    const t = (el.innerText || el.textContent || '').trim().toLowerCase();
                    if (!t || t.length > 80) continue;
                    if (t === 'see more' || t === 'show more' || t.startsWith('see more')
                        || t.startsWith('show more') || t.includes('…see more')) {
                        el.click();
                        return true;
                    }
                }
                return false;
            }
        """)
        if not clicked:
            break
        time.sleep(random.uniform(0.35, 0.7))


# ──────────────────────────────────────────────
# Auto Login
# ──────────────────────────────────────────────

def _login_with_credentials(page) -> bool:
    email = os.getenv("LINKEDIN_EMAIL")
    password = os.getenv("LINKEDIN_PASSWORD")

    if not email or not password:
        raise RuntimeError(
            "LINKEDIN_EMAIL and LINKEDIN_PASSWORD must be set in your .env file "
            "or as environment variables."
        )

    page.set_default_timeout(30_000)
    page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
    _random_delay(1.5, 2.5)

    page.fill("#username", email)
    _random_delay(0.5, 1.0)
    page.fill("#password", password)
    _random_delay(0.5, 1.0)
    page.click('button[type="submit"]')

    page.wait_for_load_state("load")
    _random_delay(2.0, 3.5)

    current_url = page.url.lower()

    if any(x in current_url for x in ["/checkpoint", "/challenge", "/verify"]):
        print(
            "Auto-login blocked: LinkedIn is asking for manual verification.\n"
            "Run: python scraper.py --setup  to log in manually."
        )
        return False

    if any(x in current_url for x in ["/login", "/signup"]):
        print(
            "Auto-login failed: still on login page.\n"
            "Check LINKEDIN_EMAIL and LINKEDIN_PASSWORD in your .env file."
        )
        return False

    if "/feed" in current_url or "linkedin.com" in current_url:
        return True

    print(f"Auto-login: unexpected URL after login — {page.url}")
    return False


def auto_login() -> bool:
    print("Auto-login: starting...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=BROWSER_ARGS)
        context = browser.new_context(user_agent=USER_AGENT, viewport=VIEWPORT)
        try:
            page = context.new_page()
            ok = _login_with_credentials(page)
            if ok and USE_SESSION_FILE:
                _save_linkedin_session(context)
                print(f"Auto-login: LinkedIn session saved to {SESSION_FILE}")
            elif ok:
                print("Auto-login: success (LINKEDIN_USE_SESSION_FILE=0 — no session file written)")
            return ok
        finally:
            context.close()
            browser.close()


# ──────────────────────────────────────────────
# Extractors
# ──────────────────────────────────────────────

def _extract_basic_info(page):
    """
    Extract name, headline, location, profile picture, connections, followers.
    
    FIX: LinkedIn SDUI now uses h2 (not h1) for the display name in the top card.
    FIX: Profile picture lives inside a[href*='/in/'] > figure > img (SDUI anchor structure).
    FIX: Connections are in a[href*='mynetwork/invite-connect/connections'] — already correct,
         but we now also fall back to the activity section follower count text.
    """
    data = {
        "name": None,
        "headline": None,
        "location": None,
        "profile_picture_url": None,
        "connections": None,
        "followers": 0,
    }

    js_data = page.evaluate("""
        () => {
            const result = {
                name: null,
                headline: null,
                location: null,
                profile_picture_url: null,
                connections: null,
                followers: 0,
            };

            const main = document.querySelector('main');
            if (!main) return result;

            const badName = (t) => {
                if (!t || t.length < 2 || t.length > 120) return true;
                const l = t.toLowerCase().replace(/\\s+/g, ' ');
                if (/^(linkedin|profile|sign|join)\\b/i.test(t)) return true;
                if (/^about\\b|^experience\\b|^education\\b|^skills\\b|^activity\\b/i.test(l)) return true;
                if (/skills?\\s*all|^top skills|^industry knowledge|^tools\\s*&|^interpersonal/i.test(l)) return true;
                if (/\\d+\\s+connections?/.test(t)) return true;
                return false;
            };

            // ── FIX: SDUI top card uses componentkey*="Topcard" ──
            let topCard =
                main.querySelector('section[componentkey*="Topcard"]') ||
                main.querySelector('section[componentkey*="topcard"]');

            if (!topCard) {
                // Fallback: find section that contains the profile photo anchor
                const photoAnchor = main.querySelector('a[aria-label="Profile photo"]');
                if (photoAnchor) topCard = photoAnchor.closest('section') || photoAnchor.closest('div');
            }
            if (!topCard) topCard = main.querySelector('section') || main;

            // ── FIX: SDUI uses h2 for the name, not h1 ──
            // Prefer h2 inside the topcard first, then h1 as legacy fallback.
            const nameHeading =
                topCard.querySelector('h2') ||
                topCard.querySelector('h1');

            if (nameHeading) {
                const nameText = (nameHeading.innerText || nameHeading.textContent || '').trim();
                if (!badName(nameText)) result.name = nameText;
            }

            // Fallback: check anchor text inside /in/ links within topcard
            if (!result.name) {
                const link = topCard.querySelector('a[href*="/in/"] h2, a[href*="/in/"] h1');
                if (link) {
                    const nt = (link.innerText || link.textContent || '').trim();
                    if (!badName(nt)) result.name = nt;
                }
            }

            const skipHeadline = (t) => {
                if (!t || t.length < 3 || t.length > 500) return true;
                const lower = t.toLowerCase();
                if (result.name && t === result.name) return true;
                if (/^(she|he|they)\\/(her|him|them)$/i.test(t)) return true;
                if (/\\d[\\d,+]*\\s*connections?/i.test(t)) return true;
                if (/\\d[\\d,]*\\s*followers?/i.test(t)) return true;
                if (/^following\\b/i.test(lower)) return true;
                if (/^message\\b|^connect\\b|^follow\\b|^more\\s+profiles|^open to\\b|^add section/i.test(lower)) return true;
                if (/^contact info$/i.test(lower)) return true;
                if (/·\\s*present\\b/i.test(lower) && t.length < 80) return true;
                // FIX: Skip pronouns row (She/Her, He/Him, They/Them)
                if (/^(she|he|they)\\b/i.test(lower) && t.length < 20) return true;
                return false;
            };

            const titleEl = nameHeading;
            let foundTitle = false;
            const headlineSelectors =
                'h1, h2, p, .text-body-medium, [class*="text-body-medium"], p.break-words, div.break-words';
            for (const el of topCard.querySelectorAll(headlineSelectors)) {
                if (el === titleEl) {
                    foundTitle = true;
                    continue;
                }
                if (titleEl && el.contains(titleEl)) continue;
                if (titleEl && !foundTitle) continue;
                const line = (el.innerText || '').split('\\n').map(s => s.trim()).filter(Boolean)[0] || '';
                if (skipHeadline(line)) continue;
                result.headline = line;
                break;
            }

            if (!result.headline && titleEl) {
                let el = titleEl.nextElementSibling;
                let steps = 0;
                while (el && steps < 16) {
                    const t = (el.innerText || '').split('\\n').map(s => s.trim()).filter(Boolean)[0] || '';
                    if (!skipHeadline(t)) {
                        result.headline = t;
                        break;
                    }
                    el = el.nextElementSibling;
                    steps++;
                }
            }

            const cardLines = (topCard.innerText || '')
                .split(String.fromCharCode(10))
                .map(l => l.trim())
                .filter(l => l.length > 0);

            if (!result.name) {
                for (const line of cardLines) {
                    if (badName(line)) continue;
                    if (line.includes('@')) continue;
                    if (/connections?|followers?|message|connect|contact info/i.test(line)) continue;
                    if (/^\\d+$/.test(line)) continue;
                    result.name = line;
                    break;
                }
            }

            if (!result.headline && result.name) {
                let after = false;
                for (const line of cardLines) {
                    if (line === result.name) { after = true; continue; }
                    if (!after) continue;
                    if (/^(she|he|they)\\//i.test(line)) continue;
                    if (/\\d[\\d,+]*\\s*connections?/i.test(line)) continue;
                    if (skipHeadline(line)) continue;
                    if (line.length >= 5 && line.length <= 500) {
                        result.headline = line;
                        break;
                    }
                }
            }

            // Location: look for city/country patterns in the topcard lines
            for (const line of cardLines) {
                const lower = line.toLowerCase();
                if (
                    (lower.includes('india') || lower.includes('united') ||
                     lower.includes('new york') || lower.includes('california') ||
                     lower.includes('london') || lower.includes('states') ||
                     lower.includes(' metropolitan') || lower.includes('area') ||
                     (line.includes(',') && !line.includes('@') && !line.includes('|'))) &&
                    line.length < 120 && line.length > 3 &&
                    !/connections?|followers?/i.test(line)
                ) {
                    result.location = line;
                    break;
                }
            }

            const parseConnections = (blob) => {
                const re = /(\\d[\\d,]*\\+?)\\s+connections?\\b/gi;
                let m;
                while ((m = re.exec(blob)) !== null) {
                    const start = Math.max(0, m.index - 24);
                    const snippet = blob.slice(start, m.index + m[0].length).toLowerCase();
                    if (snippet.includes('mutual')) continue;
                    const raw = m[1].replace(/,/g, '');
                    return raw.includes('+') ? raw : parseInt(raw, 10);
                }
                return null;
            };

            // ── FIX: SDUI connections anchor selector (confirmed from HTML) ──
            const connLink = topCard.querySelector(
                'a[href*="mynetwork/invite-connect/connections"]'
            );
            if (connLink) {
                const lm = (connLink.innerText || connLink.textContent || '').match(
                    /(\\d[\\d,]*\\+?)\\s+connections?/i
                );
                if (lm) {
                    const raw = lm[1].replace(/,/g, '');
                    result.connections = raw.includes('+') ? raw : parseInt(raw, 10);
                }
            }
            if (result.connections == null) {
                result.connections =
                    parseConnections(topCard.innerText) ||
                    parseConnections(main.innerText);
            }

            // Followers: check activity section first (more reliable in SDUI)
            const activitySec = main.querySelector('section[componentkey*="Activity"]');
            const followerSource = activitySec || topCard;
            const fol =
                (followerSource.innerText || '').match(/(\\d[\\d,]*)\\s+followers?\\b/i) ||
                (main.innerText || '').match(/(\\d[\\d,]*)\\s+followers?\\b/i);
            if (fol) {
                result.followers = parseInt(fol[1].replace(/,/g, ''), 10);
            }

            // ── FIX: SDUI profile picture — anchor is a[href*='/in/'] not button ──
            // Structure: section[Topcard] > ... > a[href*="/in/"] > div > figure > img
            // The background/banner image is also present — skip it via aria-label check.
            let imgEl = null;

            // 1. Try the profile photo anchor (most reliable in SDUI)
            const photoAnchor =
                topCard.querySelector('a[aria-label="Profile photo"]') ||
                main.querySelector('a[aria-label="Profile photo"]');
            if (photoAnchor) {
                imgEl = photoAnchor.querySelector('img');
            }

            // 2. Fallback: find figure inside topcard that contains a profile-displayphoto URL
            if (!imgEl) {
                for (const img of topCard.querySelectorAll('figure img')) {
                    const s = img.src || img.currentSrc || '';
                    if (s && !s.startsWith('data:') && s.includes('profile-displayphoto')) {
                        imgEl = img;
                        break;
                    }
                }
            }

            // 3. Legacy class-based fallback
            if (!imgEl) {
                imgEl =
                    topCard.querySelector('img.pv-top-card-profile-picture__image') ||
                    topCard.querySelector('.pv-top-card-profile-picture__container img') ||
                    topCard.querySelector('button[aria-label*="profile picture"] img') ||
                    topCard.querySelector('button[aria-label*="Profile photo"] img');
            }

            if (imgEl) {
                const s = imgEl.src || imgEl.currentSrc;
                // Exclude banner/background images
                if (s && !s.startsWith('data:') &&
                    !s.includes('background') && !s.includes('banner')) {
                    result.profile_picture_url = s;
                }
            }

            return result;
        }
    """)

    data["name"] = js_data.get("name")
    data["headline"] = js_data.get("headline")
    data["location"] = js_data.get("location")
    data["connections"] = js_data.get("connections")
    data["followers"] = js_data.get("followers", 0)
    pic = js_data.get("profile_picture_url")
    if pic:
        data["profile_picture_url"] = pic

    # Final fallback for profile picture via page.evaluate
    if not data["profile_picture_url"]:
        try:
            src = page.evaluate("""
                () => {
                    const main = document.querySelector('main');
                    if (!main) return null;
                    // Walk all imgs; prefer profile-displayphoto URLs
                    for (const img of main.querySelectorAll('img')) {
                        const s = img.src || img.currentSrc;
                        if (!s || s.startsWith('data:')) continue;
                        if (!s.includes('licdn.com') && !s.includes('linkedin.com')) continue;
                        if (s.includes('company-logo') || s.includes('school-logo')) continue;
                        if (s.includes('background') || s.includes('banner') || s.includes('ghost')) continue;
                        if (s.includes('profile-displayphoto') || s.includes('profile-framedphoto')) {
                            return s;
                        }
                    }
                    // Square-ish image fallback
                    for (const img of main.querySelectorAll('img')) {
                        const s = img.src || img.currentSrc;
                        if (!s || s.startsWith('data:')) continue;
                        if (!s.includes('licdn.com')) continue;
                        const w = img.naturalWidth || img.width;
                        const h = img.naturalHeight || img.height;
                        if (w >= 48 && w <= 800 && h >= 48 && h <= 800 &&
                            Math.abs(w - h) < Math.max(w, h) * 0.35) {
                            return s;
                        }
                    }
                    return null;
                }
            """)
            data["profile_picture_url"] = src
        except Exception:
            data["profile_picture_url"] = None

    return data


def _extract_about(page):
    """
    Extract the About section.
    FIX: SDUI uses section[componentkey*='About'] — already targeted correctly.
         Added stripping of the 'Top skills' sub-section that bleeds into about text.
    """
    try:
        about_text = page.evaluate("""
            () => {
                const main = document.querySelector('main');
                if (!main) return null;

                const cleanAbout = (raw) => {
                    let t = (raw || '').trim();
                    t = t.replace(/^About\\s*/i, '').trim();
                    // FIX: Strip "Top skills" block that SDUI appends inside About card
                    t = t.replace(/\\n?Top skills[\\s\\S]*$/i, '').trim();
                    t = t.replace(/\\n\\s*(see more|see less|show more)\\s*/gi, '\\n').trim();
                    t = t.replace(/[…\\.]{1,3}\\s*more\\s*$/i, '').trim();
                    // Strip trailing edit/action buttons text
                    t = t.replace(/\\n?(Edit about|Add about)\\s*$/i, '').trim();
                    return t;
                };

                // ── Primary: SDUI About card ──
                const aboutSdui = main.querySelector('section[componentkey*="About"]');
                if (aboutSdui) {
                    // expandable-text-box holds the actual paragraph
                    const box = aboutSdui.querySelector('[data-testid="expandable-text-box"]');
                    if (box) {
                        const t = cleanAbout(box.innerText || box.textContent || '');
                        if (t.length > 25) return t;
                    }
                    // Fallback to full section text
                    const t2 = cleanAbout(aboutSdui.innerText || '');
                    if (t2.length > 25) return t2;
                }

                // ── Legacy: section with h2 "About" ──
                for (const section of main.querySelectorAll('section')) {
                    const heads = section.querySelectorAll(
                        'h2, h3, h4, .pv-profile-section__card-heading, p[class*="heading"]'
                    );
                    let aboutSection = false;
                    for (const h of heads) {
                        const s = (h.innerText || '').trim();
                        if (/^about$/i.test(s) || /^about\\s+/i.test(s)) {
                            aboutSection = true;
                            break;
                        }
                    }
                    const it = (section.innerText || '').trim();
                    if (!aboutSection && !it.startsWith('About') && !it.includes('\\nAbout\\n')) {
                        continue;
                    }

                    const expanded = section.querySelector(
                        '.inline-show-more-text--is-expanded, span.inline-show-more-text'
                    );
                    if (expanded) {
                        const t = cleanAbout(expanded.innerText);
                        if (t.length > 25) return t;
                    }

                    const shared = section.querySelector(
                        '.pv-shared-text-with-see-more, .display-flex.full-width span[dir="ltr"]'
                    );
                    if (shared) {
                        const t = cleanAbout(shared.innerText);
                        if (t.length > 25) return t;
                    }

                    const t = cleanAbout(section.innerText);
                    if (t.length > 25) return t;
                }

                return null;
            }
        """)
        return about_text if about_text else None
    except Exception:
        return None


def _scroll_to_section(page, section_name):
    """
    Scroll to a specific section.
    FIX: Use componentkey attributes for SDUI sections (Experience, Education, About)
         instead of relying on innerText.startsWith() which is fragile.
    """
    # Map section names to their SDUI componentkey fragments
    SDUI_KEY_MAP = {
        "About": "About",
        "Experience": "ExperienceTopLevelSection",
        "Education": "EducationTopLevelSection",
        "Skills": "Skills",
        "Certifications": "CertificationTopLevel",
        "Activity": "Activity",
    }

    sdui_key = SDUI_KEY_MAP.get(section_name)

    try:
        if sdui_key:
            page.evaluate(f"""
                () => {{
                    const main = document.querySelector('main');
                    if (!main) return false;
                    // Try SDUI componentkey first
                    const s = main.querySelector('section[componentkey*="{sdui_key}"]');
                    if (s) {{
                        s.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                        return true;
                    }}
                    // Fallback: scan h2 text
                    for (const sec of main.querySelectorAll('section')) {{
                        const h2 = sec.querySelector('h2');
                        if (h2 && /^{section_name}$/i.test((h2.innerText || '').trim())) {{
                            sec.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                            return true;
                        }}
                    }}
                    return false;
                }}
            """)
        else:
            page.evaluate(f"""
                () => {{
                    const sections = document.querySelectorAll('main section');
                    for (const section of sections) {{
                        const text = section.innerText || '';
                        if (text.startsWith('{section_name}') || text.includes('\\n{section_name}\\n')) {{
                            section.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                            return true;
                        }}
                    }}
                    return false;
                }}
            """)
        time.sleep(1.5)
    except Exception:
        pass


def _click_show_all_buttons(page):
    """
    Expand in-page content only. Avoid <a href> that navigates to /details/ etc.
    """
    try:
        page.evaluate("""
            () => {
                const badHref = (h) => {
                    if (!h) return false;
                    const u = h.toLowerCase();
                    return u.includes('/details/') || u.includes('/overlay/')
                        || u.includes('/analytics') || u.includes('/dashboard')
                        || u.includes('/feed/') || u.includes('/premium/')
                        || u.includes('/mynetwork/') || u.includes('recent-activity')
                        || u.includes('/safety/go');
                };
                const nodes = document.querySelectorAll('button, a, [role="button"]');
                for (const el of nodes) {
                    const raw = (el.textContent || '').trim().toLowerCase();
                    if (!raw.includes('show all')) continue;
                    if (raw.length > 48) continue;
                    if (el.tagName === 'A' && badHref(el.getAttribute('href'))) continue;
                    try { el.click(); } catch (e) {}
                }
            }
        """)
        time.sleep(0.6)
    except Exception:
        pass


def _extract_experience_from_detail_page(page, profile_url):
    """
    Navigate to /details/experience/ and extract all entries.
    FIX: Parser now correctly handles the SDUI structure where company name
         may include employment type after '·' (e.g. 'Voya Financial · Full-time').
         Also detects standalone company names (not decorated with '·') via
         org-keyword heuristics.
    """
    try:
        exp_url = profile_url.rstrip("/") + "/details/experience/"
        page.goto(exp_url, wait_until="domcontentloaded")
        _random_delay(1.5, 2.5)
        _scroll_to_bottom(page)

        experiences = page.evaluate("""
            () => {
                const results = [];
                const main = document.querySelector('main');
                if (!main) return [];

                const skipTexts = new Set([
                    'experience', 'show all', 'see more', 'see less',
                    'skills:', 'add experience', 'add a position'
                ]);

                const stopWords = [
                    'ad options', 'more profiles for you', 'about',
                    'accessibility', 'talent solutions', 'community guidelines',
                    'careers', 'privacy', 'linkedin corporation', 'help center'
                ];

                const allText = [];
                const walker = document.createTreeWalker(
                    main, NodeFilter.SHOW_TEXT, null, false
                );
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text.length > 0) allText.push(text);
                }

                let currentEntry = null;
                const seenEntries = new Set();

                for (let i = 0; i < allText.length; i++) {
                    const text = allText[i];
                    const lower = text.toLowerCase();
                    const nextText = allText[i + 1] || '';

                    if (stopWords.some(sw => lower.includes(sw))) break;
                    if (skipTexts.has(lower) || text.length < 2) continue;
                    if (text === '·' || text === '-' || /^\\d+$/.test(text)) continue;
                    if (text.startsWith('Skills:') || text.startsWith('Skills ')) continue;

                    // Duration: contains a 4-digit year
                    const isDuration = /\\d{4}/.test(text) &&
                        (text.includes(' - ') || text.includes(' – ') ||
                         text.toLowerCase().includes('present') ||
                         /\\d+\\s*(yr|mo|year|month)/i.test(text));

                    // ── FIX: Employment-type decorated company string ──
                    // SDUI emits: "Voya Investment Management · Full-time"
                    const isEmploymentType = text.includes('·') &&
                        /full-time|part-time|internship|contract|freelance|self-employed|temporary/i.test(text);

                    // Location: short, comma-separated or contains remote/hybrid
                    const isLocation = !isDuration && !isEmploymentType &&
                        text.length < 80 &&
                        ((text.includes(',') && text.length < 60) ||
                         /remote|hybrid|on-site|on site/i.test(text));

                    if (isDuration && currentEntry && !currentEntry.duration) {
                        currentEntry.duration = text;
                        continue;
                    }

                    if (isEmploymentType && currentEntry && !currentEntry.company) {
                        currentEntry.company = text;
                        continue;
                    }

                    if (isLocation && currentEntry && !currentEntry.location) {
                        currentEntry.location = text;
                        continue;
                    }

                    // Description: longer text
                    if (text.length > 100 && currentEntry) {
                        currentEntry.description = (currentEntry.description || '') +
                            (currentEntry.description ? ' ' : '') + text;
                        continue;
                    }

                    // ── FIX: Job title heuristic — check next token more broadly ──
                    if (text.length > 2 && text.length < 100 && !isDuration && !isLocation && !isEmploymentType) {
                        const nextIsRelated =
                            nextText.includes('·') ||
                            /\\d{4}/.test(nextText) ||
                            /full-time|part-time|internship|contract/i.test(nextText) ||
                            // Company names often start with a capital and contain org words
                            /financial|management|technology|technologies|solutions|services|group|institute|inc\\.?|llc|ltd|corp/i.test(nextText) ||
                            /^[A-Z][a-z]/.test(nextText);

                        if (nextIsRelated) {
                            if (currentEntry && currentEntry.title) {
                                const key = `${currentEntry.title}|${currentEntry.company || ''}`;
                                if (!seenEntries.has(key)) {
                                    seenEntries.add(key);
                                    results.push(currentEntry);
                                }
                            }
                            currentEntry = {
                                title: text,
                                company: null,
                                duration: null,
                                location: null,
                                description: null
                            };
                        }
                    }
                }

                // Save last entry
                if (currentEntry && currentEntry.title) {
                    const key = `${currentEntry.title}|${currentEntry.company || ''}`;
                    if (!seenEntries.has(key)) results.push(currentEntry);
                }

                return results;
            }
        """)
        return experiences if isinstance(experiences, list) else []
    except Exception:
        return []


def _extract_experience(page):
    """
    Extract experience from main profile view.
    FIX: Use section[componentkey*='ExperienceTopLevelSection'] for reliable SDUI targeting
         instead of scanning all sections by innerText prefix.
    """
    try:
        _scroll_to_section(page, "Experience")

        experiences = page.evaluate("""
            () => {
                // ── FIX: SDUI uses a predictable componentkey ──
                const main = document.querySelector('main');
                let expSection =
                    main.querySelector('section[componentkey*="ExperienceTopLevelSection"]') ||
                    main.querySelector('section[componentkey*="Experience"]');

                // Fallback: scan h2 text
                if (!expSection) {
                    for (const section of main.querySelectorAll('section')) {
                        const h2 = section.querySelector('h2');
                        if (h2 && /^experience$/i.test((h2.innerText || '').trim())) {
                            expSection = section;
                            break;
                        }
                    }
                }
                if (!expSection) return [];

                const allText = [];
                const walker = document.createTreeWalker(
                    expSection, NodeFilter.SHOW_TEXT, null, false
                );
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text.length > 0 && text !== 'Experience' &&
                        !text.includes('Show all') &&
                        !text.includes('see more') &&
                        !text.includes('see less')) {
                        allText.push(text);
                    }
                }

                const results = [];
                let currentEntry = null;
                const seenEntries = new Set();

                for (let i = 0; i < allText.length; i++) {
                    const text = allText[i];
                    const nextText = allText[i + 1] || '';

                    // ── FIX: employment-type decorated company (SDUI) ──
                    const isCompany = text.includes('·') &&
                        /full-time|part-time|internship|contract|freelance|self-employed/i.test(text);

                    const isDuration = /\\d{4}/.test(text) &&
                        (text.includes(' - ') || text.includes(' – ') ||
                         text.toLowerCase().includes('present') ||
                         /\\d+\\s*(yr|mo|year|month)/i.test(text));

                    const isLocation = !isCompany && !isDuration && text.length < 80 &&
                        ((text.includes(',') && text.length < 60) ||
                         /remote|hybrid|on-site/i.test(text) ||
                         /united states|india|new york|california/i.test(text));

                    const isSkills = /skills/i.test(text) && (text.includes(':') || text.includes('+'));

                    if (text === '·' || text === '-' || text === '•' ||
                        /^\\d+$/.test(text) || text.length < 2 || isSkills) continue;

                    if (isCompany && currentEntry && !currentEntry.company) {
                        currentEntry.company = text; continue;
                    }
                    if (isDuration && currentEntry && !currentEntry.duration) {
                        currentEntry.duration = text; continue;
                    }
                    if (isLocation && currentEntry && !currentEntry.location) {
                        currentEntry.location = text; continue;
                    }
                    if (text.length > 80 && !isDuration && !isCompany && currentEntry) {
                        currentEntry.description = text; continue;
                    }

                    if (text.length > 2 && text.length < 100 && !isDuration && !isLocation && !isCompany) {
                        const nextIsCompany = nextText.includes('·') &&
                            /full-time|part-time|internship|contract/i.test(nextText);
                        const nextLooksLikeOrg =
                            nextText.length > 3 && nextText.length < 100 &&
                            /financial|management|technology|technologies|solutions|services|group|inc\.?|llc|ltd|corp/i.test(nextText);

                        if (nextIsCompany || nextLooksLikeOrg) {
                            if (currentEntry && currentEntry.title) {
                                const key = `${currentEntry.title}|${currentEntry.company || ''}`;
                                if (!seenEntries.has(key) && currentEntry.company) {
                                    seenEntries.add(key);
                                    results.push(currentEntry);
                                }
                            }
                            currentEntry = { title: text, company: null, duration: null, location: null, description: null };
                        }
                    }
                }

                if (currentEntry && currentEntry.title && currentEntry.company) {
                    const key = `${currentEntry.title}|${currentEntry.company}`;
                    if (!seenEntries.has(key)) results.push(currentEntry);
                }

                return results;
            }
        """)
        return experiences if isinstance(experiences, list) else []
    except Exception:
        return []


def _extract_education_from_detail_page(page, profile_url):
    """Navigate to /details/education/ and extract all entries."""
    try:
        edu_url = profile_url.rstrip("/") + "/details/education/"
        page.goto(edu_url, wait_until="domcontentloaded")
        _random_delay(1.5, 2.5)
        _scroll_to_bottom(page)

        education = page.evaluate("""
            () => {
                const results = [];
                const main = document.querySelector('main');
                if (!main) return [];

                const skipTexts = new Set([
                    'education', 'show all', 'see more', 'see less',
                    'activities and societies:', 'add education'
                ]);

                const stopWords = [
                    'ad options', 'more profiles for you', 'about',
                    'accessibility', 'talent solutions', 'community guidelines',
                    'careers', 'privacy', 'linkedin corporation', 'help center'
                ];

                const allText = [];
                const walker = document.createTreeWalker(
                    main, NodeFilter.SHOW_TEXT, null, false
                );
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text.length > 0) allText.push(text);
                }

                let currentEntry = null;
                const seenSchools = new Set();

                for (let i = 0; i < allText.length; i++) {
                    const text = allText[i];
                    const lower = text.toLowerCase();

                    if (stopWords.some(sw => lower.includes(sw))) break;
                    if (skipTexts.has(lower) || text.length < 2) continue;
                    if (text === '·' || text === '-' || /^\\d+$/.test(text)) continue;

                    const isDate = /\\d{4}\\s*[-–]\\s*\\d{4}/.test(text) ||
                        /\\d{4}\\s*[-–]\\s*(Present|present)/.test(text) ||
                        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+\\d{4}/.test(text) ||
                        // ── FIX: SDUI date format "Jan 2023 – 2025" ──
                        /^\\d{4}$/.test(text.trim());

                    const isDegree = text.length > 3 && text.length < 200 &&
                        (lower.includes('bachelor') || lower.includes('master') ||
                         lower.includes("master's") || lower.includes("bachelor's") ||
                         lower.includes('b.tech') || lower.includes('m.tech') ||
                         lower.includes('b.s.') || lower.includes('m.s.') ||
                         lower.includes('ph.d') || lower.includes('mba') ||
                         lower.includes('bsc') || lower.includes('msc') ||
                         lower.includes('degree') || lower.includes('diploma') ||
                         lower.includes('computer science') || lower.includes('engineering'));

                    const isSchool = text.length > 5 && text.length < 150 &&
                        !isDegree && !isDate &&
                        (lower.includes('university') || lower.includes('college') ||
                         lower.includes('institute') || lower.includes('school') ||
                         lower.includes('academy') || lower.includes('polytechnic') ||
                         lower.includes('technology') && lower.includes('of'));

                    if (isDate && currentEntry) {
                        if (!currentEntry.dates) currentEntry.dates = text;
                        else currentEntry.dates += ' – ' + text;
                        continue;
                    }

                    if (isDegree && currentEntry && !currentEntry.degree) {
                        currentEntry.degree = text; continue;
                    }

                    if (isSchool) {
                        if (currentEntry && currentEntry.school && !seenSchools.has(currentEntry.school)) {
                            seenSchools.add(currentEntry.school);
                            results.push(currentEntry);
                        }
                        currentEntry = { school: text, degree: null, dates: null };
                    }
                }

                if (currentEntry && currentEntry.school && !seenSchools.has(currentEntry.school)) {
                    results.push(currentEntry);
                }

                return results;
            }
        """)
        return education if isinstance(education, list) else []
    except Exception:
        return []


def _extract_education(page):
    """
    Extract education from main profile view.
    FIX: Use section[componentkey*='EducationTopLevelSection'] for SDUI targeting.
    """
    try:
        _scroll_to_section(page, "Education")

        education = page.evaluate("""
            () => {
                const main = document.querySelector('main');
                // ── FIX: SDUI componentkey targeting ──
                let eduSection =
                    main.querySelector('section[componentkey*="EducationTopLevelSection"]') ||
                    main.querySelector('section[componentkey*="Education"]');

                if (!eduSection) {
                    for (const section of main.querySelectorAll('section')) {
                        const h2 = section.querySelector('h2');
                        if (h2 && /^education$/i.test((h2.innerText || '').trim())) {
                            eduSection = section; break;
                        }
                    }
                }
                if (!eduSection) return [];

                const allText = [];
                const walker = document.createTreeWalker(
                    eduSection, NodeFilter.SHOW_TEXT, null, false
                );
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text.length > 0 && text !== 'Education' &&
                        !text.includes('Show all') &&
                        !text.includes('see more') &&
                        !text.includes('see less') &&
                        text !== '·' && text !== '-') {
                        allText.push(text);
                    }
                }

                const results = [];
                let currentEntry = null;
                const seenSchools = new Set();

                for (let i = 0; i < allText.length; i++) {
                    const text = allText[i];

                    const isDate = /\\d{4}\\s*[-–]\\s*\\d{4}/.test(text) ||
                        /\\d{4}\\s*[-–]\\s*(Present|present)/.test(text) ||
                        /^\\d{4}$/.test(text.trim());

                    if (text.length < 2 || /^\\d+$/.test(text)) continue;

                    if (isDate && currentEntry) {
                        currentEntry.dates = (currentEntry.dates || '') +
                            (currentEntry.dates ? ' – ' : '') + text;
                        continue;
                    }

                    const looksLikeDegree = text.length > 3 && text.length < 150 &&
                        (text.includes('Bachelor') || text.includes('Master') ||
                         text.includes("Master's") || text.includes("Bachelor's") ||
                         text.includes('B.Tech') || text.includes('M.Tech') ||
                         text.includes('BTech') || text.includes('MTech') ||
                         text.includes('Ph.D') || text.includes('MBA') ||
                         text.includes('degree') ||
                         // ── FIX: "Computer Science" / "Engineering" as degree field ──
                         /computer science|engineering|information technology/i.test(text));

                    const looksLikeSchool = text.length > 5 && text.length < 150 &&
                        !looksLikeDegree &&
                        (text.toLowerCase().includes('university') ||
                         text.toLowerCase().includes('college') ||
                         text.toLowerCase().includes('institute') ||
                         text.toLowerCase().includes('school') ||
                         text.toLowerCase().includes('academy') ||
                         // ── FIX: "New York Institute of Technology" hits 'institute' ──
                         text.toLowerCase().includes('technology') && text.toLowerCase().includes('of'));

                    if (looksLikeSchool) {
                        if (currentEntry && currentEntry.school && !seenSchools.has(currentEntry.school)) {
                            seenSchools.add(currentEntry.school);
                            results.push(currentEntry);
                        }
                        currentEntry = { school: text, degree: null, dates: null };
                    } else if (looksLikeDegree && currentEntry && !currentEntry.degree) {
                        currentEntry.degree = text;
                    }
                }

                if (currentEntry && currentEntry.school && !seenSchools.has(currentEntry.school)) {
                    results.push(currentEntry);
                }

                return results;
            }
        """)
        return education if isinstance(education, list) else []
    except Exception:
        return []


def _extract_skills(page, profile_url):
    """Navigate to /details/skills/ and extract all skills."""
    try:
        skills_url = profile_url.rstrip("/") + "/details/skills/"
        page.goto(skills_url, wait_until="domcontentloaded")
        _random_delay(1.5, 2.5)
        _scroll_to_bottom(page)

        skills = page.evaluate("""
            () => {
                const results = [];
                const seen = new Set();

                const skipTexts = new Set([
                    'all', 'industry knowledge', 'tools & technologies',
                    'interpersonal skills', 'other skills', 'skills',
                    'languages', 'certifications', 'show all', 'see more',
                    'see less', 'endorsement', 'endorsements', 'skill details',
                    'add skill', 'take skill quiz', 'load more'
                ]);

                const stopWords = [
                    'ad options', 'why am i seeing', 'more profiles for you',
                    'about', 'accessibility', 'talent solutions',
                    'community guidelines', 'careers', 'privacy',
                    'linkedin corporation', 'help center'
                ];

                const main = document.querySelector('main');
                if (!main) return [];

                const allText = [];
                const walker = document.createTreeWalker(
                    main, NodeFilter.SHOW_TEXT, null, false
                );
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text.length > 0) allText.push(text);
                }

                for (const text of allText) {
                    const lower = text.toLowerCase();
                    if (stopWords.some(sw => lower.includes(sw))) break;
                    if (seen.has(lower) || skipTexts.has(lower)) continue;
                    if (text.length < 2 || text.length > 60) continue;
                    if (/^\\d+$/.test(text)) continue;
                    if (/^\\d+\\s*(endorsement|connection|skill)/i.test(text)) continue;
                    if (text.includes('·') || text === '-') continue;
                    if (/show|add|take|quiz|passed|assessment/i.test(text)) continue;
                    if (text.includes(' at ') || text.includes(' @ ')) continue;
                    if (/^connect/i.test(text)) continue;

                    results.push(text);
                    seen.add(lower);
                }

                return results;
            }
        """)
        return skills if isinstance(skills, list) else []
    except Exception:
        return []


def _extract_certifications(page, profile_url):
    """Navigate to /details/certifications/ and extract entries."""
    try:
        certs_url = profile_url.rstrip("/") + "/details/certifications/"
        page.goto(certs_url, wait_until="domcontentloaded")
        _random_delay(1.5, 2.5)
        _scroll_to_bottom(page)

        certs = page.evaluate("""
            () => {
                const results = [];
                const main = document.querySelector('main');
                if (!main) return [];

                const skipTexts = new Set([
                    'certifications', 'licenses & certifications', 'show all',
                    'see more', 'see less', 'add certification', 'credential id',
                    'show credential', 'see credential', 'skills:'
                ]);

                const stopWords = [
                    'ad options', 'why am i seeing', 'more profiles for you',
                    'about', 'accessibility', 'talent solutions',
                    'community guidelines', 'careers', 'privacy',
                    'linkedin corporation', 'help center', '· 3rd'
                ];

                const allText = [];
                const walker = document.createTreeWalker(
                    main, NodeFilter.SHOW_TEXT, null, false
                );
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text.length > 0) allText.push(text);
                }

                let currentEntry = null;
                const seenCerts = new Set();

                for (let i = 0; i < allText.length; i++) {
                    const text = allText[i];
                    const lower = text.toLowerCase();

                    if (stopWords.some(sw => lower.includes(sw))) break;
                    if (skipTexts.has(lower) || text.length < 2) continue;
                    if (text === '·' || text === '-' || /^\\d+$/.test(text)) continue;
                    if (text.startsWith('Credential ID')) continue;
                    if (text.endsWith('.pdf')) continue;

                    const isDate = /^issued/i.test(text);
                    // ── FIX: Broader issuer detection including "Stanford CPD, UVM" style ──
                    const isIssuer = (
                        lower.includes('coursera') || lower.includes('udemy') ||
                        lower.includes('linkedin learning') || lower.includes('google') ||
                        lower.includes('microsoft') || lower.includes('aws') ||
                        lower.includes('deeplearning') || lower.includes('stanford') ||
                        lower.includes('coursera') || lower.includes('uvm')
                    ) && !lower.includes('certificate') && !lower.includes('certification');

                    if (isDate && currentEntry) { currentEntry.date = text; continue; }
                    if (isIssuer && currentEntry && !currentEntry.issuing_org) {
                        currentEntry.issuing_org = text; continue;
                    }

                    if (text.length > 5 && text.length < 150 && !isDate && !isIssuer) {
                        if (/machine learning,|algorithms,/i.test(text)) continue;

                        if (currentEntry && currentEntry.name) {
                            if (!seenCerts.has(currentEntry.name.toLowerCase())) {
                                seenCerts.add(currentEntry.name.toLowerCase());
                                results.push(currentEntry);
                            }
                        }
                        currentEntry = { name: text, issuing_org: null, date: null };
                    }
                }

                if (currentEntry && currentEntry.name) {
                    if (!seenCerts.has(currentEntry.name.toLowerCase())) {
                        results.push(currentEntry);
                    }
                }

                return results;
            }
        """)
        return certs if isinstance(certs, list) else []
    except Exception:
        return []


def _extract_recent_activity(page, profile_url):
    """Navigate to /recent-activity/all/ and extract recent posts."""
    try:
        activity_url = profile_url.rstrip("/") + "/recent-activity/all/"
        page.goto(activity_url, wait_until="domcontentloaded")
        _random_delay(2.0, 3.0)

        for _ in range(3):
            page.evaluate("window.scrollBy(0, 800)")
            time.sleep(random.uniform(0.5, 1.0))

        posts = page.evaluate("""
            () => {
                const results = [];
                const main = document.querySelector('main');
                if (!main) return [];

                const feedItems = main.querySelectorAll('div[data-urn]');
                const count = Math.min(feedItems.length, 5);

                for (let i = 0; i < count; i++) {
                    const item = feedItems[i];
                    const post = { text: null, reactions: null, comments: null };

                    const allText = [];
                    const walker = document.createTreeWalker(
                        item, NodeFilter.SHOW_TEXT, null, false
                    );
                    let node;
                    while (node = walker.nextNode()) {
                        const text = node.textContent.trim();
                        if (text.length > 30 && text.length < 3000 &&
                            !text.includes('Like') && !text.includes('Comment') &&
                            !text.includes('Repost') && !text.includes('Send')) {
                            allText.push(text);
                        }
                    }

                    if (allText.length > 0) {
                        post.text = allText.join(' ').substring(0, 1000);
                    }

                    const allSpans = item.querySelectorAll('span');
                    for (const span of allSpans) {
                        const t = span.textContent.trim();
                        if (/^\\d+$/.test(t) || /^\\d+,\\d+$/.test(t)) {
                            if (!post.reactions) post.reactions = t;
                            else if (!post.comments) post.comments = t;
                        }
                    }

                    if (post.text) results.push(post);
                }

                return results;
            }
        """)
        return posts if posts else []
    except Exception:
        return []


def _is_session_expired(page) -> bool:
    page_url = page.url.lower()
    if any(x in page_url for x in ["/login", "/authwall", "/signup", "/checkpoint"]):
        return True
    try:
        h1_text = page.locator("h1").first.inner_text(timeout=3000).strip().lower()
        if h1_text in ("join linkedin", "sign in", "sign up"):
            return True
    except Exception:
        pass
    return False


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

def setup_session():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=BROWSER_ARGS)
        context = browser.new_context(user_agent=USER_AGENT, viewport=VIEWPORT)
        page = context.new_page()
        page.goto("https://www.linkedin.com/login")

        print("=" * 50)
        print("Log in to LinkedIn in the browser window.")
        print("Press ENTER here after you have logged in.")
        print("=" * 50)
        input()

        if USE_SESSION_FILE:
            _save_linkedin_session(context)
            print("Session saved to:", SESSION_FILE)
        else:
            print("LINKEDIN_USE_SESSION_FILE=0 — not writing a session file.")
        browser.close()


def scrape_profile(profile_url: str, headless: bool = True, _is_retry: bool = False) -> dict:
    profile_url = profile_url.rstrip("/")
    if not profile_url.startswith("https://"):
        profile_url = "https://" + profile_url

    result = {"profile_url": profile_url}

    with _SCRAPE_SEMAPHORE:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless, args=BROWSER_ARGS)
            context = None
            try:
                use_file = USE_SESSION_FILE and os.path.isfile(SESSION_FILE)
                if use_file:
                    context = browser.new_context(
                        storage_state=SESSION_FILE,
                        user_agent=USER_AGENT,
                        viewport=VIEWPORT,
                    )
                else:
                    if USE_SESSION_FILE:
                        print("No session file found. Logging in with LINKEDIN_EMAIL / LINKEDIN_PASSWORD...")
                    else:
                        print("LINKEDIN_USE_SESSION_FILE=0 — logging in with credentials...")
                    context = browser.new_context(
                        user_agent=USER_AGENT,
                        viewport=VIEWPORT,
                    )

                page = context.new_page()
                page.set_default_timeout(30_000)

                if not use_file:
                    if not _login_with_credentials(page):
                        raise RuntimeError(
                            "Login failed. LinkedIn may require manual verification.\n"
                            "Run: python scraper.py --setup"
                        )
                    if USE_SESSION_FILE:
                        _save_linkedin_session(context)

                page.goto(profile_url, wait_until="domcontentloaded")
                page.wait_for_load_state("load")
                _random_delay(2.0, 3.5)

                # ── FIX: SDUI uses h2 for name — wait for h2 OR h1 OR topcard ──
                try:
                    page.wait_for_selector(
                        "main h2, main h1, main section[componentkey*='Topcard']",
                        timeout=20_000,
                    )
                except Exception:
                    pass

                page.evaluate("window.scrollTo(0, 400)")
                _random_delay(0.8, 1.4)
                page.evaluate("window.scrollTo(0, 0)")
                _random_delay(0.5, 1.0)

                if _is_session_expired(page):
                    if _is_retry:
                        raise RuntimeError(
                            "Session expired even after auto-login refresh.\n"
                            "Run: python scraper.py --setup  to log in manually."
                        )
                    print("Session expired. Attempting re-login and retry...")
                    context.close()
                    browser.close()
                    context = None
                    if USE_SESSION_FILE and os.path.isfile(SESSION_FILE):
                        try:
                            os.remove(SESSION_FILE)
                        except OSError:
                            pass
                    if USE_SESSION_FILE:
                        if not auto_login():
                            raise RuntimeError(
                                "Session expired and auto-login failed.\n"
                                "Run: python scraper.py --setup  to log in manually."
                            )
                    return scrape_profile(profile_url, headless, _is_retry=True)

                print("Extracting basic info...")
                result["basic_info"] = _extract_basic_info(page)

                _scroll_to_section(page, "About")
                _expand_see_more_in_main(page)
                _random_delay(0.4, 0.8)

                print("Extracting about...")
                result["about"] = _extract_about(page)

                _scroll_to_bottom(page)
                _random_delay(0.8, 1.2)
                _click_show_all_buttons(page)
                _random_delay(0.4, 0.8)

                print("Extracting experience...")
                result["experience"] = _extract_experience_from_detail_page(page, profile_url)

                print("Extracting education...")
                result["education"] = _extract_education_from_detail_page(page, profile_url)

                print("Extracting skills...")
                result["skills"] = _extract_skills(page, profile_url)

                _random_delay(1.0, 2.0)
                print("Extracting certifications...")
                result["certifications"] = _extract_certifications(page, profile_url)

                print("Extracting recent posts...")
                result["recent_posts"] = _extract_recent_activity(page, profile_url)

                result["scraped_date"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            finally:
                if context:
                    context.close()
                browser.close()

    return result


# ──────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LinkedIn Profile Scraper")
    parser.add_argument("--setup", action="store_true", help="Manual login fallback (opens browser)")
    parser.add_argument("--login", action="store_true", help="Auto-login using .env credentials")
    parser.add_argument("--url", type=str, help="LinkedIn profile URL to scrape")
    parser.add_argument("--output", type=str, help="Save output to JSON file")
    parser.add_argument("--visible", action="store_true", help="Run browser in visible mode")

    args = parser.parse_args()

    if args.setup:
        setup_session()
    elif args.login:
        success = auto_login()
        print("Login successful!" if success else "Login failed.")
    elif args.url:
        data = scrape_profile(args.url, headless=not args.visible)
        output = json.dumps(data, indent=2, ensure_ascii=False)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"Saved to {args.output}")
        else:
            print(output)
    else:
        parser.print_help()