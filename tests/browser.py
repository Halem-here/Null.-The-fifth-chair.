"""Browser test for NULL. Run: python3 tests/browser.py   (needs playwright + chromium)
Plays the game through the real buttons. Screenshots go to tests/shots/."""
import os, sys, json
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
URL = 'file://' + os.path.join(ROOT, 'index.html')
SHOTS = os.path.join(ROOT, 'tests', 'shots'); os.makedirs(SHOTS, exist_ok=True)

def settle(pg):
    """Wait for finite CSS animations (page rise, ending fade-ins) so screenshots show the finished screen, not a mid-fade frame."""
    pg.evaluate("Promise.all(document.getAnimations().filter(a => a.effect && a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => null)))")
    pg.wait_for_timeout(50)

fails, passes = [], 0

def check(name, cond, detail=''):
    global passes
    if cond: passes += 1; print('  ok   ' + name)
    else: fails.append(name); print('  FAIL ' + name + ('  ' + str(detail) if detail else ''))

def play_to_ending(page, who):
    """Same legitimate route as the Node tests, but through the DOM."""
    def ask(src, ids):
        page.click(f'[data-key="who-{src}"]')
        for i in ids:
            page.click(f'[data-key="ask-{i}"]')
    page.click('button:has-text("Interviews")')
    ask('dess', ['dess-what', 'dess-when', 'dess-safe', 'dess-vote', 'dess-sheet', 'dess-rope', 'dess-nell'])
    ask('corin', ['corin-dock', 'corin-rope', 'corin-source', 'corin-log', 'corin-sheet'])
    ask('teo', ['teo-beach', 'teo-rope', 'teo-drink', 'teo-photo', 'teo-up'])
    ask('wren', ['wren-last', 'wren-sign', 'wren-where', 'wren-meta', 'wren-tell'])
    ask('livia', ['livia-rescue', 'livia-door', 'livia-number', 'livia-carry', 'livia-before', 'livia-sign-hi'])
    page.click('button:has-text("Evidence")')
    ideal = page.evaluate("NULLGAME.CARDS.map(c => [c.id, (c.truthIf && c.truthIf.length) ? c.truthIf[c.truthIf.length-1].truth : c.truth])")
    for cid, cls in ideal:
        page.click(f'[data-key="cls-{cid}-{cls}"]')
    page.click('button:has-text("Timeline")'); page.check('[data-key="tl-tl-b"]')
    page.click('button:has-text("Pages")');    page.check('[data-key="pg-pg-c"]')
    page.click('button:has-text("Verdicts")')
    for cid, v in page.evaluate("(() => { const G = NULLGAME, s = JSON.parse(localStorage.getItem(G.SAVE_KEY)); return G.CLAIMS.map(c => [c.id, G.claimCorrect(s, c)]); })()"):
        page.click(f'[data-key="v-{cid}-{v}"]')
    page.click('button:has-text("Retelling")')
    for k in ['rt-A3', 'rt-B2', 'rt-C1', f'ad-{who}']:
        page.check(f'[data-key="{k}"]')
    page.click('button:has-text("Say it")')


def imgs_ok(sel='img', timeout=4000):
    """True when every matching <img> has finished loading with a real size."""
    try:
        page.wait_for_function("(sel) => { const l = [...document.querySelectorAll(sel)]; return l.length > 0 && l.every(i => i.complete && i.naturalWidth > 0); }", arg=sel, timeout=timeout)
        return True
    except Exception:
        return False

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('requestfailed', lambda r: errors.append('requestfailed: ' + r.url))

    print('Start and persistence')
    page.goto(URL)
    title_en = page.inner_text('#view')
    page.click('#language-switch [data-lang="ur"]')
    check('language switch changes the title to Roman Urdu without starting the game', page.get_attribute('#language-switch [data-lang="ur"]', 'aria-pressed') == 'true' and page.inner_text('#view') != title_en and page.evaluate("document.documentElement.lang") == 'ur-Latn' and page.evaluate("localStorage.getItem('null.save.v1')") is None)
    page.click('#language-switch [data-lang="en"]')
    check('title screen shows Begin and no Continue', page.locator('button:has-text("Begin")').count() == 1 and page.locator('button:has-text("Continue")').count() == 0)
    check('nav hidden on title', not page.locator('#bar').is_visible())
    page.click('button:has-text("Begin")')
    check('briefing shows the House Rule', 'House Rule 4' in page.inner_text('#view'))
    page.click('button:has-text("Open the evidence")')
    n0 = page.locator('article.card').count()
    START = page.evaluate("NULLGAME.CARDS.filter(c => c.start).length")
    check('evidence screen lists exactly the starting cards', n0 == START, (n0, START))
    check('Pages is locked before the sign-off card exists', page.locator('#nav button:has-text("Pages")').is_disabled())

    page.click('button:has-text("Interviews")')
    page.click('[data-key="ask-dess-what"]')
    check('asking a topic adds Dess’s answer to the transcript', 'called when we could' in page.inner_text('.talk'))
    transcript_en = page.inner_text('.talk')
    page.click('#language-switch [data-lang="ur"]')
    check('language switch translates an active interview without losing its answer', page.inner_text('.talk') != transcript_en and 'dess-what' in page.evaluate("JSON.parse(localStorage.getItem('null.save.v1')).asked"))
    page.click('#language-switch [data-lang="en"]')
    check('new card announced', 'Added to the file' in page.inner_text('#view'))
    page.click('button:has-text("Evidence")')
    page.click('[data-key="cls-c01-fact"]')
    check('classifying marks the card', page.get_attribute('[data-key="cls-c01-fact"]', 'aria-pressed') == 'true')
    check('Dess’s timing account is not labelled a contradiction by the call log', 'Conflict:' not in page.inner_text('#view'))
    n1 = page.locator('article.card').count()
    page.reload()
    check('refresh lands on the title with Continue available', page.locator('button:has-text("Continue")').count() == 1)
    page.click('button:has-text("Continue")')
    check('Continue restores the same screen and cards', page.locator('article.card').count() == n1 and page.get_attribute('[data-key="cls-c01-fact"]', 'aria-pressed') == 'true')

    print('New game')
    page.click('#menu-btn')
    page.click('button:has-text("New game")')
    check('New game asks before erasing', page.locator('button:has-text("Erase my progress")').count() == 1)
    page.click('button:has-text("Cancel")')
    check('cancel keeps the save', page.evaluate("localStorage.getItem('null.save.v1')") is not None)
    page.click('button:has-text("New game")'); page.click('button:has-text("Erase my progress")')
    page.click('button:has-text("Open the evidence")')
    check('after reset the evidence is back to the starting cards', page.locator('article.card').count() == START)
    check('after reset nothing is classified', page.locator('.card[data-cls="fact"]').count() == 0)

    print('Full playthroughs (real buttons)')
    expected = {'nell': 'NELL / THE FIVE', 'livia': 'THE CARD', 'wren': 'THE LETTER', 'five': 'THE FIVE'}
    for who, ending in expected.items():
        page.click('#menu-btn') if page.locator('#menu-btn').is_visible() else None
        if page.locator('button:has-text("New game")').count():
            page.click('button:has-text("New game")'); page.click('button:has-text("Erase my progress")')
        else:
            page.click('button:has-text("Begin")')
        page.click('button:has-text("Open the evidence")')
        play_to_ending(page, who)
        got = page.inner_text('.ending h1')
        check(f'ideal route to {who} ends in {ending}', got == ending, got)
        check(f'{ending}: its own picture loads', imgs_ok('.ending img') and page.locator('.ending img').count() == 1)
        check(f'{ending}: the page says how the file read the answers', page.locator('.explain-end').count() == 1 and 'claims backed' in page.inner_text('.explain-end summary'))
        if who in ('nell', 'five', 'wren', 'livia'):
            check(f'{ending}: all 10 claims backed, no complaints', '10 of 10 claims backed' in page.inner_text('.explain-end summary') and 'held up' in page.text_content('.explain-end'))
            check(f'{ending}: names the boat MIST or leaves it out, never ARLO', 'ARLO' not in page.inner_text('.ending'))
        if who == 'nell':
            settle(page); page.screenshot(path=os.path.join(SHOTS, 'ending-desktop.png'))
            ending_en = page.inner_text('.ending')
            page.click('#language-switch [data-lang="ur"]')
            check('language switch translates an ending without changing the ending', page.inner_text('.ending') != ending_en and page.inner_text('.ending h1') == ending)
            page.click('#language-switch [data-lang="en"]')
            page.reload()
            check('ending persists across refresh', page.locator('button:has-text("Continue")').count() == 1)
            page.click('button:has-text("Continue")')
            check('Continue returns to the ending screen', page.locator('.ending h1').inner_text() == ending)
        page.click('button:has-text("Start again")')
        page.click('button:has-text("Open the evidence")') if page.locator('button:has-text("Open the evidence")').count() else None
        page.click('#menu-btn')

    # Check the failure endings in the browser.
    def fresh():
        # The page should be on an ending, an investigation screen, or the title.
        if page.locator('button:has-text("Start again")').count():
            page.click('button:has-text("Start again")')
        else:
            if page.locator('#menu-btn').is_visible(): page.click('#menu-btn')
            page.click('button:has-text("New game")'); page.click('button:has-text("Erase my progress")')
        page.click('button:has-text("Open the evidence")')
    fresh()
    for cid in ['c01', 'c02', 'c03']: page.click(f'[data-key="cls-{cid}-struck"]')
    page.click('button:has-text("Retelling")')
    for k in ['rt-A3', 'rt-B2', 'rt-C1', 'ad-five']: page.check(f'[data-key="{k}"]')
    page.click('button:has-text("Say it")')
    check('striking three records ends in STRUCK', page.inner_text('.ending h1') == 'STRUCK')
    check('STRUCK: its own picture loads', imgs_ok('.ending img'))
    fresh(); page.click('button:has-text("Retelling")')
    for k in ['rt-A1', 'rt-B1', 'rt-C1', 'ad-five']: page.check(f'[data-key="{k}"]')
    page.click('button:has-text("Say it")')
    check('repeating the agreed sentence ends in THE SAME SENTENCE', page.inner_text('.ending h1') == 'THE SAME SENTENCE')
    check('THE SAME SENTENCE: its own picture loads', imgs_ok('.ending img'))
    fresh(); page.click('button:has-text("Retelling")')
    check('Say it is disabled until the retelling is complete', page.locator('button:has-text("Say it")').is_disabled())
    for k in ['rt-A2', 'rt-B3', 'rt-C3', 'ad-five']: page.check(f'[data-key="{k}"]')
    page.click('button:has-text("Say it")')
    check('hedging with no verdicts ends in NO ANSWER', page.inner_text('.ending h1') == 'NO ANSWER')
    check('NO ANSWER: its own picture loads', imgs_ok('.ending img'))
    check('NO ANSWER explains what was missing, in plain words', 'You did not rule on' in page.inner_text('.explain-end') or 'You ruled' in page.inner_text('.explain-end'))

    print('Story, notes, fonts, wording')
    fresh()
    check('nothing in the evidence screen says ARLO', 'ARLO' not in page.inner_text('#view'))
    check('every visible card shows what it shows and cannot show', page.locator('.card .notes').count() == page.locator('.card').count() and page.locator('.card .notes').count() >= 14)
    check('the notes label what the card cannot show', 'Cannot show' in page.inner_text('.card .notes'))
    page.click('[data-key="ex-c01"]')
    check('the inspector names the boat MIST and shows the notes', 'MIST' in page.inner_text('#inspect') and 'Cannot show' in page.inner_text('#inspect'))
    page.keyboard.press('Escape')
    page.click('#nav button:has-text("Story")')
    check('Story screen is reachable from the nav and explains TRUE, FALSE and NULL', 'reliable evidence supports it' in page.inner_text('#view') and 'reliable evidence contradicts it' in page.inner_text('#view') and 'not enough evidence' in page.inner_text('#view'))
    check('Story screen says the boat is MIST', 'MIST' in page.inner_text('#view') and 'ARLO' not in page.inner_text('#view'))
    check('Story screen has a how-to-play list', page.locator('.howto ol li').count() == 5)
    page.click('#nav button:has-text("Timeline")')
    check('the timeline says the shore-arrival time is not in the file', 'does not say when the group reached the shore' in page.inner_text('#view'))
    check('the timeline never mentions 21:25 or 75 minutes', '21:25' not in page.inner_text('#view') and '75 minutes' not in page.inner_text('#view'))
    page.click('#nav button:has-text("Verdicts")')
    check('the verdict screen shows the three definitions', page.locator('.rules li').count() == 3)
    check('verdict buttons carry the word, not only a colour', page.locator('[data-key="v-k1-TRUE"]').inner_text().startswith('TRUE'))
    page.click('#nav button:has-text("Case board")')
    check('the board is called Case board', 'Case board' in page.inner_text('#view h1'))
    fam = page.evaluate("getComputedStyle(document.body).fontFamily")
    check('body text uses Inter', fam.startswith('Inter') or fam.startswith('"Inter"'), fam)
    check('headings use Lora', 'Lora' in page.evaluate("getComputedStyle(document.querySelector('h1')).fontFamily"))
    loaded = page.evaluate("document.fonts.ready.then(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/\"/g, '')))")
    check('the bundled Inter and Lora files actually loaded', 'Inter' in loaded and 'Lora' in loaded, loaded)
    check('no text is forced to upper case by CSS on the evidence screen', page.evaluate("[...document.querySelectorAll('#view *')].filter(e => e.offsetParent && getComputedStyle(e).textTransform === 'uppercase').length") == 0)

    print('Layout and accessibility')
    fresh()
    settle(page); page.screenshot(path=os.path.join(SHOTS, 'evidence-desktop.png'))
    page.click('button:has-text("Interviews")'); page.click('[data-key="ask-dess-what"]')
    settle(page); page.screenshot(path=os.path.join(SHOTS, 'interviews-desktop.png'))
    check('no element has an empty accessible name among buttons', page.evaluate("[...document.querySelectorAll('button')].every(b => (b.textContent||b.getAttribute('aria-label')||'').trim().length)"))
    page.keyboard.press('Tab')
    check('keyboard focus moves to a visible element', page.evaluate("document.activeElement !== document.body"))


    print('Inspection dialog')
    fresh()
    dlg = lambda: page.evaluate("document.getElementById('inspect').open")
    page.click('[data-key="ex-c01"]')
    check('Examine opens the inspection dialog on that item', dlg() and 'Photograph, 20:41' in page.inner_text('#inspect h2'))
    check('the dialog shows the card text, its source and when', 'Teo' in page.inner_text('#inspect') and '20:41' in page.inner_text('#inspect .meta'))
    check('focus moves into the dialog', page.evaluate("document.getElementById('inspect').contains(document.activeElement)"))
    page.keyboard.press('Escape')
    check('Escape closes the dialog', not dlg())
    check('focus returns to the Examine button that opened it', page.evaluate("document.activeElement && document.activeElement.getAttribute('data-key')") == 'ex-c01')
    page.click('[data-key="ex-c01"]'); page.click('[data-key="ins-close"]')
    check('Close button closes it too', not dlg())
    page.click('[data-key="ex-c01"]'); page.click('[data-key="m-cls-c01-fact"]')
    check('classifying inside the dialog is applied and stays open', dlg() and page.get_attribute('[data-key="m-cls-c01-fact"]', 'aria-pressed') == 'true')
    check('and the card behind it changed too', page.get_attribute('[data-key="cls-c01-fact"]', 'aria-pressed') == 'true')
    t0 = page.inner_text('#inspect h2'); page.click('[data-key="ins-next"]')
    check('Next item moves to another card', page.inner_text('#inspect h2') != t0)
    t1 = page.inner_text('#inspect h2'); page.keyboard.press('ArrowLeft')
    check('arrow keys step through items', page.inner_text('#inspect h2') == t0, (t0, t1, page.inner_text('#inspect h2')))
    page.click('[data-key="ins-close"]')
    page.click('[data-key="ex-c11"]'); page.click('[data-key="ins-zoom"]')
    check('Enlarge image zooms the photograph and says so', page.locator('#inspect .photo.zoomed').count() == 1 and page.get_attribute('[data-key="ins-zoom"]', 'aria-pressed') == 'true')
    check('photographs load inside the dialog', imgs_ok('#inspect img'))
    page.click('[data-key="ins-close"]')
    check('backdrop click also closes it', (page.click('[data-key="ex-c05"]') or True) and (page.mouse.click(4, 400) or True) and not dlg())
    check('closing never lost progress (card is still classed Fact)', page.get_attribute('[data-key="cls-c01-fact"]', 'aria-pressed') == 'true')

    print('Evidence screen')
    page.click('[data-key="flt-fact"]')
    check('Fact filter shows only Fact cards', page.locator('article.card').count() == 1 and page.locator('.card[data-cls="fact"]').count() == 1)
    page.click('[data-key="flt-none"]')
    check('Unclassified filter hides the classified card', page.locator('article.card[data-id="c01"]').count() == 0 and page.locator('article.card').count() == START - 1)
    page.click('[data-key="flt-all"]')
    check('All shows everything again', page.locator('article.card').count() == START)
    kinds = page.evaluate("[...new Set([...document.querySelectorAll('article.card')].map(c => c.dataset.kind))]")
    check('evidence is shown as distinct kinds of artifact', len(kinds) >= 6, kinds)
    check('no card is only a coloured box: each shows a class badge with text', page.evaluate("[...document.querySelectorAll('article.card .badge')].every(b => b.textContent.trim().length > 3)"))
    check('the vote sheet is shown as a table of five votes', page.locator('.art-vote .vote-row').count() == 5)

    print('Evidence board')
    page.click('#nav button:has-text("Interviews")'); page.click('[data-key="who-dess"]')
    for t in ['dess-what', 'dess-when', 'dess-safe']: page.click(f'[data-key="ask-{t}"]')
    page.click('#nav button:has-text("Board")')
    check('board lists every unlocked item as a tile', page.locator('.tile').count() == page.evaluate("NULLGAME.CARDS.filter(c => JSON.parse(localStorage.getItem('null.save.v1')).unlocked.includes(c.id)).length"))
    page.click('[data-key="tile-c02"]')
    check('selecting one item offers its recorded connections', page.locator('[data-key="rel-pick-d02"]').count() == 1)
    page.click('[data-key="rel-pick-d02"]')
    check('picking a connected item shows how they relate', 'Dess says the message was hers' in page.inner_text('.relation'))
    check('no stray "null" text in the relation panel', 'null' not in page.inner_text('.relation').lower())
    check('status is Uncertain until both are Fact', 'uncertain' in page.inner_text('.relation .rel').lower())
    page.click('[data-key="rel-pin"]')
    page.wait_for_timeout(100)
    check('pinning draws a string between the two tiles', page.locator('svg.strings path.str').count() >= 1)
    check('the string has real length on screen', page.evaluate("(() => { const b = document.querySelector('svg.strings path.str.uncertain').getBoundingClientRect(); return b.width + b.height > 20; })()"))
    check('and lists it under Pinned connections', page.locator('.pins li').count() == 1)
    page.reload(); page.click('button:has-text("Continue")'); page.click('#nav button:has-text("Board")')
    check('the pin survives a refresh', page.locator('.pins li').count() == 1)
    page.click('[data-key="unpin-c02-d02"]')
    check('Unpin removes it', page.locator('.pins li').count() == 0)
    page.click('[data-key="rel-clear"]') if page.locator('[data-key="rel-clear"]').count() else None
    page.click('[data-key="tile-c01"]'); page.click('[data-key="tile-c12"]')
    check('two unconnected items say so, and offer no pin', 'records no connection' in page.inner_text('.relation') and page.locator('[data-key="rel-pin"]').count() == 0)
    check('no stray "null" text anywhere on the board', 'null' not in page.inner_text('#view').lower().replace('null:', ''), page.inner_text('.relation'))
    page.click('[data-key="tile-c03"]')
    check('a third selection replaces the oldest, never more than two', page.locator('.tile[aria-pressed="true"]').count() == 2)
    page.focus('[data-key="tile-c05"]'); page.keyboard.press('Enter')
    check('keyboard Enter selects a tile', page.get_attribute('[data-key="tile-c05"]', 'aria-pressed') == 'true')
    page.click('[data-key="rel-clear"]')
    page.click('[data-key="tile-c03"]'); page.click('[data-key="tile-d01"]')
    check('Dess’s timing account and the call log stay uncertain, not disputed', 'uncertain' in page.inner_text('.relation .rel').lower() and 'disputed' not in page.inner_text('.relation .rel').lower(), page.inner_text('.relation'))
    page.click('[data-key="rel-open-c03"]')
    check('chips on the board open the item in the dialog', dlg() and 'Emergency call log' in page.inner_text('#inspect h2'))
    page.keyboard.press('Escape')

    print('Places')
    page.click('#nav button:has-text("Places")')
    check('every place has a picture and they all load', page.locator('.places-tabs button').count() == 6 and imgs_ok('.place img, .places-tabs img'))
    page.click('[data-key="place-house"]')
    check('choosing a place shows its description', 'The Hartwell house' in page.inner_text('.place h2') and 'landline' in page.inner_text('.place'))
    page.click('[data-key="pl-c03"]')
    check('items from a place open in the dialog', dlg()); page.keyboard.press('Escape')
    check('place links return focus to where you were', page.evaluate("document.activeElement.getAttribute('data-key')") == 'pl-c03')
    check('items not yet found are not listed, only counted', 'not in the file yet' in page.inner_text('.place') and page.locator('[data-key="pl-t03"]').count() == 0)
    page.click('[data-key="pp-corin"]')
    check('a person at a place leads to that interview', page.get_attribute('[data-key="who-corin"]', 'aria-pressed') == 'true')

    print('Interviews')
    page.click('[data-key="who-dess"]')
    check('each witness has a portrait that loads', imgs_ok('.profile-img') and page.locator('.profile-img').count() == 1)
    check('trust is shown as a gauge with a text label', page.get_attribute('.pips', 'aria-label').startswith('Trust '))
    page.click('[data-key="who-teo"]')
    check('evidence-based questions show which item they use', page.locator('[data-key="ref-teo-photo"]').count() == 1)
    page.click('[data-key="ref-teo-photo"]')
    check('and that reference opens the item', dlg() and 'Photograph' in page.inner_text('#inspect h2')); page.keyboard.press('Escape')
    names = page.evaluate("[...document.querySelectorAll('.people button img')].map(i => i.getAttribute('src'))")
    check('the six interviewees each have their own portrait', len(set(names)) == 5, names)

    print('Timeline')
    page.click('#nav button:has-text("Timeline")')
    page.click('[data-key="ev-e1"]')
    check('opening an event reveals its source', page.get_attribute('[data-key="ev-e1"]', 'aria-expanded') == 'true' and 'Vote sheet' in page.inner_text('#evd-e1'))
    check('the unobserved stretch is NOT marked before you answer', page.locator('.ev.in-range').count() == 0)
    page.click('[data-key="ev-e1"]')
    check('it closes again', page.get_attribute('[data-key="ev-e1"]', 'aria-expanded') == 'false')
    page.check('[data-key="tl-tl-b"]')
    check('after answering, your chosen stretch is marked', page.locator('.ev.in-range').count() == 4)
    check('timeline wording names the vote night without claiming Nell left', 'night of the vote' in page.inner_text('#view') and 'night Nell left' not in page.inner_text('#view'))

    print('Guidance')
    nxt = page.inner_text('#hint .next'); page.click('#hint .next')
    check('the Next hint goes somewhere real', nxt.lower().startswith('next') and page.evaluate("document.querySelector('#nav button[aria-current=page]') !== null"), nxt)

    print('Reduced motion and offline')
    rctx = browser.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce')
    r = rctx.new_page(); rreq = []
    r.on('request', lambda q: rreq.append(q.url) if not q.url.startswith(('file:', 'data:')) else None)
    r.goto(URL)
    check('title animation is off under reduced motion', r.evaluate("getComputedStyle(document.querySelector('.fog')).animationName") == 'none')
    r.click('button:has-text("Begin")'); r.click('button:has-text("Open the evidence")')
    check('page transitions are off under reduced motion', r.evaluate("getComputedStyle(document.getElementById('view')).animationName") == 'none')
    check('nothing is fetched from the network: every request is a local file', not rreq, rreq)
    rctx.close()
    allimgs = page.evaluate("NULLGAME.ART.allImages()")
    ok = page.evaluate("""async (list) => (await Promise.all(list.map(src => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = src; })))).every(Boolean)""", allimgs)
    check(f'all {len(allimgs)} image assets load in the browser', ok)

    mctx = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    m = mctx.new_page(); m.on('pageerror', lambda e: errors.append('mobile pageerror: ' + str(e)))
    m.on('console', lambda x: errors.append('mobile: ' + x.text) if x.type == 'error' else None)
    m.goto(URL); m.click('button:has-text("Begin")'); m.click('button:has-text("Open the evidence")')
    for screen in ['Evidence', 'Interviews', 'Timeline', 'Verdicts', 'Retelling']:
        m.click(f'#nav button:has-text("{screen}")')
        ov = m.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(f'mobile: no horizontal overflow on {screen}', ov <= 0, ov)
    m.click('#nav button:has-text("Evidence")'); settle(m); m.screenshot(path=os.path.join(SHOTS, 'evidence-mobile.png'))
    small = m.evaluate("[...document.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 40).length")
    check('mobile: every visible button is at least 40px tall', small == 0, small)


    print('Mobile touch')
    m.click('#nav button:has-text("Interviews")'); m.click('[data-key="ask-dess-what"]'); m.click('[data-key="ask-dess-when"]'); m.click('[data-key="ask-dess-safe"]')
    m.click('#nav button:has-text("Board")')
    m.tap('[data-key="tile-c02"]'); m.tap('[data-key="tile-d02"]')
    check('mobile: tapping two tiles shows the relationship', 'Dess says the message was hers' in m.inner_text('.relation'))
    check('mobile: the relation panel leaves room for the board', m.evaluate("document.querySelector('.relation').getBoundingClientRect().height") < 844 * 0.5)
    m.tap('[data-key="rel-pin"]')
    check('mobile: pin works by touch', m.locator('.pins li').count() == 1)
    for screen in ['Board', 'Places']:
        m.click(f'#nav button:has-text("{screen}")')
        ov = m.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(f'mobile: no horizontal overflow on {screen}', ov <= 0, ov)
    m.click('#nav button:has-text("Evidence")'); m.tap('[data-key="ex-c01"]')
    box = m.evaluate("(() => { const r = document.getElementById('inspect').getBoundingClientRect(); return [r.width, r.height]; })()")
    check('mobile: the dialog fills the screen', box[0] >= 388 and box[1] >= 840, box)
    check('mobile: dialog has no horizontal overflow', m.evaluate("document.getElementById('inspect').scrollWidth <= document.getElementById('inspect').clientWidth"))
    small = m.evaluate("[...document.querySelectorAll('#inspect button')].filter(b => b.getBoundingClientRect().height < 40).length")
    check('mobile: dialog buttons are all touch-sized', small == 0, small)
    m.tap('[data-key="ins-close"]')
    check('mobile: dialog closes by touch', not m.evaluate("document.getElementById('inspect').open"))
    for screen in ['Board', 'Places', 'Timeline']:
        m.click(f'#nav button:has-text("{screen}")')
        small = m.evaluate("[...document.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 40).length")
        check(f'mobile: every button on {screen} is touch-sized', small == 0, small)

    print('Late game and endings, both sizes (checkpoint 6)')
    LATE = """(args) => {
      const mode = args.mode, lang = args.lang || 'en';
      const G = NULLGAME, s = G.newState(); s.lang = lang; G.setLanguage(lang); localStorage.setItem(G.LANG_KEY, lang);
      const ask = (src, ids) => ids.forEach(i => G.ask(s, src, i));
      ask('dess',['dess-what','dess-when','dess-safe','dess-vote','dess-sheet','dess-rope','dess-nell']);
      ask('corin',['corin-dock','corin-rope','corin-source','corin-log','corin-sheet']);
      ask('teo',['teo-beach','teo-rope','teo-drink','teo-photo','teo-up']);
      ask('wren',['wren-last','wren-sign','wren-where','wren-meta','wren-tell']);
      ask('livia',['livia-rescue','livia-door','livia-number','livia-carry','livia-before','livia-sign-hi']);
      G.CARDS.forEach(c => { if (s.unlocked.includes(c.id)) G.classify(s, c.id, (c.truthIf&&c.truthIf.length)?c.truthIf[c.truthIf.length-1].truth:c.truth); });
      G.answerTimeline(s,'tl-b'); G.answerPages(s,'pg-c'); G.CLAIMS.forEach(c => G.setVerdict(s,c.id,G.claimCorrect(s,c)));
      const R = (a,b,c,w)=>{G.chooseRetell(s,'A',a);G.chooseRetell(s,'B',b);G.chooseRetell(s,'C',c);G.chooseAddressee(s,w);};
      const plan = { five:['A3','B2','C1','five'], letter:['A3','B2','C1','wren'], card:['A3','B2','C1','livia'], nell:['A3','B2','C1','nell'],
                     same:['A1','B1','C1','five'], noanswer:['A2','B3','C3','five'], struck:['A3','B2','C1','five'] }[mode];
      if (mode === 'struck') ['c01','c02','c03','c05','c12','n01','n02'].forEach(i => G.classify(s,i,'struck'));
      if (plan) { R(...plan); G.resolveEnding(s); } else s.screen = 'evidence';
      localStorage.setItem(G.SAVE_KEY, JSON.stringify(s)); return s.ending || s.screen;
    }"""
    for label, vp, touch in [('390px phone', {'width': 390, 'height': 844}, True), ('1280px desktop', {'width': 1280, 'height': 800}, False)]:
        lc = browser.new_context(viewport=vp, has_touch=touch, is_mobile=touch); lp = lc.new_page(); lerrs = []
        lp.on('console', lambda m_, e=lerrs: e.append(m_.text) if m_.type == 'error' else None); lp.on('pageerror', lambda e_, e=lerrs: e.append(str(e_)))
        for lang in ['en', 'ur']:
            lp.goto(URL); lp.evaluate(LATE, {'mode': 'mid', 'lang': lang}); lp.reload(); lp.click('[data-key="continue"]')
            for scr in ['briefing', 'evidence', 'interviews', 'places', 'timeline', 'board', 'pages', 'verdicts', 'retell']:
                b = lp.locator(f'#nav button[data-screen="{scr}"]')
                b.scroll_into_view_if_needed(); b.click(); lp.wait_for_timeout(80)
                ov = lp.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                check(f'{label} ({lang}): late game, no horizontal overflow on {scr}', ov <= 0, ov)
            for mode, name in [('five', 'THE FIVE'), ('letter', 'THE LETTER'), ('card', 'THE CARD'), ('nell', 'NELL / THE FIVE'), ('same', 'THE SAME SENTENCE'), ('noanswer', 'NO ANSWER'), ('struck', 'STRUCK')]:
                lp.goto(URL); got = lp.evaluate(LATE, {'mode': mode, 'lang': lang}); lp.reload(); lp.click('[data-key="continue"]'); settle(lp)
                ov = lp.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                check(f'{label} ({lang}): {name} ending shows and has no horizontal overflow', got == name and ov <= 0, (got, ov))
                if lp.locator('details summary').count():
                    notes = [t.strip() for t in lp.locator('details li').all_text_contents()]
                    check(f'{label} ({lang}): {name} explanation has notes and never repeats one', len(notes) > 0 and len(notes) == len(set(notes)), notes)
                check(f'{label} ({lang}): {name} ending image loaded', lp.evaluate("[...document.querySelectorAll('img')].every(i => i.complete && i.naturalWidth > 0)"))
            if lang == 'ur':
                missing = lp.evaluate("[...(NULLGAME.translationMisses || [])]")
                check(f'{label}: rendered Roman Urdu screens and endings have no missing translations', len(missing) == 0, missing)
        check(f'{label}: no console or page errors in the late-game pass', not lerrs, lerrs)
        lc.close()

    check('no console errors, page errors or failed requests', not errors, errors)
    browser.close()

print(f'\n{passes} passed, {len(fails)} failed')
sys.exit(1 if fails else 0)
