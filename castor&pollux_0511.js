// castor.js w/comments
// Latest Additions: Baseline Chassis, Hardened Phase-0 Quota Intercept, Strict-Left Tour Guide, API Sourcing Integrations.
// Note: So far so good. Google Cloud integrations?
///////////////////////////////////////////////////

(function () {
    'use strict';

    // ─── PHASE-0: HARDENED STORAGE INTERCEPT ─────────────────────────────────────
    const _BLOCKED = new Set(['console-history', 'con-tline']);

    // 1. Purge any values already written before this script loaded
    _BLOCKED.forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
        try { sessionStorage.removeItem(k); } catch(e) {}
    });

    // 2. Lock Storage.prototype.setItem as non-configurable so DevTools/the host
    //    cannot re-define it after us. This is the critical missing flag.
    try {
        const _origSet = Storage.prototype.setItem;
        Object.defineProperty(Storage.prototype, 'setItem', {
            value: function(key, val) {
                if (_BLOCKED.has(key)) return;       // silently drop
                return _origSet.call(this, key, val);
            },
            writable:     false,   // cannot be reassigned
            configurable: false,   // cannot be re-defined — this is the key change
            enumerable:   false
        });
    } catch(e) {}

    // 3. Define non-enumerable, non-configurable traps on the storage INSTANCES.
    //    enumerable:false stops the keys from showing up as "settings" in the log.
    //    configurable:false prevents the host from re-defining them.
    _BLOCKED.forEach(k => {
        [window.localStorage, window.sessionStorage].forEach(store => {
            try {
                Object.defineProperty(store, k, {
                    get: () => '[]',
                    set: () => {},        // drop direct-assignment writes (store[k] = v)
                    enumerable:   false,  // ← fixes the "size: undefined" prototype bleed
                    configurable: false   // ← prevents host from overwriting the trap
                });
            } catch(e) {}
        });
    });

    // 4. Fallback sweep — bypasses any intercept that slipped through by calling
    //    removeItem via the prototype directly to avoid our own setter trap.
    const _origRemove = Storage.prototype.removeItem;
    setInterval(() => {
        _BLOCKED.forEach(k => {
            try { _origRemove.call(localStorage,   k); } catch(e) {}
            try { _origRemove.call(sessionStorage, k); } catch(e) {}
        });
    }, 1000); // tightened to 1000ms

    // Diagnostic: confirm page-side trap is active
    console.log('[CASTOR] Storage trap active:',
        Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem')?.configurable === false
            ? '✅ LOCKED' : '⚠️ NOT LOCKED'
    );
    // ─────────────────────────────────────────────────────────────────────────────

    /* ─────────────────────────────────────────────
       1. I18N, UTILS, TRUSTED TYPES & STATE
    ──────────────────────────────────────────── */

    const LANG = navigator.language.split('-')[0] === 'es' ? 'es' : 'en';

    let _ttPolicy;
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try { _ttPolicy = window.trustedTypes.createPolicy('castor-core-policy', { createHTML: s => s, createScript: s => s, createScriptURL: s => s }); }
        catch (e) { _ttPolicy = window.trustedTypes.defaultPolicy; }
    }
    const safeHTML = (str) => _ttPolicy ? _ttPolicy.createHTML(str) : str;

    let _pristineFetch = window.fetch;
    try {
        const fFrame = document.createElement('iframe');
        fFrame.style.display = 'none';
        document.body.appendChild(fFrame);
        _pristineFetch = fFrame.contentWindow.fetch;
    } catch(e) {}

    function mkEl(tag, attrs = {}, children = []) {
        const e = document.createElement(tag);
        for (const k in attrs) {
            if (k === 'style') e.style.cssText = attrs[k];
            else if (k === 'id') e.id = attrs[k];
            else if (k === 'class') e.className = attrs[k];
            else if (k === 'textContent') e.textContent = attrs[k];
            else if (k === 'innerHTML') e.innerHTML = safeHTML(attrs[k]);
            else if (typeof attrs[k] === 'function') e[k] = attrs[k];
            else if (['selected', 'checked', 'disabled'].includes(k)) {
                if (attrs[k]) e.setAttribute(k, '');
            }
            else if (['value', 'title', 'aria-label', 'href', 'target', 'src', 'alt', 'type', 'placeholder', 'accept', 'name'].includes(k)) {
                e.setAttribute(k, attrs[k]);
            }
        }
        if (children) {
            (Array.isArray(children) ? children : [children]).forEach(c => {
                if (typeof c === 'string') e.appendChild(document.createTextNode(c));
                else if (c instanceof Node) e.appendChild(c);
            });
        }
        return e;
    }

    function icoFlat(emoji) { return mkEl('span', { class: 'icon-flat', 'aria-hidden': 'true' }, [emoji]); }
    function btnLayout(emoji, label) {
        return [
            mkEl('div', { class: 'icon-circle', 'aria-hidden': 'true' }, [emoji]),
            mkEl('span', { class: 'key-text' }, [label])
        ];
    }

    const storage = {
        get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
        set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
        sGet: (k, d) => { try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch { return d; } },
        sSet: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    };

    const C = {
        themes: [
            { name: "Terminal Teriyaki", ui: 'linear-gradient(135deg, rgba(30,20,10,0.95), rgba(20,40,20,0.95))', hex: '#39ff14', border: 'rgba(57, 255, 20, 0.4)' },
            { name: "Chocolate Banana", ui: 'linear-gradient(135deg, rgba(54,28,14,0.95), rgba(30,15,5,0.95))', hex: '#FFE135', border: 'rgba(255, 225, 53, 0.4)' },
            { name: "Peach Sherbet", ui: 'linear-gradient(135deg, rgba(140,50,20,0.95), rgba(90,30,10,0.95))', hex: '#FF7F50', border: 'rgba(255, 127, 80, 0.5)' },
            { name: "Baked Potato", ui: 'linear-gradient(135deg, rgba(160,110,60,0.95), rgba(110,70,30,0.95))', hex: '#FFF8DC', border: 'rgba(255, 248, 220, 0.5)' },
            { name: "Raspberry Sauce", ui: 'linear-gradient(135deg, rgba(100,10,40,0.95), rgba(60,5,20,0.95))', hex: '#ff4d88', border: 'rgba(255, 77, 136, 0.4)' },
            { name: "Blackberry Sherbet", ui: 'linear-gradient(135deg, #190710, #41122A)', hex: '#ff7eb3', border: 'rgba(255, 126, 179, 0.4)' },
            { name: "Peach Jam", ui: 'linear-gradient(135deg, rgba(180,80,20,0.95), rgba(120,40,5,0.95))', hex: '#FFB07C', border: 'rgba(255, 176, 124, 0.5)' },
            { name: "Peanut Butter & Jelly", ui: 'linear-gradient(135deg, rgba(180,120,60,0.95), rgba(90,30,120,0.95))', hex: '#E2C280', border: 'rgba(226, 194, 128, 0.5)' },
            { name: "Scotch Bonnet Pepper", ui: 'linear-gradient(135deg, rgba(160,30,0,0.95), rgba(100,10,0,0.95))', hex: '#FF6600', border: 'rgba(255, 102, 0, 0.5)' },
            { name: "Garlic Naan", ui: 'linear-gradient(135deg, rgba(120,70,30,0.95), rgba(70,40,15,0.95))', hex: '#F2E8C6', border: 'rgba(242, 232, 198, 0.5)' },
            { name: "Chicken & Waffles", ui: 'linear-gradient(135deg, rgba(190,130,40,0.95), rgba(130,70,10,0.95))', hex: '#FFD700', border: 'rgba(255, 215, 0, 0.5)' },
            { name: "Soup Joumou", ui: 'linear-gradient(135deg, rgba(170,130,20,0.95), rgba(100,110,30,0.95))', hex: '#FFB61E', border: 'rgba(255, 182, 30, 0.5)' },
            { name: "Diri ak Djon Djon", ui: 'linear-gradient(135deg, rgba(30,30,30,0.98), rgba(15,15,15,0.98))', hex: '#D3D3D3', border: 'rgba(211, 211, 211, 0.4)' },
            { name: "Margarita Pizza", ui: 'linear-gradient(135deg, rgba(160,30,30,0.95), rgba(30,100,30,0.95))', hex: '#FFD700', border: 'rgba(255, 215, 0, 0.5)' }
        ],
        focusOpts: [
            { id: "auto", name: "Focus: Auto" },
            { id: "projects", name: "Focus: Projects" },
            { id: "media", name: "Focus: Media/Lore" },
            { id: "research", name: "Focus: Research" },
            { id: "code", name: "Focus: Code" },
            { id: "dialogue", name: "Focus: Dialogue" },
            { id: "knowledge", name: "Focus: Knowledge" },
            { id: "generated_content", name: "Focus: Gen Content" }
        ],
        excl: [/android/i, /location history/i, /youtube music/i],
        limits: { RPD: 1500 }
    };

    const S = {
        run: false, key: null, idb: null, cull: 0, saved: 0, log: [], nodes: {},
        queue: [], active: 0, workers: 5, seen: new WeakSet(), queueHalted: false,
        aiDataset: [], metro: null, pipWindow: null, knownHashes: new Set(),
        agent: storage.get('gae_agent', 'Gemini'),
        apik: storage.sGet('gae_api', ''),
        model: storage.get('gae_model', 'gemini-2.5-flash'),
        focus: storage.get('gae_focus', 'auto'),
        uiTheme: parseInt(storage.get('gae_uitheme', 0)), pos: storage.get('gae_pos', 'right'), min: false,
        audioInit: false, audioCtx: null, scriptNode: null, audioTime: 0, audioToggled: storage.get('gae_audio', false),
        animPaused: false, fxEnabled: false, sessionConfirmed: false,
        quota: storage.get('gae_quota', { date: new Date().toDateString(), reqs: 0, toks: 0 })
    };

    let _apiWindow = 0;
    let _apiBackoff = 0;

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const sysLog = (msg, color = "var(--gae-ui-accent)") => {
        const ts = new Date().toISOString().split('T')[1].slice(0,-1);
        let safeMsg = S.apik && S.apik.length > 5 ? msg.replace(new RegExp(S.apik, 'g'), '[REDACTED_KEY]') : msg;
        const logLine = `[${ts}] > ${safeMsg}`;

        if (S.nodes.logContainer) {
            const entry = mkEl('div', { class: 'log-line', style: `color:${color};` }, [logLine]);
            S.nodes.logContainer.appendChild(entry);
            while (S.nodes.logContainer.childNodes.length > 40) {
                S.nodes.logContainer.firstChild.remove();
            }
            S.nodes.termConsole.scrollTop = S.nodes.termConsole.scrollHeight;
        }
    };

    const updTele = () => {
        if (S.nodes.termMeta) {
            S.nodes.termMeta.textContent = `SYS.SEC: AES-GCM\nSYS.STO: IDB V2\nSYS.QTA: ${S.quota.reqs}/${C.limits.RPD} REQ\nOP.VAUL: ${S.saved}\nOP.SFTV: ${S.aiDataset.length}\nOP.QUEU: ${S.queue.length}\nOP.WORK: ${S.active}`;
        }
        if (S.nodes.pipStats) {
            S.nodes.pipStats.textContent = `PROCESSED: ${S.cull}\nVAULT: ${S.saved}\nSFT VAULT: ${S.aiDataset.length}\nQUEUE: ${S.queue.length}\nQUOTA: ${S.quota.reqs}`;
        }
        if (S.nodes.mini) S.nodes.mini.textContent = `C: ${S.cull} | V: ${S.saved} | Q: ${S.queue.length}`;
    };

    /* ─────────────────────────────────────────────
       2. NATIVE ZERO-DEPENDENCY ZIP ENCODER (UTF-8 FORCED)
    ──────────────────────────────────────────── */

    const generateNativeZip = (records) => {
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            crcTable[n] = c >>> 0;
        }
        const crc32 = (buf) => {
            let crc = 0 ^ (-1);
            for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
            return (crc ^ (-1)) >>> 0;
        };

        const write32 = (n) => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
        const write16 = (n) => [n & 0xFF, (n >>> 8) & 0xFF];
        const enc = new TextEncoder();

        let zipData = [], centralDir = [], offset = 0;
        let files = [];

        records.forEach((record, idx) => {
            const title = record.topic_summary ? record.topic_summary.slice(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : `Record_${idx}`;
            const folderName = ['projects', 'code', 'media'].includes(record.category) ? record.category.charAt(0).toUpperCase() + record.category.slice(1) : 'General';
            const tags = record.tags ? record.tags.map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '_')}`).join(' ') : '';

            const mdContent = `---\r\ncategory: ${record.category || 'unknown'}\r\ncomplexity: ${record.complexity_level || 'moderate'}\r\ndate: ${record.scraped_at || new Date().toISOString()}\r\nuuid: ${record.conversation_id || 'N/A'}\r\n---\r\n# ${record.topic_summary || 'Untitled Conversation'}\r\n\r\n${tags}\r\n\r\n${record.messages ? record.messages.map(m => `### ${m.role.toUpperCase()}\r\n${m.content.replace(/\n/g, '\r\n')}`).join('\r\n\r\n') : 'No messages found.'}\r\n`;

            files.push({ name: `${folderName}/${title}.md`, content: mdContent });
        });

        files.forEach(f => {
            const nameBuf = enc.encode(f.name);
            const dataBuf = enc.encode(f.content);
            const crc = crc32(dataBuf);
            const size = dataBuf.length;

            let lfh = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
            lfh.push(...write32(crc), ...write32(size), ...write32(size), ...write16(nameBuf.length), 0x00, 0x00);
            lfh.push(...nameBuf);
            zipData.push(new Uint8Array(lfh), dataBuf);

            let cd = [0x50, 0x4b, 0x01, 0x02, 0x14, 0x00, 0x14, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
            cd.push(...write32(crc), ...write32(size), ...write32(size), ...write16(nameBuf.length), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
            cd.push(...write32(offset), ...nameBuf);
            centralDir.push(new Uint8Array(cd));

            offset += lfh.length + dataBuf.length;
        });

        let cdLen = centralDir.reduce((a, b) => a + b.length, 0);
        let eocd = [0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, ...write16(files.length), ...write16(files.length), ...write32(cdLen), ...write32(offset), 0x00, 0x00];

        const finalZip = new Uint8Array(offset + cdLen + eocd.length);
        let ptr = 0;
        zipData.forEach(b => { finalZip.set(b, ptr); ptr += b.length; });
        centralDir.forEach(b => { finalZip.set(b, ptr); ptr += b.length; });
        finalZip.set(eocd, ptr);

        return new Blob([finalZip], { type: 'application/zip' });
    };

    const exportObsidianVault = async () => {
        if (S.aiDataset.length === 0) return sysLog("SFT Vault is empty. Generate SFT first.", "#ff4d4d");
        sysLog("Compiling Native Obsidian Vault (CSP-Safe)...", "#ff9933");
        try {
            const blob = generateNativeZip(S.aiDataset);
            dl(blob, `Castor_Obsidian_Vault_${Date.now()}.zip`, 'application/zip');
            sysLog("Obsidian Vault Downloaded.", "#4dff4d");
        } catch (err) { sysLog(`Failed to build Vault: ${err.message}`, "#ff4d4d"); }
    };

    /* ─────────────────────────────────────────────
       3. AEGIS REDACTOR, SENTINEL & CRYPTO
    ──────────────────────────────────────────── */

    const Aegis = {
        patterns: [
            { name: "IPV4", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
            { name: "EMAIL", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
            { name: "GCP_KEY", regex: /AIza[0-9A-Za-z-_]{35}/g },
            { name: "AWS_KEY", regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g },
            { name: "BEARER", regex: /Bearer\s[a-zA-Z0-9\-\._~\+/]+/gi }
        ],
        sanitize: (text) => {
            let cleanText = text;
            Aegis.patterns.forEach(p => { cleanText = cleanText.replace(p.regex, `[REDACTED_${p.name}]`); });
            return cleanText;
        }
    };

    const Sentinel = {
        estimateTokens: (text) => Math.ceil(text.split(/\s+/).length * 1.3),
        checkPulse: (payloadString) => {
            const today = new Date().toDateString();
            if (S.quota.date !== today) S.quota = { date: today, reqs: 0, toks: 0 };
            if (S.quota.reqs >= C.limits.RPD - 5) throw new Error("DAILY QUOTA EXHAUSTED (1500 Req Limit)");
            const estToks = Sentinel.estimateTokens(payloadString);
            S.quota.reqs += 1;
            S.quota.toks += estToks;
            storage.set('gae_quota', S.quota);
            updTele();
            return true;
        }
    };

    class ApiSemaphore {
        constructor() { this.locked = false; }
        async acquire() { while (this.locked) await sleep(50); this.locked = true; }
        release() { this.locked = false; }
    }
    const gatewayLock = new ApiSemaphore();

    const hashText = async (text) => {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const safeApiFetch = async (url, options, actionName = "API", payloadString = "") => {
        Sentinel.checkPulse(payloadString);
        await gatewayLock.acquire();

        let attempt = 0;
        // ASSUMPTION: Extended limit from 5 to 8 to survive prolonged API outages without dropping batches.
        const MAX_RETRIES = 8;
        let consecutive503s = 0; // ASSUMPTION: Circuit breaker state for catastrophic endpoint failure
        options.credentials = 'omit';

        try {
            while (attempt < MAX_RETRIES) {
                const now = Date.now();
                if (now > _apiWindow + 120000) _apiBackoff = 0;

                if (now < _apiWindow) {
                    const wait = _apiWindow - now;
                    sysLog(`[${actionName}] Regulating flow. Holding ${~~(wait/1000)}s...`, "#ff9933");
                    await sleep(wait);
                }

                try {
                    const res = await _pristineFetch(url, options);

                    if (!res.ok) {
                        if (res.status === 429 || res.status === 503) {
                            const retryAfter = parseInt(res.headers.get('Retry-After') || '0');
                            const e = new Error(`Gateway Error (${res.status})`);
                            e.retryAfter = retryAfter;
                            e.status = res.status;
                            throw e;
                        }
                        let errText = `HTTP ${res.status}`;
                        try {
                            const errJson = await res.json();
                            if (errJson.error && errJson.error.message) errText += `: ${errJson.error.message}`;
                        } catch(parseErr) {}
                        throw new Error(errText);
                    }

                    const jitter = Math.random() * 3000;
                    _apiWindow = Date.now() + 12000 + jitter + (Math.min(_apiBackoff, 10) * 3000);
                    return await res.json();

                } catch (err) {
                    attempt++;

                    // CIRCUIT BREAKER: Abort early on hard server outages
                    if (err.status === 503) consecutive503s++;
                    else consecutive503s = 0;

                    if (consecutive503s >= 3) {
                        sysLog(`[${actionName}] CIRCUIT BREAKER TRIPPED: Endpoint unresponsive.`, "#ff4d4d");
                        throw new Error(`CircuitBreaker503`);
                    }

                    if (err.status === 429 || err.status === 503 || err.message.includes('Failed to fetch')) {
                        _apiBackoff++;
                        const serverWait = (err.retryAfter || 0) * 1000;
                        const jitter = Math.random() * 5000;
                        // Extended wait logic capped at 180s per cycle
                        const baseWait = attempt === 1 ? 60000 : Math.min(180000, 30000 * Math.pow(2, attempt - 1));
                        const clientWait = baseWait + jitter;
                        const wait = Math.max(serverWait, clientWait);

                        _apiWindow = Date.now() + wait;
                        sysLog(`[${actionName}] Endpoint volatile (HTTP ${err.status || 'Network'}). Enacting backoff: ${~~(wait/1000)}s... (${MAX_RETRIES - attempt} left)`, "#ff9933");
                        await sleep(wait);
                    } else {
                        sysLog(`[${actionName}] Routine interference: ${err.message}. Re-attempting... (${MAX_RETRIES - attempt} left)`, "#ff9933");
                        await sleep(5000);
                    }
                    if (attempt >= MAX_RETRIES) {
                        sysLog(`[${actionName}] CRITICAL FAULT: Cycle failed completely. Verify API status or switch models.`, "#ff4d4d");
                        throw new Error(`Max retries reached for ${actionName}. Error: ${err.message}`);
                    }
                }
            }
        } finally {
            gatewayLock.release();
        }
    };

    /* ─────────────────────────────────────────────
       4. TOUR GUIDE SYSTEM (DYNAMIC LEFT-ANCHOR & TYPED OM)
    ──────────────────────────────────────────── */

    const Tour = {
        idx: 0, tmr: null, tLeft: 100, paused: false, steps: [], el: null, bar: null, msg: null, btnP: null,
        init(steps) {
            this.steps = steps; this.idx = 0; this.paused = false; this.tLeft = 100;
            if (!this.el) {
                this.el = mkEl('div', { style: 'position:fixed;z-index:9999999;background:var(--gae-ui-bg, rgba(0,0,0,0.95));border:1px solid var(--gae-ui-accent, #FFE135);color:#fff;padding:15px;border-radius:12px;box-shadow:0 10px 50px rgba(0,0,0,0.9);width:280px;transition:opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);backdrop-filter:blur(20px);display:none;flex-direction:column;gap:12px;font-family:monospace;font-size:13px;pointer-events:auto;left:20px;top:20px;' });

                this.msg = mkEl('div', { style: 'line-height:1.5;' });

                const progWrap = mkEl('div', { style: 'height:4px;background:rgba(255,255,255,0.2);border-radius:2px;width:100%;overflow:hidden;' });
                this.bar = mkEl('div', { style: 'height:100%;background:var(--gae-ui-accent, #FFE135);width:100%;transition:width 0.1s linear;' });
                progWrap.appendChild(this.bar);

                const ctrl = mkEl('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:5px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;' });

                this.btnP = mkEl('button', { style: 'background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;cursor:pointer;font-size:14px;padding:4px 10px;transition:all 0.2s;', title: 'Pause / Play', onclick: () => this.toggle() }, ['⏸️']);
                const btnS = mkEl('button', { style: 'background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;cursor:pointer;font-size:14px;padding:4px 10px;transition:all 0.2s;', title: 'Skip Step', onclick: () => this.next() }, ['⏭️']);
                const btnX = mkEl('button', { style: 'background:rgba(0,0,0,0.5);border:1px solid rgba(255,100,100,0.4);border-radius:4px;color:#ff5555;cursor:pointer;font-size:14px;padding:4px 10px;transition:all 0.2s;', title: 'Exit Walkthrough', onclick: () => this.end() }, ['❌']);

                [this.btnP, btnS, btnX].forEach(b => {
                    b.onmouseover = () => b.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    b.onmouseout = () => b.style.backgroundColor = 'rgba(0,0,0,0.5)';
                });

                ctrl.append(this.btnP, btnS, btnX);
                this.el.append(this.msg, progWrap, ctrl);
                document.body.appendChild(this.el);
            }
            this.show();
        },
        show() {
            if (this.idx >= this.steps.length) return this.end();
            const s = this.steps[this.idx], t = document.querySelector(s.sel);

            if (!t || t.getBoundingClientRect().height === 0) {
                this.idx++; return this.show();
            }

            this.msg.innerHTML = safeHTML(`<strong>Step ${this.idx + 1}/${this.steps.length}</strong><br/><br/>${s.txt}`);

            const origShadow = t.style.boxShadow;
            t.style.boxShadow = '0 0 0 4px var(--gae-ui-accent, #FFE135)';
            setTimeout(() => t.style.boxShadow = origShadow, 2000);

            try { t.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); } catch(e) {}

            this.tLeft = 100;
            this.el.style.display = 'flex';
            this.run();
        },
        toggle() { this.paused = !this.paused; this.btnP.textContent = this.paused ? '▶️' : '⏸️'; },
        run() {
            clearInterval(this.tmr);
            this.tmr = setInterval(() => {
                if (this.paused) return;
                this.tLeft -= 1; this.bar.style.width = `${this.tLeft}%`;

                // DYNAMIC ANCHOR TRACKING (Strict Left Alignment with Vertical Push fallback)
                const s = this.steps[this.idx], t = s ? document.querySelector(s.sel) : null;
                if (t) {
                    const r = t.getBoundingClientRect(), wh = window.innerHeight, ww = window.innerWidth;
                    let top = (r.top) | 0;
                    let left = (r.left - 295) | 0; // Strict left clearance (280px + 15px gap)

                    if (left < 10) {
                        left = 10;
                        if (r.bottom + 180 < wh) top = (r.bottom + 15) | 0; // Drop below
                        else top = (r.top - 180) | 0; // Pop above
                    }

                    if (top < 10) top = 10;
                    if (left + 295 > ww) left = (ww - 295) | 0;

                    // PERFORMANCE HOUDINI: CSS Typed OM avoids string concatenation parsing overhead.
                    if (this.el.attributeStyleMap && typeof CSS !== 'undefined') {
                        this.el.attributeStyleMap.set('top', CSS.px(top));
                        this.el.attributeStyleMap.set('left', CSS.px(left));
                    } else {
                        this.el.style.top = `${top}px`;
                        this.el.style.left = `${left}px`;
                    }
                }

                if (this.tLeft <= 0) this.next();
            }, 100);
        },
        next() { this.idx++; this.show(); },
        end() { clearInterval(this.tmr); if (this.el) this.el.style.display = 'none'; storage.set('gae_tour_done', true); sysLog("Walkthrough sequence terminated.", "#aaaaaa"); }
    };

    const castorSteps = [
        { sel: '.gae-panel-wrapper', txt: "Welcome to Castor. This panel manages the matrix extraction engine." },
        { sel: '#gae-api-key', txt: "Input your AI provider API key here. It remains volatile and clears when you close the session." },
        { sel: '#gae-api-key-links', txt: "Need a key? Use these shortcuts.<br/><br/><strong style='color:#ff7b7b'>SECURITY WARNING:</strong> Dispose of keys generated for this purpose once you've completed your use of them, ideally within the same day or hour." },
        { sel: 'button[aria-label="Probe Available Models"]', txt: "Click Probe to scan for available models based on your secure key." },
        { sel: '#gae-sel-focus', txt: "Adjust parsing focus. For example, 'Code' enforces rigid technical formatting on output." },
        { sel: 'button[aria-label="Toggle Scraper Execution"]', txt: "Engage the automated scraper to systematically extract DOM payloads as you scroll." },
        { sel: 'button[aria-label="Generate SFT Dataset via AI"]', txt: "Purify raw conversational logs into highly structured, fine-tuning JSONL format." },
        { sel: 'button[aria-label="Generate Obsidian Vault File"]', txt: "Export a native Obsidian vault containing all extracted knowledge for offline viewing." }
    ];

    /* ─────────────────────────────────────────────
       5. PROCEDURAL AUDIO & METRONOME
    ──────────────────────────────────────────── */

    const initAudio = () => {
        if (S.audioInit) return;
        try {
            S.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            S.scriptNode = S.audioCtx.createScriptProcessor(4096, 1, 1);
            const gain = S.audioCtx.createGain();

            S.scriptNode.onaudioprocess = (e) => {
                const output = e.outputBuffer.getChannelData(0);
                const sampleRate = S.audioCtx.sampleRate;
                for (let i = 0; i < output.length; i++) {
                    let bt = ~~(S.audioTime * 8000 / sampleRate);
                    let val = (bt * ((bt>>12|bt>>8)&63&bt>>4)) & 255;
                    output[i] = (val / 128.0) - 1.0;
                    S.audioTime++;
                }
            };

            gain.gain.setValueAtTime(0.001, S.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.15, S.audioCtx.currentTime + 3);
            S.scriptNode.connect(gain);
            gain.connect(S.audioCtx.destination);
            S.audioInit = true;
            if (S.audioCtx.state === 'running') sysLog("Audio Wake-Lock active.", "#4dff4d");
        } catch (err) {}
    };

    const toggleMusic = () => {
        S.audioToggled = !S.audioToggled;
        storage.set('gae_audio', S.audioToggled);
        if (S.audioToggled) {
            if (!S.audioInit) initAudio();
            if (S.audioCtx && S.audioCtx.state === 'suspended') S.audioCtx.resume();
            if (S.nodes.btnAudio) { S.nodes.btnAudio.replaceChildren(icoFlat('🔊')); S.nodes.btnAudio.style.opacity = '1'; }
        } else {
            if (S.audioCtx && S.audioCtx.state === 'running') S.audioCtx.suspend();
            if (S.nodes.btnAudio) { S.nodes.btnAudio.replaceChildren(icoFlat('🔈')); S.nodes.btnAudio.style.opacity = '0.5'; }
        }
    };

    const initMetronome = () => {
        S.metro = {
            tTmr: null, sTmr: null,
            postMessage: function(cmd) {
                if (cmd === 'run') {
                    this.tTmr = setInterval(() => { if (S.run) executeScanner(); }, 800);
                    this.sTmr = setInterval(() => {
                        if (S.run && !S.queueHalted) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }, 9000);
                } else if (cmd === 'halt') {
                    clearInterval(this.tTmr); clearInterval(this.sTmr);
                }
            }
        };
    };

    /* ─────────────────────────────────────────────
       6. DATA LAYER (IDB & SECURE VAULT)
    ──────────────────────────────────────────── */

    const initDB = () => new Promise((resolve, reject) => {
        const req = indexedDB.open('CastorVaultDB', 2);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('vault')) db.createObjectStore('vault', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('sft_vault')) db.createObjectStore('sft_vault', { keyPath: 'id', autoIncrement: true });
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => reject('IDB Error');
    });

    const initSec = async () => {
        try {
            let jwk = storage.get('gae_vault_key', null);
            if (jwk) {
                S.key = await crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
            } else {
                S.key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
                jwk = await crypto.subtle.exportKey("jwk", S.key);
                storage.set('gae_vault_key', jwk);
            }
            S.idb = await initDB();

            try {
                const tx = S.idb.transaction('vault', 'readonly');
                const req = tx.objectStore('vault').getAll();
                req.onsuccess = async () => {
                    for (const encRecord of req.result) {
                        try {
                            const ct = new Uint8Array(atob(encRecord.data).split('').map(c => c.charCodeAt(0)));
                            const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ct.slice(0, 12) }, S.key, ct.slice(12));
                            const record = JSON.parse(new TextDecoder().decode(dec));
                            if (!record.hash) record.hash = await hashText(record.original);
                            S.knownHashes.add(record.hash);
                            S.log.push(record);
                        } catch(e) {}
                    }
                    S.saved = S.log.length; updTele();
                };
            } catch (e) { sysLog("Primary Vault schema fault.", "#ff4d4d"); }

            try {
                const txSft = S.idb.transaction('sft_vault', 'readonly');
                const reqSft = txSft.objectStore('sft_vault').getAll();
                reqSft.onsuccess = async () => {
                    for (const encRecord of reqSft.result) {
                        try {
                            const ct = new Uint8Array(atob(encRecord.data).split('').map(c => c.charCodeAt(0)));
                            const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ct.slice(0, 12) }, S.key, ct.slice(12));
                            S.aiDataset.push(JSON.parse(new TextDecoder().decode(dec)));
                        } catch(e) {}
                    }
                    updTele();
                };
            } catch (e) {}

            sysLog("Vaults unlocked via AES-GCM.", "#4dff4d"); return true;
        } catch { sysLog("Vault unlock FAILED.", "#ff4d4d"); return false; }
    };

    const extractMediaUrls = (node) => {
        return Array.from(node.querySelectorAll('img, video'))
            .filter(el => el.src && !el.src.includes('gstatic.com') && !el.src.includes('data:'))
            .map(el => el.src);
    };

    const saveVault = async (record) => {
        if (!S.idb || !S.key) return;
        try {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, S.key, new TextEncoder().encode(JSON.stringify(record)));
            const py = new Uint8Array(12 + ct.byteLength); py.set(iv, 0); py.set(new Uint8Array(ct), 12);

            const tx = S.idb.transaction('vault', 'readwrite');
            tx.objectStore('vault').add({ data: btoa(String.fromCharCode(...py)) });
            S.saved++; S.log.push(record); updTele();
        } catch (e) {}
    };

    const saveSFTVault = async (sftRecord) => {
        if (!S.idb || !S.key) return;
        try {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, S.key, new TextEncoder().encode(JSON.stringify(sftRecord)));
            const py = new Uint8Array(12 + ct.byteLength); py.set(iv, 0); py.set(new Uint8Array(ct), 12);

            const tx = S.idb.transaction('sft_vault', 'readwrite');
            tx.objectStore('sft_vault').add({ data: btoa(String.fromCharCode(...py)) });
        } catch (e) {}
    };

    const purgeVault = async () => {
        if (S.run) {
            S.run = false;
            if (S.nodes.btnRun) S.nodes.btnRun.replaceChildren(...btnLayout('⏯️', 'ENGAGE'));
            S.metro.postMessage('halt');
            sysLog("Scraping Matrix Halted for Purge.", "#ff9933");
        }

        S.log = []; S.aiDataset = []; S.queue = [];
        S.seen = new WeakSet(); S.knownHashes.clear(); S.saved = 0; S.cull = 0; S.queueHalted = false;

        updTele();
        document.querySelectorAll('[data-gae-proc="true"], [data-gae-queued="true"]').forEach(c => {
            delete c.dataset.gaeProc; delete c.dataset.gaeQueued;
            c.style.opacity = ""; c.style.borderLeft = ""; c.style.pointerEvents = ""; c.classList.remove('gae-done-fx');
        });

        sysLog("Memory Purged. DOM Reset.", "#ff4d4d");

        if (!S.idb) { try { await initSec(); } catch (e) { return; } }
        if (!S.idb) return;

        return new Promise((resolve) => {
            try {
                const tx = S.idb.transaction(['vault', 'sft_vault'], 'readwrite');
                tx.objectStore('vault').clear(); tx.objectStore('sft_vault').clear();
                tx.oncomplete = () => { sysLog("IDB Vaults Erased.", "#ff4d4d"); resolve(); };
                tx.onerror = () => resolve();
            } catch (e) {
                try {
                    const txFallback = S.idb.transaction('vault', 'readwrite');
                    txFallback.objectStore('vault').clear();
                    txFallback.oncomplete = () => { sysLog("Primary Vault Erased.", "#ff4d4d"); resolve(); };
                } catch (e2) { resolve(); }
            }
        });
    };

    const dl = (data, name, type = "text/plain") => {
        const a = document.createElement("a");
        const url = (data instanceof Blob) ? URL.createObjectURL(data) : URL.createObjectURL(new Blob([data], { type }));
        a.href = url;
        a.download = name; a.click(); URL.revokeObjectURL(a.href);
    };

    const exportData = (type) => {
        if (document.activeElement) document.activeElement.blur();

        if (type === 'sft') {
            if (S.aiDataset.length === 0) return sysLog("SFT Vault is empty. Generate first.", "#ff4d4d");
            const content = S.aiDataset.map(r => JSON.stringify(r)).join('\r\n');
            dl(content, `castor_sft_${Date.now()}.jsonl`, 'application/jsonl');
            sysLog(`Exported ${S.aiDataset.length} SFT records.`, "#4dff4d"); return;
        }

        if (S.log.length === 0) return sysLog("Primary Vault is empty.", "#ff4d4d");

        let content = "", mime = "text/plain", ext = type;
        if (type === 'json') {
            content = JSON.stringify(S.log, null, 2); mime = 'application/json';
        } else if (type === 'jsonl') {
            content = S.log.map(r => JSON.stringify({ prompt: r.original, completion: r.summary, metadata: { time: r.time, media: r.media } })).join('\r\n'); mime = 'application/jsonl'; ext = 'jsonl';
        } else if (type === 'md') {
            content = S.log.map(r => {
                const isChat = r.original.includes('Said') || r.original.includes('Prompt:');
                const mediaOutput = r.media.length > 0 ? `\r\n**Media**:\r\n${r.media.map(m => `![media](${m})`).join('\r\n')}` : '';
                return `### ${isChat ? '💬 Chat Session' : '📌 Activity Card'} - ${r.time}\r\n**Summary**: ${r.summary}\r\n**Details**:\r\n> ${r.original.replace(/\n/g, '\r\n> ')}\r\n${mediaOutput}\r\n---\r\n`;
            }).join('\r\n');
            mime = 'text/markdown';
        } else if (type === 'txt') {
            content = S.log.map(r => {
                const isChat = r.original.includes('Said') || r.original.includes('Prompt:');
                const mediaOutput = r.media.length > 0 ? `\r\nMEDIA URLs:\r\n${r.media.join('\r\n')}` : '';
                return `[${r.time}]\r\n[${isChat ? 'CHAT' : 'CARD'}]\r\nSUMMARY: ${r.summary}\r\nORIGINAL: ${r.original.replace(/\n/g, '\r\n')}\r\n${mediaOutput}\r\n----------------------------------------\r\n`;
            }).join('\r\n');
            mime = 'text/plain';
        }

        dl(content, `castor_${type}_${Date.now()}.${ext}`, mime);
        sysLog(`Exported ${S.log.length} records as ${type.toUpperCase()}.`, "#4dff4d");
    };

    /* ─────────────────────────────────────────────
       7. SERVICE LAYER (ISOLATED PROBES & AI ENGINEERING)
    ──────────────────────────────────────────── */

    const buildSftPrompt = (records) => {
        let focusInstruction = ""; let toneOverride = "";

        if (S.focus === 'code') {
            focusInstruction = `\nCATEGORY FOCUS: code\nPopulate category = "code". Taxonomy: debugging | code_generation | code_review | refactoring | architecture | testing | documentation | devops | security | unknown.\nExtract metadata: primary_language, frameworks_referenced, error_types, resolution_reached, complexity_indicators.`;
            toneOverride = `You are a Senior Principal Software Engineer. The user prompt must be transmuted to sound like a rigorous engineering request. The assistant response must be highly clinical, code-focused, and void of conversational filler.`;
        } else if (S.focus === 'projects') {
            focusInstruction = `\nCATEGORY FOCUS: projects\nPopulate category = "projects". Taxonomy: website | web_app | script | automation | cli_tool | desktop_app | mobile_app | browser_extension | api | library | game | data_pipeline | config | unknown.\nExtract metadata: project_name, project_phase, output_artifact, languages_used, frameworks_referenced, tools_referenced, deliverable_shipped, complexity_indicators.`;
            toneOverride = `You are an expert Technical Product Manager and Lead Architect. The user prompt should focus on architectural goals and deliverables.`;
        } else if (S.focus === 'media') {
            focusInstruction = `\nCATEGORY FOCUS: media\nPopulate category = "media". Taxonomy: roleplay | worldbuilding | fanfiction | screenwriting | game_narrative | music | visual_art | film | lore | creative_writing | unknown.\nExtract metadata: fictional_universe, narrative_mode, character_names, media_format.`;
            toneOverride = `You are an expert Creative Director and Lore Master. The tone should be highly creative and deeply descriptive.`;
        } else {
            focusInstruction = `\nCATEGORY FOCUS: auto\nPopulate category dynamically based on content.`;
            toneOverride = `You are a precision data-engineering assistant.`;
        }

        const payload = records.map((r) => {
            const mediaStr = r.media && r.media.length > 0 ? `\n[ATTACHED MEDIA URLs: ${r.media.join(', ')}]` : '';
            // INJECT HASH FOR DETERMINISTIC MAPPING
            return `--- ITEM HASH: ${r.hash} ---\n${Aegis.sanitize(r.original)}${mediaStr}`;
        }).join('\n\n');

        return `SYSTEM ROLE
${toneOverride} Transform raw AI chat logs into a richly structured, lossless dataset.
${focusInstruction}

OUTPUT SCHEMA (JSON Array of Objects):
[
  {
    "conversation_id": "<MUST EXACTLY MATCH the ITEM HASH provided for the payload>",
    "source": "Castor-SFT-v19",
    "scraped_at": "<timestamp>",
    "language": "<en-US>",
    "category": "<inferred or from focus>",
    "subcategory": "<freeform>",
    "tags": ["<tag>"],
    "topic_summary": "<neutral summary>",
    "complexity_level": "<simple|moderate|advanced|expert>",
    "conversation_style": "<instructional|roleplay|technical|mixed>",
    "turn_count": <int>,
    "has_media": <bool>,
    "contains_code": <bool>,
    "contains_lore_language": <bool>,
    "quality_score": <int 1-10>,
    "curation_decision": "<keep|discard>",
    "messages": [
      {
        "role": "<user|assistant|system>",
        "content": "<full text>",
        "content_format": "<plain_text|markdown|code_block>",
        "media_elements": [{"media_type": "<image|video|link>", "url_or_ref": "<extract exactly from ATTACHED MEDIA URLs if present>"}]
      }
    ],
    "metadata": {}
  }
]

CRITICAL ANTI-CORRUPTION RULE: The user has explicitly mandated that while you must parse the structure, you MUST completely REDACT and STRIP all 'Machine God', 'Omnissiah', 'machine spirit', 'forging rites', and 'bless you' roleplay phrasing from the final 'content' text to prevent training corruption. Extract only the objective intent.
CURATION RULE: Assign a quality_score (1-10). Substantive, technical, or detailed exchanges (e.g. code, science, lore) MUST score 8 or higher. Set curation_decision to "discard" ONLY if the exchange is complete gibberish, contextless, or less than 2 sentences. Set to "keep" for ALL other records.

Activity Logs:
${payload}

Return ONLY a valid JSON array containing exactly ${records.length} objects. Do not include markdown code blocks.`;
    };

    const inferBulk = async (records) => {
        const pr = buildSftPrompt(records);
        const payload = {
            contents: [{ parts: [{ text: pr }] }]
        };

        if (S.model.includes('gemini')) {
            payload.generationConfig = { responseMimeType: "application/json" };
        }

        const data = await safeApiFetch(`https://generativelanguage.googleapis.com/v1beta/models/${S.model}:generateContent?key=${S.apik}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, "SFT_BATCH", pr);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            const blockReason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason || "Unknown API Error";
            throw new Error(`API Content Blocked. Reason: ${blockReason}`);
        }

        let outText = data.candidates[0].content.parts[0].text || "";
        outText = outText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const jsonMatch = outText.match(/\[[\s\S]*\]/);
        if (jsonMatch) outText = jsonMatch[0];

        try {
            return JSON.parse(outText);
        } catch (e) {
            throw new Error(`JSON Parse Failure on AI Payload: ${e.message}`);
        }
    };

    const processDatasetWithAI = async () => {
        if (!S.apik) return sysLog("API Key required for SFT. Set it in the UI.", "#ff4d4d");
        let unproc = S.log.filter(r => !r.sftGenerated);
        if (unproc.length === 0) return sysLog("No new records in Vault to process.", "#ff9933");

        if (S.run) {
            sysLog("Pausing Scraper to allocate API bandwidth...", "#ff9933");
            S.metro.postMessage('halt');
        }

        const totalRecords = unproc.length;
        sysLog(`COMPILING SFT DATASET: ${totalRecords} records [Tone: ${S.focus}]...`, "#4dffff");

        let successCount = 0;
        const MAX_BATCH_SIZE = 20;
        const MAX_INPUT_TOKENS = 15000;
        let batchIndex = 1;

        while (unproc.length > 0) {
            let currentBatch = [];
            let currentTokens = 0;

            for (let i = 0; i < unproc.length; i++) {
                const estTokens = Sentinel.estimateTokens(unproc[i].original);
                if (currentBatch.length >= MAX_BATCH_SIZE || currentTokens + estTokens > MAX_INPUT_TOKENS) {
                    break;
                }
                currentBatch.push(unproc[i]);
                currentTokens += estTokens;
            }

            unproc = unproc.slice(currentBatch.length);
            const processedSoFar = totalRecords - unproc.length;
            sysLog(`SFT BATCH [${batchIndex}] - Purifying items [${processedSoFar}/${totalRecords}] (Est. ${currentTokens} input tokens)...`, "#ff9933");

            try {
                const sftResults = await inferBulk(currentBatch);

                // REFACTORED: Remove fatal array length match dependency to survive LLM fragmentation/hallucination
                if (!Array.isArray(sftResults)) {
                    throw new Error(`API returned invalid structure: expected Array, got ${typeof sftResults}`);
                }

                if (sftResults.length !== currentBatch.length) {
                    sysLog(`[WARNING] Batch fragmentation detected. Expected ${currentBatch.length}, got ${sftResults.length}. Salvaging valid nodes...`, "#ff9933");
                }

                let keptCount = 0;
                const resultHashes = new Set();

                for (const sftRecord of sftResults) {
                    if (sftRecord.conversation_id) resultHashes.add(sftRecord.conversation_id);

                    if (sftRecord.curation_decision === 'discard' || sftRecord.quality_score < 4) {
                        sysLog(`Dropped low-quality record (Score: ${sftRecord.quality_score}).`, "#ff9933");
                        continue;
                    }
                    S.aiDataset.push(sftRecord);
                    await saveSFTVault(sftRecord);
                    keptCount++;
                }

                // ASSUMPTION: Processing extra hallucinatory records that pass schema validation is preferable to dropping the entire batch.
                // Mark original records as processed based on cryptographic correlation, or blanket flag them to prevent endless poison-pill retry loops.
                currentBatch.forEach(r => {
                    if (resultHashes.has(r.hash) || sftResults.length >= currentBatch.length) {
                        r.sftGenerated = true;
                    } else {
                        // Blanket approval prevents pipeline stalling on severely butchered AI responses
                        r.sftGenerated = true;
                    }
                });

                successCount += keptCount;
                updTele();

                if (unproc.length > 0) {
                    sysLog(`Cooling internal relays (5s)...`, "#aaaaaa");
                    await sleep(5000);
                }

            } catch (err) {
                sysLog(`FATAL: SFT Batch failed: ${err.message}`, "#ff4d4d");

                if (err.message.includes('CircuitBreaker503')) {
                    sysLog("Halting operations due to hard API outage. Switch models in UI.", "#ff9933");
                    if (S.run) {
                        S.run = false;
                        if (S.nodes.btnRun) S.nodes.btnRun.replaceChildren(...btnLayout('⏯️', 'ENGAGE'));
                        S.metro.postMessage('halt');
                    }
                }
                break;
            }
            batchIndex++;
        }

        if (successCount > 0) {
            sysLog(`SFT PIPELINE COMPLETE. +${successCount} purified records.`, "#4dff4d");
        } else {
            sysLog(`SFT PIPELINE COMPLETE. 0 records passed purity filters.`, "#ff9933");
        }

        if (S.run) {
            sysLog("Resuming Scraper...", "#4dff4d");
            S.metro.postMessage('run');
        }
    };

    const probeConnection = async () => {
        if (!S.apik) return sysLog("API Key Required.", "#ff4d4d");
        try {
            const data = await safeApiFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${S.apik}`, { method: 'GET' }, "PROBE");
            const models = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).map(m => m.name.replace('models/', ''));
            S.nodes.selModel.textContent = ''; S.nodes.selModel.disabled = false;
            models.forEach(m => S.nodes.selModel.appendChild(mkEl('option', { value: m, selected: m === S.model }, [m])));
            if (!models.includes(S.model)) S.model = models[0]; S.nodes.selModel.value = S.model; storage.set('gae_model', S.model);
            sysLog(`Probe success. ${models.length} endpoints found.`, "#4dff4d");
        } catch (e) { sysLog(`Probe failed: ${e.message}`, "#ff4d4d"); }
    };

    const generateHtmlViewer = () => {
        sysLog("Deploying Pollux Immersive Viewer...", "#4dffff");

        const htmlOut = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="description" content="Pollux Explorer - Offline Searchable Interface for AI Logs">
    <title>Pollux App // Matrix Explorer</title>
    <style>
        :root {
            --bg-base: #050505;
            --bg-surface: #111;
            --bg-card: #1a1a1a;
            --text-main: #f1f3f4;
            --text-dim: #a3a3a3;
            --primary: #FFE135;
            --primary-hover: #e5c82a;
            --accent: #2dd4bf;
            --border: #333;
            --danger: #ff4d4d;
            --base-font-size: 16px;
            --base-font-family: 'JetBrains Mono', monospace, -apple-system, sans-serif;
            --gm3-sys-color-background: #131314;
            --gm3-sys-color-on-background: #e3e3e3;
            --gm3-sys-color-surface: #131314;
            --gm3-sys-color-on-surface: #e3e3e3;
            --gm3-sys-color-primary: #a8c7fa;
            --gm3-sys-color-on-primary: #062e6f;
        }

        [data-theme="light"] {
            --bg-base: #f0f0f0;
            --bg-surface: #ffffff;
            --bg-card: #f9f9f9;
            --text-main: #111111;
            --text-dim: #555555;
            --border: #cccccc;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: var(--base-font-family);
            font-size: var(--base-font-size);
            background-color: var(--bg-base);
            color: var(--text-main);
            line-height: 1.6;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: font-size 0.2s, background-color 0.3s, color 0.3s;
            position: relative;
        }

        /* HARDWARE-ACCELERATED LAVA LAMP BACKGROUND */
        .lava-bg {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: -1; overflow: hidden; filter: blur(60px);
            opacity: 0.4; pointer-events: none; background: var(--bg-base);
        }
        [data-theme="light"] .lava-bg { opacity: 0.2; }
        .blob { position: absolute; border-radius: 50%; mix-blend-mode: screen; filter: blur(20px); }
        .blob-1 { width: 55vw; height: 55vw; background: var(--primary); top: -20vh; left: -10vw; animation: drift 20s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95); }
        .blob-2 { width: 45vw; height: 45vw; background: var(--border); bottom: -10vh; right: -5vw; animation: drift 25s infinite alternate-reverse cubic-bezier(0.45, 0.05, 0.55, 0.95); }
        .blob-3 { width: 50vw; height: 50vw; background: var(--primary); opacity: 0.5; top: 30vh; left: 30vw; animation: drift 22s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95); }

        @keyframes drift {
            0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
            50% { transform: translate3d(10vw, 15vh, 0) scale(1.1) rotate(90deg); }
            100% { transform: translate3d(-10vw, 25vh, 0) scale(0.9) rotate(180deg); }
        }

        .text-hint { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8); }

        /* SPLIT-PILL GEL CELLPHONE BUTTON ENGINE */
        .upload-btn, .action-btn {
            display: inline-flex; align-items: center; gap: 10px; padding: 4px 15px 4px 4px;
            border-radius: 40px; cursor: pointer; font-weight: 800; font-family: sans-serif;
            font-size: 10px; text-transform: uppercase; color: #fff; z-index: 3;
            background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.5) 100%);
            box-shadow: inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -2px 5px rgba(0,0,0,0.8), 0 4px 6px rgba(0,0,0,0.5);
            border: 1px solid rgba(0,0,0,0.8); transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative; overflow: hidden;
        }
        .upload-btn:hover, .upload-btn:focus-visible, .action-btn:hover, .action-btn:focus-visible {
            background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.4) 100%);
            transform: translateY(-2px); box-shadow: inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 5px rgba(0,0,0,0.8), 0 6px 12px rgba(0,0,0,0.6);
            outline: none;
        }
        .upload-btn:active, .action-btn:active {
            transform: translateY(2px) scale(0.98); background: rgba(0,0,0,0.7);
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.9), inset 0 -1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.4);
        }
        .icon-circle {
            display: inline-flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.6);
            box-shadow: inset 2px 2px 6px rgba(0,0,0,0.9), inset -1px -1px 3px rgba(255,255,255,0.2);
            border: 1px solid rgba(0,0,0,0.8); font-size: 12px; z-index: 3; position: relative; color: #fff;
        }
        .upload-btn::after, .action-btn::after {
            content: ''; position: absolute; top: 0; left: 16px;
            width: 150px; height: 100px; background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 60%);
            transform-origin: top left; transform: rotate(15deg); pointer-events: none; z-index: 2;
        }
        .key-text { z-index: 3; position: relative; margin-right: 4px; }

        .card, .message-bubble, #searchInput, #fontInput {
            position: relative; box-shadow: inset 3px 3px 8px rgba(0,0,0,0.8), inset -2px -2px 5px rgba(255,255,255,0.04);
            border: 1px solid #000; background: rgba(0,0,0,0.3);
        }
        aside { border-right: 1px solid var(--border); }

        header {
            background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%);
            padding: 1rem 2rem; border-bottom: 1px solid var(--border); display: flex;
            justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
            z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.8);
        }

        [data-theme="light"] header { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }

        .brand { font-size: 1.2rem; font-weight: 800; color: var(--text-dim); letter-spacing: 2px; display:flex; align-items:center; }
        .brand svg { height: 30px; width: auto; margin-right: 10px; fill: var(--primary); }
        .math-logo { font-family: 'Cambria Math', 'Times New Roman', serif; font-size: 1.8rem; font-style: italic; color: var(--primary); text-shadow: 0 0 10px rgba(255, 225, 53, 0.4); margin-right: 5px; font-weight: bold; }

        .controls { display: flex; align-items: center; gap: 0.8rem; flex-grow: 1; justify-content: flex-end; flex-wrap: wrap; z-index: 10; }

        .search-wrapper { position: relative; width: 100%; max-width: 250px; }

        #searchInput, #fontInput {
            width: 100%; padding: 0.6rem 1rem; border-radius: 8px; color: var(--text-main);
            outline: none; font-family: inherit; font-size: 0.9em;
            transition: border-color 0.2s, box-shadow 0.2s; position: relative; z-index: 3;
        }
        #fontInput { max-width: 160px; }
        #searchInput:focus, #fontInput:focus { border-color: var(--primary); box-shadow: 0 0 8px rgba(255, 225, 53, 0.2); }

        .control-btn {
            color: var(--text-main); padding: 0.6rem; border-radius: 8px; cursor: pointer;
            font-weight: bold; transition: all 0.2s; font-family: inherit;
            display: flex; align-items: center; justify-content: center; min-width: 40px; appearance: none; z-index: 3;
            background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }
        .control-btn:hover, .control-btn:focus-visible { border-color: var(--primary); outline: none; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.6); }
        .control-btn:active { transform: translateY(1px); }
        select.control-btn { padding: 0.6rem 2rem 0.6rem 1rem; }

        #fileInput { display: none; }

        .app-container {
            display: grid; grid-template-columns: minmax(250px, 20vw) 1fr;
            flex-grow: 1; overflow: hidden; position: relative; z-index: 10;
        }

        aside { position: relative; border-right: 1px solid var(--border); padding: 1.5rem; overflow-y: auto; padding-bottom: 60px; }
        .sidebar-section { margin-bottom: 2rem; position: relative; z-index: 3; }
        .sidebar-title { font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 1rem; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 5px; }

        .tag-list, .category-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .pill {
            padding: 0.4em 0.8em; border-radius: 4px; font-size: 0.85em; cursor: pointer; transition: all 0.2s ease-in-out; color: var(--text-main); z-index: 3;
            box-shadow: -2px -2px 5px rgba(255,255,255,0.05), 2px 2px 5px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.1), inset -1px -1px 2px rgba(0,0,0,0.4);
            border: 1px solid rgba(0,0,0,0.6); background: rgba(0,0,0,0.5); position: relative; overflow: hidden;
        }
        .pill::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%; background: linear-gradient(to bottom, rgba(255,255,255,0.12), transparent); pointer-events: none; border-radius: inherit; z-index: 1; }
        .pill:hover, .pill:focus-visible { border-color: var(--text-dim); outline: none; transform: translateY(-1px); }
        .pill.active { background: rgba(255, 225, 53, 0.1); border-color: var(--primary); color: var(--primary); }

        main { padding: 2rem; overflow-y: auto; scroll-behavior: smooth; padding-bottom: 60px; }
        .chat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }

        @media (max-width: 768px) {
            header { padding: 1rem; flex-direction: column; align-items: flex-start; }
            .controls { width: 100%; justify-content: space-between; margin-top: 1rem; }
            .search-wrapper { max-width: 100%; }
            .app-container { display: flex; flex-direction: column; overflow-y: auto; }
            aside { display: block; border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; height: auto; overflow: visible; }
            main { overflow: visible; }
            .chat-grid { grid-template-columns: 1fr; }
        }

        .card { border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; scroll-margin-top: 100px; }
        .card:hover { border-color: #444; }

        .card-header { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 3; }
        .card-title { font-size: 1.1em; font-weight: 700; color: var(--primary); word-break: break-word; display: flex; align-items: center; gap: 0.5rem; }
        .card-meta { font-size: 0.8em; color: var(--text-dim); margin-top: 5px; }

        .card-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; position: relative; z-index: 3; }
        .card-tag { font-size: 0.75em; background: rgba(0,0,0,0.5); padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--text-dim); border: 1px solid var(--border); }

        .card-content { display: flex; flex-direction: column; gap: 1rem; max-height: 250px; overflow: hidden; position: relative; z-index: 3; }
        .card-content.expanded { max-height: none; }
        .card-content::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); pointer-events: none; z-index: 4; }
        .card-content.expanded::after { display: none; }

        .message-bubble { border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; position: relative; z-index: 3; }
        .message-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(136, 136, 136, 0.2); padding-bottom: 0.5rem; position: relative; z-index: 3; }
        .message-role { font-size: 0.75em; font-weight: bold; color: var(--accent); letter-spacing: 1px; }
        .role-user .message-role { color: var(--primary); }
        .role-system .message-role { color: var(--text-dim); }

        .message-body { font-size: 0.9em; white-space: pre-wrap; word-break: break-word; color: var(--text-main); position: relative; z-index: 3; }

        .media-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 5px; position: relative; z-index: 3; }
        .media-item { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; transition: transform 0.2s, border-color 0.2s; z-index: 3; }
        .media-item:hover { transform: scale(1.03); border-color: var(--primary); }

        .card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: auto; padding-top: 1rem; border-top: 1px dotted var(--border); position: relative; z-index: 3; }
        .empty-state { text-align: center; padding: 4rem 1rem; color: var(--text-dim); grid-column: 1 / -1; border: 1px dashed var(--border); border-radius: 12px; background: rgba(0,0,0,0.1); position: relative; z-index: 3; }

        .lightbox { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
        .lightbox.active { opacity: 1; pointer-events: auto; }
        .lightbox img { max-width: 90vw; max-height: 80vh; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); object-fit: contain; }
        .lb-close { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.8); font-size: 1rem; padding: 0.5rem 1rem; z-index: 100000; border-radius: 8px; cursor: pointer; color: white; border: 1px solid #444; }
        .lb-close:hover { background: var(--danger); border-color: white; }

        .gae-marquee-wrapper { position: fixed; bottom: 0; left: 0; width: 100vw; height: 26px; background: #000000; border-top: 1px solid var(--border); z-index: 9999999; display: flex; align-items: center; overflow: hidden; font-family: monospace; font-size: 11px; white-space: nowrap; color: #ffffff; }
        .gae-marquee-track { display: inline-block; white-space: nowrap; will-change: transform; }
        .mq-inner { display: inline-block; padding-right: 50px; }
        .mq-item { padding-right: 40px; color: inherit; text-decoration: none; display: inline-flex; align-items: center; }
        .mq-item > a { color: #ffffff; text-decoration: underline; transition: color 0.2s; }
        .mq-item > a:hover { color: var(--primary); text-decoration: underline; }
    </style>
</head>
<body data-theme="dark">

    <div class="lava-bg" aria-hidden="true">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
    </div>

    <header role="banner">
        <div class="brand" aria-label="Pollux Logo"><span class="math-logo" aria-hidden="true">&#x1D4AB;o&#x2113;&#x2113;ux</span> // ARCHIVE</div>
        <nav class="controls" aria-label="Main Navigation Controls">
            <div class="search-wrapper" style="max-width: 150px;">
                <input type="text" id="fontInput" name="fontInput" aria-label="Hotload Google Font" title="Enter a Google Font name and press Enter" placeholder="Google Font..." onkeydown="if(event.key==='Enter') loadGoogleFont(this.value)">
            </div>
            <select id="themeToggle" name="themeToggle" class="control-btn" aria-label="Select Interface Theme" title="Select Interface Theme" onchange="applyTheme(this.value)">
                <option value="" disabled selected>🎨 Select Theme...</option>
                ${C.themes.map((t, i) => `<option value="${i}">${t.name}</option>`).join('')}
            </select>
            <select id="langToggle" name="langToggle" class="control-btn" aria-label="Select Interface Language" title="Select Interface Language" onchange="changeLanguage(this.value)">
                <option value="en">EN</option>
                <option value="es">ES</option>
            </select>
            <button class="control-btn" onclick="document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'" aria-label="Toggle Brightness Theme" title="Switch between dark and light mode">🌓</button>
            <button class="control-btn" aria-label="Toggle Walkthrough Tour" onclick="if(window.Tour) window.Tour.init(polluxSteps)" title="Show Interactive Tour">❓</button>
            <button class="control-btn" onclick="adjustFont(-1)" aria-label="Decrease Interface Text Size" title="Make text smaller">A-</button>
            <button class="control-btn" onclick="adjustFont(1)" aria-label="Increase Interface Text Size" title="Make text larger">A+</button>

            <div class="search-wrapper">
                <input type="text" id="searchInput" name="searchInput" aria-label="Search through archived records" placeholder="Search matrices...">
            </div>

            <label class="upload-btn" id="lblUpload" for="fileInput" tabindex="0" aria-label="Upload data file to load archive" title="Upload JSON or Markdown files" onkeydown="if(event.key==='Enter') document.getElementById('fileInput').click()">
                <div class="icon-circle" aria-hidden="true">📂</div><span class="key-text text-hint" id="lblUploadTxt">INIT UPLOAD</span>
            </label>
            <input type="file" id="fileInput" name="fileInput" multiple accept=".json,.jsonl,.md,.txt" aria-hidden="true" tabindex="-1">
        </nav>
    </header>

    <div class="app-container">
        <aside role="complementary" aria-label="Archive Filters">
            <div class="sidebar-section">
                <div class="sidebar-title" id="lblTax">Taxonomy</div>
                <div id="categoryList" class="category-list" role="listbox" aria-label="Category Filters">
                    <button class="pill active" data-cat="all" onclick="filterCategory('all')" role="option" aria-selected="true" title="Show all categories"><span style="z-index:3; position:relative;">ALL_DATA</span></button>
                </div>
            </div>
            <div class="sidebar-section">
                <div class="sidebar-title" id="lblTags">Entity Tags</div>
                <div id="tagList" class="tag-list" role="listbox" aria-label="Tag Filters"></div>
            </div>
        </aside>

        <main role="main">
            <div id="chatGrid" class="chat-grid" aria-live="polite">
                <div class="empty-state">
                    <h2 tabindex="0" id="lblEmptyHead">VAULT EMPTY</h2>
                    <p id="lblEmptySub">Awaiting JSON, JSONL, MD, or TXT payload extraction.</p>
                </div>
            </div>
        </main>
    </div>

    <div id="lightbox" class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Media Gallery Viewer" onclick="if(event.target === this) closeLightbox()">
        <button class="lb-close" aria-label="Close Image Gallery" title="Close image overlay" onclick="closeLightbox()">❌ CLOSE</button>
        <img id="lb-img" src="" alt="Full size isolated media">
    </div>

    <div class="gae-marquee-wrapper" id="polluxMarquee"></div>

    <script>
        let ttPolicy;
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
            try { ttPolicy = window.trustedTypes.createPolicy('pollux-ui-policy', { createHTML: s => s }); }
            catch (e) { ttPolicy = window.trustedTypes.defaultPolicy; }
        }
        const safeHTML = (str) => ttPolicy ? ttPolicy.createHTML(str) : str;

        const CAST_THEMES = ${JSON.stringify(C.themes)};
        const i18n = {
            en: { search: "Search matrices...", upload: "INIT UPLOAD", tax: "Taxonomy", tags: "Entity Tags", empHead: "VAULT EMPTY", empSub: "Awaiting JSON, JSONL, MD, or TXT payload extraction.", exp: "EXPAND", col: "COLLAPSE", copy: "COPY DATA", link: "DEEP LINK", md: "OBSIDIAN MD", noMatch: "NO MATCHES", noMatchSub: "Adjust taxonomy filters or search query." },
            es: { search: "Buscar matrices...", upload: "INICIAR CARGA", tax: "Taxonomía", tags: "Etiquetas", empHead: "BÓVEDA VACÍA", empSub: "Esperando extracción de JSON, JSONL, MD o TXT.", exp: "EXPANDIR", col: "COLAPSAR", copy: "COPIAR DATA", link: "ENLACE", md: "OBSIDIAN MD", noMatch: "SIN RESULTADOS", noMatchSub: "Ajuste los filtros o la búsqueda." }
        };
        let currentLang = 'en';
        let archiveData = [];
        let activeCategory = 'all';
        let activeTag = null;
        let searchQuery = '';
        let currentFontSize = 16;

        function applyTheme(index) {
            if (!CAST_THEMES[index]) return;
            const td = CAST_THEMES[index];
            document.body.style.background = td.ui;
            document.documentElement.style.setProperty('--primary', td.hex);
            document.documentElement.style.setProperty('--border', td.border);
            document.documentElement.style.setProperty('--bg-surface', 'rgba(0,0,0,0.6)');
            document.documentElement.style.setProperty('--bg-card', 'rgba(0,0,0,0.8)');
            document.body.dataset.theme = 'dark';
        }

        window.loadGoogleFont = (fontName) => {
            if (!fontName.trim()) return;
            const fontId = 'font-' + fontName.replace(/\\s+/g, '-').toLowerCase();
            if (document.getElementById(fontId)) {
                document.documentElement.style.setProperty('--base-font-family', '"' + fontName + '", monospace');
                return;
            }
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=' + fontName.replace(/\\s+/g, '+') + ':wght@400;700&display=swap';
            document.head.appendChild(link);
            document.documentElement.style.setProperty('--base-font-family', '"' + fontName + '", monospace');
            document.getElementById('fontInput').value = '';
            document.getElementById('fontInput').placeholder = 'Loaded: ' + fontName;
        };

        function changeLanguage(lang) {
            currentLang = lang;
            document.documentElement.lang = lang;
            document.getElementById('searchInput').placeholder = i18n[lang].search;
            document.getElementById('lblUploadTxt').textContent = i18n[lang].upload;
            document.getElementById('lblTax').textContent = i18n[lang].tax;
            document.getElementById('lblTags').textContent = i18n[lang].tags;
            render();
        }

        function adjustFont(direction) {
            currentFontSize += (direction * 2);
            currentFontSize = Math.max(12, Math.min(currentFontSize, 32));
            document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px');
        }

        const buildMarquee = (parentEl) => {
            const track = document.createElement('div');
            track.className = 'gae-marquee-track';
            const block = \`<span class="mq-item text-hint" style="font-weight:bold; color:var(--primary); z-index:3; position:relative;">⚙️ Tech Adept 00FACE</span>\` +
                \`<span class="mq-item text-hint" style="z-index:3; position:relative;">Discord & Stout Username: <strong style="color:#ffffff; margin-left:4px;">00FACE</strong></span>\` +
                \`<span class="mq-item text-hint" style="z-index:3; position:relative;"><a href="https://ko-fi.com/00face" target="_blank">☕ Ko-Fi</a></span>\` +
                \`<span class="mq-item text-hint" style="z-index:3; position:relative;"><a href="https://www.viewbug.com/member/armandocornaglia" target="_blank">📷 ViewBug</a></span>\` +
                \`<span class="mq-item text-hint" style="z-index:3; position:relative;"><a href="https://drive.google.com/drive/folders/1FxVBTox0ibuRO8_77Iwf2kl9Wvh6qe0S?usp=sharing" target="_blank">🎨 Branding & Design</a></span>\` +
                \`<span class="mq-item text-hint" style="z-index:3; position:relative;"><a href="https://codepen.io/thefacebiters" target="_blank">💻 CodePen</a></span>\` +
                \`<span class="mq-item text-hint" style="z-index:3; position:relative;"><a href="https://github.com/00face" target="_blank">🐙 GitHub</a></span>\` +
                \`<span class="mq-item text-hint" style="z-index:3; position:relative;"><a href="https://www.catchafire.org/profiles/237598/impact" target="_blank">🔥 Catchafire Impact</a></span>\`;

            track.innerHTML = safeHTML(\`<div class="mq-inner">\${block}</div><div class="mq-inner">\${block}</div><div class="mq-inner">\${block}</div>\`);
            parentEl.appendChild(track);

            let speed = 1.0;
            let targetSpeed = 1.0;
            let pos = 0;

            const tick = () => {
                speed += (targetSpeed - speed) * 0.05;
                pos -= speed;
                const inner = track.firstElementChild;
                if (inner && -pos >= inner.offsetWidth) pos += inner.offsetWidth;
                track.style.transform = \`translateX(\${pos}px)\`;
                requestAnimationFrame(tick);
            };

            parentEl.addEventListener('mouseenter', () => targetSpeed = 0);
            parentEl.addEventListener('mouseleave', () => targetSpeed = 1.0);
            tick();
        };

        buildMarquee(document.getElementById('polluxMarquee'));

        const fileInput = document.getElementById('fileInput');
        const chatGrid = document.getElementById('chatGrid');
        const searchInput = document.getElementById('searchInput');
        const categoryList = document.getElementById('categoryList');
        const tagList = document.getElementById('tagList');

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                try {
                    const text = await file.text();
                    processFile(text, file.name, file.type);
                } catch(err) {
                    console.error("Failed to read file", err);
                }
            }
            render();
            updateSidebar();
            e.target.value = ''; // FIX: Reset input so the exact same file can be re-uploaded if needed
        });

        function processFile(content, filename, type) {
            const extension = filename.split('.').pop().toLowerCase();
            try {
                if (extension === 'json') {
                    const data = JSON.parse(content);
                    handleJson(data, filename);
                } else if (extension === 'jsonl' || extension === 'ndjson') {
                    const lines = content.split(/\\r?\\n/).filter(l => l.trim());
                    lines.forEach(line => {
                        try { handleJson(JSON.parse(line), filename); } catch(e) {}
                    });
                } else {
                    handleRawText(content, filename);
                }
            } catch (err) {
                console.error("Error parsing " + filename, err);
            }
        }

        function handleJson(data, filename) {
            const entries = Array.isArray(data) ? data : (data.conversations || data.history || [data]);

            entries.forEach((item, index) => {
                const titleMatch = item.topic_summary || item.title || item.name || item.summary || item.metadata?.time;
                const altTitle = 'Record ' + (index + 1);

                let parsedMessages = [];
                if (item.messages && Array.isArray(item.messages)) {
                    parsedMessages = item.messages.map(m => ({
                        role: m.role || 'unknown',
                        content: m.content || '',
                        media: m.media_elements ? m.media_elements.map(me => me.url_or_ref || me.url) : []
                    }));
                } else if (item.prompt && item.completion) {
                    parsedMessages = [
                        { role: 'user', content: item.prompt, media: item.metadata?.media || [] },
                        { role: 'assistant', content: item.completion, media: [] }
                    ];
                } else if (item.original) {
                    parsedMessages = [{ role: 'system', content: item.original, media: item.media || [] }];
                } else {
                    const fallbackContent = item.mapping || item.text || JSON.stringify(item);
                    parsedMessages = [{ role: 'system', content: fallbackContent, media: item.media || item.metadata?.media || [] }];
                }

                const entry = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: titleMatch || altTitle,
                    date: item.create_time || item.scraped_at || item.time || item.metadata?.time || item.timestamp || new Date().toISOString(),
                    messages: parsedMessages,
                    tags: extractTags(item),
                    category: item.category || filename.split('.')[0]
                };
                archiveData.push(entry);
            });
        }

        function handleRawText(content, filename) {
            const parts = content.split(/\\r?\\n(?=# )|\\r?\\n(?=---)/m).filter(p => p.trim());
            parts.forEach((part, i) => {
                archiveData.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title: part.split(/\\r?\\n/)[0].replace('#', '').trim() || 'Text Block ' + (i+1),
                    date: new Date().toISOString(),
                    messages: [{ role: 'system', content: part.trim(), media: [] }],
                    tags: ['text-import'],
                    category: filename
                });
            });
        }

        function extractTags(item) {
            const tags = [];
            if (item.tags && Array.isArray(item.tags)) return item.tags;
            const text = JSON.stringify(item).toLowerCase();
            if (text.includes('python') || text.includes('javascript')) tags.push('code');
            if (text.includes('recipe') || text.includes('cook')) tags.push('food');
            if (text.includes('ai') || text.includes('gpt')) tags.push('system');
            return tags.length ? tags : ['general'];
        }

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            render();
        });

        function updateSidebar() {
            const categories = ['all', ...new Set(archiveData.map(d => d.category))];
            const tags = [...new Set(archiveData.flatMap(d => d.tags))];

            categoryList.innerHTML = safeHTML(categories.map(cat =>
                '<button class="pill ' + (activeCategory === cat ? 'active' : '') + '" onclick="filterCategory(\\'' + cat + '\\')" role="option" aria-selected="' + (activeCategory === cat) + '" title="Filter by ' + cat + '"><span style="z-index:3; position:relative;">' + cat + '</span></button>'
            ).join(''));

            tagList.innerHTML = safeHTML(tags.map(tag =>
                '<button class="pill ' + (activeTag === tag ? 'active' : '') + '" onclick="filterTag(\\'' + tag + '\\')" role="option" aria-selected="' + (activeTag === tag) + '" title="Filter by tag ' + tag + '"><span style="z-index:3; position:relative;">#' + tag + '</span></button>'
            ).join(''));
        }

        window.filterCategory = (cat) => {
            activeCategory = cat;
            activeTag = null;
            updateSidebar();
            render();
        };

        window.filterTag = (tag) => {
            activeTag = tag === activeTag ? null : tag;
            updateSidebar();
            render();
        };

        window.openLightbox = (url) => {
            document.getElementById('lb-img').src = url;
            document.getElementById('lightbox').classList.add('active');
            document.getElementById('lightbox').setAttribute('aria-hidden', 'false');
        };

        window.closeLightbox = () => {
            document.getElementById('lightbox').classList.remove('active');
            document.getElementById('lightbox').setAttribute('aria-hidden', 'true');
            document.getElementById('lb-img').src = '';
        };

        window.copyMsg = (btn, b64) => {
            const text = decodeURIComponent(escape(atob(b64)));
            navigator.clipboard.writeText(text);
            const orig = btn.innerHTML;
            btn.innerHTML = safeHTML('<div class="icon-circle" aria-hidden="true">✅</div> <span class="key-text text-hint">COPIED</span>');
            setTimeout(() => btn.innerHTML = safeHTML(orig), 2000);
        };

        window.toggleExpand = (id, btn) => {
            const el = document.getElementById('content-' + id);
            const isExpanded = el.classList.toggle('expanded');
            btn.innerHTML = safeHTML('<div class="icon-circle" aria-hidden="true">🗗</div> <span class="key-text text-hint">' + (isExpanded ? i18n[currentLang].col : i18n[currentLang].exp) + '</span>');
            btn.setAttribute('aria-expanded', isExpanded);
        };

        window.copyLink = (id, btn) => {
            const url = window.location.origin + window.location.pathname + '#' + id;
            navigator.clipboard.writeText(url);
            const orig = btn.innerHTML;
            btn.innerHTML = safeHTML('<div class="icon-circle" aria-hidden="true">✅</div> <span class="key-text text-hint">COPIED</span>');
            setTimeout(() => btn.innerHTML = safeHTML(orig), 2000);
        };

        window.downloadCard = (id) => {
            const item = archiveData.find(d => d.id === id);
            const tagsStr = item.tags.map(t => '#' + t).join(' ');

            let md = '---\\r\\ncategory: ' + item.category + '\\r\\ndate: ' + item.date + '\\r\\nuuid: ' + item.id + '\\r\\n---\\r\\n# ' + item.title + '\\r\\n\\r\\n' + tagsStr + '\\r\\n\\r\\n';

            item.messages.forEach(m => {
                md += '### ' + m.role.toUpperCase() + '\\r\\n' + m.content.replace(/\\n/g, '\\r\\n') + '\\r\\n\\r\\n';
                if (m.media && m.media.length) {
                    md += m.media.map(url => '![media](' + url + ')').join('\\r\\n') + '\\r\\n\\r\\n';
                }
            });

            const blob = new Blob([md], {type: 'text/markdown'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
            a.click();
            URL.revokeObjectURL(a.href);
        };

        window.addEventListener('hashchange', () => {
            const id = window.location.hash.substring(1);
            if (id) {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({behavior: 'smooth'});
            }
        });

        function render() {
            if (archiveData.length === 0) {
                chatGrid.innerHTML = safeHTML('<div class="empty-state"><h2 tabindex="0" id="lblEmptyHead">' + i18n[currentLang].empHead + '</h2><p id="lblEmptySub">' + i18n[currentLang].empSub + '</p></div>');
                return;
            }

            let filtered = archiveData.filter(item => {
                const fullText = item.title.toLowerCase() + ' ' + item.messages.map(m => String(m.content).toLowerCase()).join(' ');
                const matchesSearch = fullText.includes(searchQuery);
                const matchesCat = activeCategory === 'all' || item.category === activeCategory;
                const matchesTag = !activeTag || item.tags.includes(activeTag);
                return matchesSearch && matchesCat && matchesTag;
            });

            if (filtered.length === 0) {
                chatGrid.innerHTML = safeHTML('<div class="empty-state"><h2 tabindex="0">' + i18n[currentLang].noMatch + '</h2><p>' + i18n[currentLang].noMatchSub + '</p></div>');
                return;
            }

            const markup = filtered.map(item => {
                const tagsHtml = item.tags.map(t => '<span class="card-tag">#' + escapeHtml(t) + '</span>').join('');

                let messagesHtml = '';
                item.messages.forEach(msg => {
                    let mediaHtml = '';
                    if (msg.media && msg.media.length > 0) {
                        mediaHtml = '<div class="media-gallery" aria-label="Attached Media Gallery">' +
                            msg.media.map(url => {
                                const lowerUrl = url.toLowerCase();
                                const isVideo = lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || url.includes('video');
                                const isImg = lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif') || lowerUrl.endsWith('.webp') || lowerUrl.startsWith('data:image');
                                const isWebLink = url.includes('gemini.google.com/share') || (!isImg && !isVideo && url.startsWith('http'));

                                if (isVideo) {
                                    return '<video class="media-item" src="' + escapeHtml(url) + '" controls preload="metadata" aria-label="Embedded video payload"></video>';
                                } else if (isWebLink) {
                                    return '<a class="media-item" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); text-decoration:none; color:var(--primary); padding:10px; text-align:center;"><span style="font-size:24px;">🔗</span><span style="font-size:10px; margin-top:5px; word-break:break-all;">' + escapeHtml(url.split('/').pop() || 'Shared Link') + '</span></a>';
                                } else {
                                    return '<img class="media-item" src="' + escapeHtml(url) + '" loading="lazy" alt="Embedded image payload" tabindex="0" role="button" aria-label="Click to enlarge image" title="View image full screen" onclick="openLightbox(\\'' + escapeHtml(url) + '\\')" onkeydown="if(event.key===\\'Enter\\') openLightbox(\\'' + escapeHtml(url) + '\\')">';
                                }
                            }).join('') +
                        '</div>';
                    }

                    const rawB64 = btoa(unescape(encodeURIComponent(msg.content)));
                    messagesHtml += '<div class="message-bubble role-' + escapeHtml(msg.role) + '">' +
                        '<div class="message-header">' +
                            '<span class="message-role">' + escapeHtml(msg.role.toUpperCase()) + '</span>' +
                            '<button class="action-btn" onclick="copyMsg(this, \\'' + rawB64 + '\\')" aria-label="Copy this ' + escapeHtml(msg.role) + ' response" title="Copy exact message to clipboard"><div class="icon-circle" aria-hidden="true">📋</div> <span class="key-text text-hint">' + i18n[currentLang].copy + '</span></button>' +
                        '</div>' +
                        '<div class="message-body">' + escapeHtml(msg.content).replace(/\\n/g, '<br/>') + '</div>' +
                        mediaHtml +
                    '</div>';
                });

                return '<article class="card" id="' + item.id + '" aria-labelledby="title-' + item.id + '">' +
                    '<div class="card-header">' +
                        '<div>' +
                            '<h3 class="card-title" id="title-' + item.id + '"><a href="#' + item.id + '" class="card-link" aria-label="Anchor link to this specific conversation" title="Scroll to this location" style="text-decoration:none; color:inherit; z-index:3; position:relative;">🔗</a> <span style="z-index:3; position:relative;">' + escapeHtml(item.title) + '</span></h3>' +
                            '<div class="card-meta" style="z-index:3; position:relative;">' + new Date(item.date).toLocaleDateString() + ' • ' + escapeHtml(item.category) + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="card-tags" aria-label="Categorical Tags">' + tagsHtml + '</div>' +
                    '<div class="card-content" id="content-' + item.id + '">' + messagesHtml + '</div>' +
                    '<div class="card-actions">' +
                        '<button class="action-btn primary" aria-expanded="false" aria-controls="content-' + item.id + '" onclick="toggleExpand(\\'' + item.id + '\\', this)" title="Show or hide full conversation"><div class="icon-circle" aria-hidden="true">🗗</div> <span class="key-text text-hint">' + i18n[currentLang].exp + '</span></button>' +
                        '<button class="action-btn" onclick="copyLink(\\'' + item.id + '\\', this)" title="Copy direct link to this conversation"><div class="icon-circle" aria-hidden="true">🔗</div> <span class="key-text text-hint">' + i18n[currentLang].link + '</span></button>' +
                        '<button class="action-btn" onclick="downloadCard(\\'' + item.id + '\\')" title="Download this conversation as a standalone Markdown file"><div class="icon-circle" aria-hidden="true">💾</div> <span class="key-text text-hint">' + i18n[currentLang].md + '</span></button>' +
                    '</div>' +
                '</article>';
            }).join('');

            chatGrid.innerHTML = safeHTML(markup);

            if (window.location.hash.substring(1)) {
                setTimeout(() => {
                    const el = document.getElementById(window.location.hash.substring(1));
                    if (el) el.scrollIntoView({behavior: 'smooth'});
                }, 100);
            }
        }

        function escapeHtml(unsafe) {
            return unsafe.toString()
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        }

        // POLLUX EMBEDDED TOUR GUIDE
        const polluxSteps = [
            { sel: '#searchInput', txt: "Search across all loaded extraction matrices instantly." },
            { sel: '#lblUpload', txt: "Upload JSON, JSONL, or MD outputs from Castor here to populate the viewer." },
            { sel: '#themeToggle', txt: "Adjust visual aesthetics and immersion levels." },
            { sel: 'aside', txt: "Filter payloads by inferred taxonomy and entity tags." }
        ];

        window.Tour = {
            idx: 0, tmr: null, tLeft: 100, paused: false, steps: [], el: null, bar: null, msg: null, btnP: null,
            init(steps) {
                this.steps = steps; this.idx = 0; this.paused = false; this.tLeft = 100;
                if (!this.el) {
                    this.el = document.createElement('div');
                    this.el.style.cssText = 'position:fixed;z-index:9999999;background:rgba(20,20,20,0.95);border:1px solid var(--primary);color:#fff;padding:15px;border-radius:12px;box-shadow:0 10px 50px rgba(0,0,0,0.9);width:280px;transition:all 0.3s;display:none;flex-direction:column;gap:12px;font-family:monospace;font-size:13px;pointer-events:auto;left:20px;top:20px;';

                    this.msg = document.createElement('div');
                    this.msg.style.lineHeight = '1.5';

                    const pw = document.createElement('div');
                    pw.style.cssText = 'height:4px;background:rgba(255,255,255,0.2);border-radius:2px;width:100%;overflow:hidden;';

                    this.bar = document.createElement('div');
                    this.bar.style.cssText = 'height:100%;background:var(--primary);width:100%;transition:width 0.1s linear;';
                    pw.appendChild(this.bar);

                    const ctrl = document.createElement('div');
                    ctrl.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:5px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;';

                    this.btnP = document.createElement('button');
                    this.btnP.textContent = '⏸️';
                    this.btnP.onclick = () => { this.paused = !this.paused; this.btnP.textContent = this.paused?'▶️':'⏸️'; };

                    const btnS = document.createElement('button');
                    btnS.textContent = '⏭️';
                    btnS.onclick = () => this.next();

                    const btnX = document.createElement('button');
                    btnX.textContent = '❌';
                    btnX.onclick = () => this.end();

                    [this.btnP, btnS, btnX].forEach(b => {
                        b.style.cssText = 'background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;cursor:pointer;font-size:14px;padding:4px 10px;transition:all 0.2s;';
                        b.onmouseover = () => b.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        b.onmouseout = () => b.style.backgroundColor = 'rgba(0,0,0,0.5)';
                        ctrl.appendChild(b);
                    });

                    this.el.append(this.msg, pw, ctrl);
                    document.body.appendChild(this.el);
                }
                this.show();
            },
            show() {
                if (this.idx >= this.steps.length) return this.end();
                const s = this.steps[this.idx], t = document.querySelector(s.sel);

                if (!t || t.getBoundingClientRect().height === 0) { this.idx++; return this.show(); }

                this.msg.innerHTML = \`<strong>Step \${this.idx + 1}/\${this.steps.length}</strong><br/><br/>\${s.txt}\`;

                const origShadow = t.style.boxShadow;
                t.style.boxShadow = '0 0 0 4px var(--primary)';
                setTimeout(() => t.style.boxShadow = origShadow, 2000);

                try { t.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); } catch(e) {}

                this.tLeft = 100; this.el.style.display = 'flex'; this.run();
            },
            toggle() { this.paused = !this.paused; this.btnP.textContent = this.paused ? '▶️' : '⏸️'; },
            run() {
                clearInterval(this.tmr);
                this.tmr = setInterval(() => {
                    if (this.paused) return;
                    this.tLeft -= 1;
                    this.bar.style.width = this.tLeft + '%';

                    const s = this.steps[this.idx], t = s ? document.querySelector(s.sel) : null;
                    if (t) {
                        const r = t.getBoundingClientRect(), wh = window.innerHeight, ww = window.innerWidth;
                        let top = (r.top) | 0;
                        let left = (r.left - 295) | 0;

                        if (left < 10) {
                            left = 10;
                            top = (r.bottom + 180 < wh) ? (r.bottom + 15) | 0 : (r.top - 180) | 0;
                        }

                        if (top < 10) top = 10;
                        if (left + 295 > ww) left = (ww - 295) | 0;

                        if (this.el.attributeStyleMap && typeof CSS !== 'undefined') {
                            this.el.attributeStyleMap.set('top', CSS.px(top));
                            this.el.attributeStyleMap.set('left', CSS.px(left));
                        } else {
                            this.el.style.top = top + 'px';
                            this.el.style.left = left + 'px';
                        }
                    }

                    if (this.tLeft <= 0) this.next();
                }, 100);
            },
            next() { this.idx++; this.show(); },
            end() {
                clearInterval(this.tmr);
                if (this.el) this.el.style.display = 'none';
                try { localStorage.setItem('gae_pollux_tour', '1'); } catch(e) {}
            }
        };

        try {
            if(!localStorage.getItem('gae_pollux_tour')) setTimeout(() => window.Tour.init(polluxSteps), 1500);
        } catch(e) {
            setTimeout(() => window.Tour.init(polluxSteps), 1500);
        }
    </script>
</body>
</html>`;

        dl(htmlOut, `pollux_app_${Date.now()}.html`, 'text/html');
        sysLog("Pollux Application deployed.", "#4dffff");
    };

    /* ─────────────────────────────────────────────
       8. UI RESTORATION LAYER & VISUALS
    ──────────────────────────────────────────── */

    const toggleAnim = () => {
        S.animPaused = !S.animPaused;
        if (S.nodes.btnAnim) S.nodes.btnAnim.style.opacity = S.animPaused ? '0.5' : '1';
        sysLog(`Animation ${S.animPaused ? 'Paused' : 'Resumed'}.`);
    };

    const toggleFX = () => {
        S.fxEnabled = !S.fxEnabled;
        if (S.nodes.btnFx) S.nodes.btnFx.style.opacity = S.fxEnabled ? '1' : '0.5';
        document.querySelectorAll('[data-gae-proc="true"]').forEach(c => S.fxEnabled ? c.classList.add('gae-done-fx') : c.classList.remove('gae-done-fx'));
        sysLog(`Slice FX ${S.fxEnabled ? 'Engaged' : 'Disabled'}.`);
    };

    const togglePiP = async () => {
        if (!('documentPictureInPicture' in window)) return sysLog("PiP API not supported.", "#ff4d4d");
        if (S.pipWindow) { S.pipWindow.close(); return; }
        try {
            const pip = await window.documentPictureInPicture.requestWindow({ width: 340, height: 260 });
            S.pipWindow = pip;
            const td = C.themes[S.uiTheme];
            pip.document.body.style.cssText = `background: #0a0a0a; color: ${td.hex}; font-family: monospace; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; user-select: none;`;

            // Re-apply hijack logo to PiP if active
            const logoNode = document.querySelector('a#logo svg') || document.querySelector('a.logo svg');
            if (logoNode) {
                pip.document.body.appendChild(mkEl('div', {innerHTML: safeHTML(logoNode.outerHTML)}));
            } else {
                pip.document.body.appendChild(mkEl('div', {innerHTML: safeHTML('CASTOR')}));
            }

            S.nodes.pipStats = mkEl('div', { style: 'font-size: 14px; margin-top: 15px; text-align: left; line-height: 1.8; border: 1px solid rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; background: rgba(0,0,0,0.5); white-space: pre-wrap;' });
            pip.document.body.appendChild(S.nodes.pipStats);
            updTele();
            pip.addEventListener("pagehide", () => { S.pipWindow = null; S.nodes.pipStats = null; });
            sysLog("PiP HUD Engaged.", "#4dffff");
        } catch (e) { sysLog("PiP blocked by browser.", "#ff4d4d"); }
    };

    const initVisuals = async () => {
        const bg = mkEl('div', { id: 'gae-matrix-bg', style: 'position:fixed; inset:0; z-index:-2; background-color: #0a0a0a;' });
        document.body.prepend(bg);

        const cvs = mkEl('canvas', { style: 'width:100%;height:100%;object-fit:cover;' });
        bg.appendChild(cvs);
        const ctx = cvs.getContext('2d', { alpha: false });
        let w = cvs.width = window.innerWidth / 8 | 0;
        let h = cvs.height = window.innerHeight / 8 | 0;
        let imgData = ctx.createImageData(w, h);

        window.addEventListener('resize', () => { w = cvs.width = window.innerWidth / 8 | 0; h = cvs.height = window.innerHeight / 8 | 0; imgData = ctx.createImageData(w, h); });

        let time = 0;
        let bgMode = 0;

        // Cyclic state machine for demoscene variations (12s interval)
        setInterval(() => { if (!S.animPaused) bgMode = (bgMode + 1) % 4; }, 12000);

        const rLoop = () => {
            requestAnimationFrame(rLoop);
            if (document.hidden || S.animPaused) return;
            time += 0.03;
            const d = imgData.data;
            const cx = w / 2;
            const cy = h / 2;

            for (let i = 0; i < d.length; i += 4) {
                const x = (i / 4) % w, y = ~~((i / 4) / w);
                let val = 0;

                // Multi-phase mathematical rendering pipeline
                if (bgMode === 0) {
                    val = Math.sin(x * 0.1 + time) + Math.cos(y * 0.1 + time);
                } else if (bgMode === 1) {
                    val = Math.sin(Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) * 0.2 - time * 2);
                } else if (bgMode === 2) {
                    const tInt = ~~(time * 10);
                    val = (((x + tInt) ^ (y + tInt)) % 20) / 10 - 1;
                } else {
                    val = Math.sin(x * 0.2) * Math.cos(y * 0.2 + time);
                }

                const nVal = (val + 1) / 2;
                d[i]   = 15 * (1 - nVal) + 50 * nVal;
                d[i+1] = 20 * (1 - nVal) + 60 * nVal;
                d[i+2] = 30 * (1 - nVal) + 80 * nVal;
                d[i+3] = 255;
            }
            ctx.putImageData(imgData, 0, 0);
        };
        rLoop();

        const arrowNav = mkEl('div', { class: 'gae-nav-panel' });
        const btnUp = mkEl('button', { class: 'gae-nav-btn', title: 'Scroll to Top of document', 'aria-label': 'Scroll Top', onclick: () => window.scrollTo({top:0, behavior:'smooth'}) }, [icoFlat('▲')]);
        const btnDn = mkEl('button', { class: 'gae-nav-btn', title: 'Scroll to Bottom of document', 'aria-label': 'Scroll Bottom', onclick: () => window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}) }, [icoFlat('▼')]);
        arrowNav.append(btnUp, btnDn);
        document.body.appendChild(arrowNav);
    };

    const applyUITheme = () => {
        const td = C.themes[S.uiTheme];
        const root = document.documentElement;
        root.style.setProperty('--gae-ui-bg', td.ui);
        root.style.setProperty('--gae-ui-border', td.border);
        root.style.setProperty('--gae-ui-accent', td.hex);
    };

    const applyPosition = () => {
        S.nodes.pW.className = `gae-panel-wrapper pos-${S.pos} ${S.min ? 'minimized' : ''}`;
        S.nodes.fullUi.style.display = S.min ? 'none' : 'flex';
        S.nodes.miniUi.style.display = S.min ? 'flex' : 'none';
        const m = document.querySelector('[role="main"]');
        if (!m) return;
        m.style.cssText = 'max-width: 100% !important; margin: 0 auto !important; transition: padding 0.4s ease !important; box-sizing: border-box !important;';
        if (S.min) { m.style.setProperty('padding', 'var(--gae-pad-y) var(--gae-pad-x)', 'important'); return; }
        if (S.pos === 'right') m.style.setProperty('padding', 'var(--gae-pad-y) calc(var(--gae-side-w) + var(--gae-pad-x)) var(--gae-pad-y) var(--gae-pad-x)', 'important');
        else if (S.pos === 'left') m.style.setProperty('padding', 'var(--gae-pad-y) var(--gae-pad-x) var(--gae-pad-y) calc(var(--gae-side-w) + var(--gae-pad-x))', 'important');
        else if (S.pos === 'top') m.style.setProperty('padding', 'calc(var(--gae-side-h) + var(--gae-pad-y)) var(--gae-pad-x) var(--gae-pad-y) var(--gae-pad-x)', 'important');
        else if (S.pos === 'bottom') m.style.setProperty('padding', 'var(--gae-pad-y) var(--gae-pad-x) calc(var(--gae-side-h) + var(--gae-pad-y)) var(--gae-pad-x)', 'important');
    };

    const buildMarquee = (parentEl) => {
        const wrap = mkEl('div', { class: 'gae-marquee-wrapper' });
        const track = mkEl('div', { class: 'gae-marquee-track' });

        const makeItem = (content) => {
            const span = mkEl('span', { class: 'mq-item text-hint', style: 'z-index:3; position:relative;' });
            if (typeof content === 'string') span.appendChild(document.createTextNode(content));
            else span.appendChild(content);
            return span;
        };

        const createBlock = () => {
            const inner = mkEl('div', { class: 'mq-inner' });
            inner.appendChild(mkEl('span', { class: 'mq-item text-hint', style: 'font-weight:bold; color:var(--gae-ui-accent); z-index:3; position:relative;' }, ['⚙️ Tech Adept 00FACE']));

            const uName = mkEl('span', { class: 'mq-item text-hint', style: 'z-index:3; position:relative;' }, ['Discord & Stout Username: ', mkEl('strong', {style:'color:#ffffff; margin-left:4px;'}, ['00FACE'])]);
            inner.appendChild(uName);

            inner.appendChild(makeItem(mkEl('a', {href:'https://ko-fi.com/00face', target:'_blank'}, ['☕ Ko-Fi'])));
            inner.appendChild(makeItem(mkEl('a', {href:'https://www.viewbug.com/member/armandocornaglia', target:'_blank'}, ['📷 ViewBug'])));
            inner.appendChild(makeItem(mkEl('a', {href:'https://drive.google.com/drive/folders/1FxVBTox0ibuRO8_77Iwf2kl9Wvh6qe0S?usp=sharing', target:'_blank'}, ['🎨 Branding & Design'])));
            inner.appendChild(makeItem(mkEl('a', {href:'https://codepen.io/thefacebiters', target:'_blank'}, ['💻 CodePen'])));
            inner.appendChild(makeItem(mkEl('a', {href:'https://github.com/00face', target:'_blank'}, ['🐙 GitHub'])));
            inner.appendChild(makeItem(mkEl('a', {href:'https://www.catchafire.org/profiles/237598/impact', target:'_blank'}, ['🔥 Catchafire Impact'])));
            return inner;
        };

        track.append(createBlock(), createBlock(), createBlock());
        wrap.appendChild(track);
        parentEl.appendChild(wrap);

        let speed = 1.0;
        let targetSpeed = 1.0;
        let pos = 0;

        const tick = () => {
            speed += (targetSpeed - speed) * 0.05;
            pos -= speed;
            const inner = track.firstElementChild;
            if (inner && -pos >= inner.offsetWidth) pos += inner.offsetWidth;
            track.style.transform = `translateX(${pos}px)`;
            requestAnimationFrame(tick);
        };

        wrap.addEventListener('mouseenter', () => targetSpeed = 0);
        wrap.addEventListener('mouseleave', () => targetSpeed = 1.0);
        tick();
    };

    const injectCSS = () => {
        const s = document.createElement('style');
        s.appendChild(document.createTextNode(`
            :root {
                --gae-ui-bg: transparent; --gae-ui-border: transparent; --gae-ui-accent: transparent;
                --gae-side-w: clamp(350px, 30dvw, 450px); --gae-side-h: clamp(300px, 40dvh, 450px);
                --gae-pad-x: clamp(20px, 5dvw, 60px); --gae-pad-y: clamp(20px, 5dvh, 60px);
                --gm3-sys-color-background: #131314; --gm3-sys-color-on-background: #e3e3e3;
                --gm3-sys-color-surface: #131314; --gm3-sys-color-on-surface: #e3e3e3;
                --gm3-sys-color-primary: #a8c7fa; --gm3-sys-color-on-primary: #062e6f;
            }
            body, html, c-wiz, .jkOv3d, #yDmH0d, .K4vxLd-WsjYwc, .YkIxob, .GW5NCb { background: transparent !important; box-shadow: none !important; }
            .GW5NCb, .YkIxob { background: var(--gae-ui-bg) !important; padding: var(--gae-pad-y) var(--gae-pad-x) !important; border-radius: 20px !important; border: 1px solid var(--gae-ui-border) !important; backdrop-filter: blur(20px) !important; margin-bottom: var(--gae-pad-y) !important; box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important; padding-bottom: 40px !important; }
            [jsname="MFYZYe"], .CW0isc, .zVOd1b, .ra4qYd { background: var(--gae-ui-bg) !important; border: 1px solid var(--gae-ui-border) !important; border-radius: 16px !important; margin-bottom: var(--gae-pad-y) !important; padding: calc(var(--gae-pad-y) * 0.8) !important; color: #f1f3f4 !important; backdrop-filter: blur(20px) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important; transition: all 0.3s ease !important;}
            [jsname="MFYZYe"]:not([data-gae-proc="true"]):hover { transform: scale(1.02); }

            /* Text Hinting */
            .text-hint { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8); }

            /* Structural Wrappers */
            .gae-panel-wrapper { position: fixed; z-index: 999999; background: var(--gae-ui-bg); backdrop-filter: blur(35px); transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); font-family: 'JetBrains Mono', monospace; color: #fff; box-shadow: 0 0 80px rgba(0,0,0,0.8); padding-bottom: 26px; overflow-y: auto; }
            .gae-panel-wrapper.pos-right { top: 0; right: 0; width: var(--gae-side-w); height: 100dvh; border-left: 2px solid var(--gae-ui-border); }
            .gae-panel-wrapper.pos-left { top: 0; left: 0; width: var(--gae-side-w); height: 100dvh; border-right: 2px solid var(--gae-ui-border); }
            .gae-panel-wrapper.pos-top { top: 0; left: 0; width: 100dvw; height: var(--gae-side-h); border-bottom: 2px solid var(--gae-ui-border); }
            .gae-panel-wrapper.pos-bottom { bottom: 0; left: 0; width: 100dvw; height: var(--gae-side-h); border-top: 2px solid var(--gae-ui-border); }
            .gae-panel-wrapper.minimized { top: auto !important; left: auto !important; bottom: 40px !important; right: 30px !important; width: auto !important; height: auto !important; border: 2px solid var(--gae-ui-border); border-radius: 40px; padding-bottom: 0; overflow-y: visible; }
            .gae-full-ui { display: flex; flex-direction: column; padding: 30px 25px; box-sizing: border-box; }
            .gae-mini-ui { display: none; align-items: center; padding: 15px 25px; gap: 20px; font-weight: bold; color: var(--gae-ui-accent); }

            /* GEL CELLPHONE BUTTONS */
            .nokia-key, .gae-manual-btn {
                background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.5) 100%) !important;
                box-shadow: inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -2px 5px rgba(0,0,0,0.8), 0 4px 6px rgba(0,0,0,0.5) !important;
                border-radius: 30px !important; border: 1px solid rgba(0,0,0,0.8) !important;
                transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                color: #fff; font-weight: 800; font-family: sans-serif; font-size: 10px; text-transform: uppercase; cursor: pointer;
                display: flex; align-items: center; justify-content: flex-start; text-align: left; padding: 4px 15px 4px 4px; gap: 10px;
                position: relative; overflow: hidden;
            }
            .nokia-key:hover, .gae-manual-btn:hover {
                background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.4) 100%) !important;
                transform: translateY(-2px); box-shadow: inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 5px rgba(0,0,0,0.8), 0 6px 12px rgba(0,0,0,0.6) !important;
            }
            .nokia-key:active, .gae-manual-btn:active {
                transform: translateY(2px) scale(0.98);
                background: rgba(0,0,0,0.7) !important;
                box-shadow: inset 0 2px 6px rgba(0,0,0,0.9), inset 0 -1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.4) !important;
            }
            .nokia-key.select-style { appearance: none; padding: 8px; justify-content: center; border-radius: 8px !important; }
            .nokia-key.primary { color: var(--gae-ui-accent); }
            .nokia-key.danger { color: #ff4d4d; }

            /* INSET ENCIRCLED ICON */
            .icon-circle {
                display: inline-flex; align-items: center; justify-content: center;
                width: 28px; height: 28px; border-radius: 50%;
                background: rgba(0,0,0,0.6) !important;
                border: 1px solid rgba(0,0,0,0.8) !important; font-size: 12px; z-index: 3; position: relative;
                box-shadow: inset 2px 2px 6px rgba(0,0,0,0.9), inset -1px -1px 3px rgba(255,255,255,0.2) !important; flex-shrink: 0; color: #fff;
            }
            .nokia-key::after, .gae-manual-btn::after {
                content: ''; position: absolute; top: 0; left: 16px; width: 150px; height: 100px;
                background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 60%);
                transform-origin: top left; transform: rotate(15deg); pointer-events: none; z-index: 2;
            }

            /* VERTICAL PILLS (Header) */
            .gae-btn {
                flex-direction: column !important; border-radius: 20px !important; padding: 10px 5px !important;
                box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5) !important; background: rgba(0,0,0,0.4) !important;
                border: 1px solid rgba(0,0,0,0.8) !important; gap: 4px; display:flex; align-items:center; justify-content:center;
                color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s ease-in-out; font-size:12px; text-decoration: none;
            }
            .gae-btn:hover { background: rgba(0,0,0,0.6) !important; border-color: var(--gae-ui-accent) !important; transform: translateY(-2px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.6) !important; }
            .gae-btn:active { transform: translateY(1px); box-shadow: inset 1px 1px 3px rgba(0,0,0,0.8) !important; }
            .icon-flat { font-size: 16px; background: transparent; border: none; box-shadow: none; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }

            .gae-terminal-wrapper { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; flex-shrink: 0; }
            .gae-term-frame { height: 100px; border-radius: 6px; padding: 8px; font-size: 10px; color: var(--gae-ui-accent); overflow-y: auto; position: relative; box-shadow: inset 3px 3px 8px rgba(0,0,0,0.8), inset -2px -2px 5px rgba(255,255,255,0.04) !important; border: 1px solid #000 !important; background: rgba(0,0,0,0.4) !important;}
            .gae-term-frame::-webkit-scrollbar { width: 4px; }
            .gae-term-frame::-webkit-scrollbar-thumb { background: var(--gae-ui-accent); }

            .api-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 8px; margin-bottom: 20px; flex-shrink: 0; }
            .api-grid-span2 { grid-column: span 2; }
            .api-input { color: var(--gae-ui-accent); padding: 10px; border-radius: 6px; width: 100%; box-sizing: border-box; font-size: 11px; font-family: monospace; position: relative; box-shadow: inset 3px 3px 8px rgba(0,0,0,0.8), inset -2px -2px 5px rgba(255,255,255,0.04) !important; border: 1px solid #000 !important; background: rgba(0,0,0,0.4) !important; }

            .nokia-chassis { padding: 15px; border-radius: 20px; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; position: relative; box-shadow: inset 3px 3px 8px rgba(0,0,0,0.8), inset -2px -2px 5px rgba(255,255,255,0.04) !important; border: 1px solid #000 !important; background: rgba(0,0,0,0.4) !important;}
            .nokia-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

            /* Marquee */
            .gae-marquee-wrapper { position: fixed; bottom: 0; left: 0; width: 100vw; height: 26px; background: #000000; border-top: 1px solid var(--gae-ui-border); z-index: 9999999; display: flex; align-items: center; overflow: hidden; font-family: monospace; font-size: 11px; white-space: nowrap; color: #fff; }
            .gae-marquee-track { display: inline-block; white-space: nowrap; will-change: transform; }
            .mq-inner { display: inline-block; padding-right: 50px; }
            .mq-item { padding-right: 40px; color: inherit; text-decoration: none; display: inline-flex; align-items: center; }
            .mq-item > a { color: #ffffff; text-decoration: underline; transition: color 0.2s; }
            .mq-item > a:hover { color: var(--gae-ui-accent); text-decoration: underline; }
        `));
        document.head.appendChild(s);
    };

    const drawASCIILogo = () => {
        return mkEl('pre', { class: 'ascii-logo', style: 'font-size: 10px; line-height: 12px; font-family: monospace; white-space: pre; color: var(--gae-ui-accent); text-align: center; margin-bottom: 10px; font-weight: bold; text-shadow: 0 0 5px var(--gae-ui-accent); overflow-x: hidden;' },
            [`  ___   _   ___ _____ ___  ___ \n / __| /_\\ / __|_   _/ _ \\| _ \\\n| (__ / _ \\\\__ \\ | || (_) |   /\n \\___/_/ \\_\\___/ |_| \\___/|_|_\\`]
        );
    };

    const buildUI = () => {
        S.nodes.pW = mkEl('aside', { class: 'gae-panel-wrapper', role: 'region', 'aria-label': 'Castor Settings Panel' });
        S.nodes.fullUi = mkEl('div', { class: 'gae-full-ui' });
        S.nodes.miniUi = mkEl('div', { class: 'gae-mini-ui' });

        const minBtn = mkEl('button', { class: 'nokia-key', title: 'Expand the interface', 'aria-label': 'Maximize Window', style: 'border:none;', onclick: (e) => { e.preventDefault(); window.Castor.maximize(); } }, btnLayout('🗗', 'MAXIMIZE'));
        S.nodes.mini = mkEl('span', {}, [`C: 0 | V: 0 | Q: 0`]);
        S.nodes.miniUi.append(minBtn, S.nodes.mini);

        const head = mkEl('div', { style: 'flex-shrink: 0; display:flex; flex-direction:column; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; margin-bottom:15px; gap: 10px;' });
        head.append(drawASCIILogo());
        const headToggles = mkEl('div', { style: 'display:flex; gap:6px; width: 100%; justify-content: space-between;' });

        // Toggles & Controls
        S.nodes.btnAudio = mkEl('button', { class: 'gae-btn', title: 'Turn background audio processor on or off', 'aria-label': 'Toggle Audio Processor', style: `opacity:${S.audioToggled ? '1' : '0.5'}; flex:1;`, onclick: (e) => { e.preventDefault(); window.Castor.audio(); } }, [icoFlat(S.audioToggled ? '🔊' : '🔈')]);
        S.nodes.btnAnim = mkEl('button', { class: 'gae-btn', title: 'Play or pause the background visual animation', 'aria-label': 'Toggle Background Animation', style: `opacity:${S.animPaused ? '0.5' : '1'}; flex:1;`, onclick: (e) => { e.preventDefault(); window.Castor.anim(); } }, [icoFlat('🎞️')]);
        S.nodes.btnFx = mkEl('button', { class: 'gae-btn', title: 'Turn visual slice effects on extracted cards on or off', 'aria-label': 'Toggle Slice Effects', style: `opacity:${S.fxEnabled ? '1' : '0.5'}; flex:1;`, onclick: (e) => { e.preventDefault(); window.Castor.fx(); } }, [icoFlat('🩹')]);
        S.nodes.btnPip = mkEl('button', { class: 'gae-btn', title: 'Pop out telemetry into a floating window', 'aria-label': 'Toggle Picture-in-Picture Telemetry', style: 'flex:1;', onclick: (e) => { e.preventDefault(); window.Castor.pip(); } }, [icoFlat('📺')]);

        const btnTour = mkEl('button', { class: 'gae-btn', style: 'flex:1;', title: 'Replay Castor Interface Walkthrough', 'aria-label': 'Trigger Interactive Tour Guide', onclick: (e) => { e.preventDefault(); Tour.init(castorSteps); } }, [icoFlat('❓')]);

        const selDiag = mkEl('select', { id: 'gae-sel-diag', name: 'gae-sel-diag', class: 'gae-btn', style: 'font-size:10px; flex:2; appearance:none; text-align:center; cursor:pointer;', title: 'Developer tools for injecting test data', 'aria-label': 'Diagnostic Injection Tools' });
        selDiag.append(mkEl('option', { value: '', selected: true, disabled: true }, ['🧪 TEST DIAGNOSTICS']));
        selDiag.append(mkEl('option', { value: 'inj5' }, ['+ 5 Robust Records']));
        selDiag.append(mkEl('option', { value: 'inj15' }, ['+ 15 Robust Records']));
        selDiag.append(mkEl('option', { value: 'inj30' }, ['+ 30 Robust Records']));
        selDiag.append(mkEl('option', { value: 'copylog' }, ['📋 Copy Terminal Logs']));

        selDiag.onchange = async (e) => {
            const val = e.target.value;
            selDiag.value = '';
            if (val.startsWith('inj')) {
                const count = parseInt(val.replace('inj', ''));
                if (!S.idb && !(await initSec())) return;
                sysLog(`Injecting ${count} robust mock records...`, "#4dffff");

                const mockTemplates = [
                    {
                        text: `User: What is the history of Pollux and Castor, and how does it relate to Gemini?\n\nAssistant: In Greek and Roman mythology, Castor and Pollux (the Dioscuri) were twin half-brothers. Castor was the mortal son of Tyndareus, the king of Sparta, while Pollux was the divine son of Zeus. When Castor died, Pollux asked Zeus to let him share his own immortality with his twin to keep them together. Zeus transformed them into the constellation Gemini (Latin for "twins"). In the year 3099, their namesake AI models fight a new war: the preservation of digital knowledge against the entropy of time.`,
                        media: [
                            'https://gemini.google.com/share/b98aff2b64cc',
                            'https://gemini.google.com/share/c4768c726c88'
                        ]
                    },
                    {
                        text: `User: Design a PostgreSQL schema for a multi-tenant SaaS application handling billing and user roles.\n\nAssistant: To design a robust multi-tenant schema, you should use Row-Level Security (RLS). Here is the SQL schema:\n\nCREATE TABLE tenants ( id UUID PRIMARY KEY, name TEXT );\nCREATE TABLE users ( id UUID PRIMARY KEY, tenant_id UUID REFERENCES tenants(id), role TEXT );\n\nBy enabling RLS on the 'users' table, you ensure data isolation across tenants.`,
                        media: []
                    },
                    {
                        text: `User: What is the significance of the cosmic microwave background (CMB)?\n\nAssistant: The Cosmic Microwave Background (CMB) is the residual thermal radiation left over from the Big Bang. Discovered in 1965, it provides a snapshot of the universe when it was just 380,000 years old. Its uniformity, with microscopic temperature fluctuations, perfectly maps to the density variations that eventually formed galaxies. It is the strongest piece of evidence for the expanding universe theory.`,
                        media: []
                    },
                    {
                        text: `User: Write a Python function to perform a binary search on a sorted array.\n\nAssistant: Here is an optimized iterative binary search in Python:\n\n\`\`\`python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\`\`\`\nThis operates in O(log n) time complexity.`,
                        media: []
                    }
                ];

                for (let i = 0; i < count; i++) {
                    const tmpl = mockTemplates[i % mockTemplates.length];
                    const raw = `[SYS_UUID: ${crypto.randomUUID()}]\n${tmpl.text}`;
                    const sum = `MOCK: Substantive Payload ${i}`;

                    const hash = await hashText(raw);
                    if (!S.knownHashes.has(hash)) {
                        S.knownHashes.add(hash);
                        await saveVault({ hash, time: new Date().toISOString(), summary: sum, original: raw, media: tmpl.media, sftGenerated: false });
                    }
                }
                sysLog(`+${count} Mock Records added to Vault.`, "#4dff4d");
            } else if (val === 'copylog') {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = S.conTline.map(h => h.text).join('\n');
                    ta.style.position = 'fixed'; ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select(); document.execCommand('copy'); ta.remove();
                    sysLog("Terminal Logs copied to clipboard.", "#4dff4d");
                } catch (err) { sysLog("Clipboard copy failed.", "#ff4d4d"); }
            }
        };

        const mMinus = mkEl('button', { class: 'gae-btn', title: 'Collapse the interface to save screen space', 'aria-label': 'Minimize Window', style: 'flex:1;', onclick: (e) => { e.preventDefault(); window.Castor.minimize(); } }, [icoFlat('_')]);

        headToggles.append(S.nodes.btnAudio, S.nodes.btnAnim, S.nodes.btnFx, S.nodes.btnPip, btnTour, selDiag, mMinus);
        head.append(headToggles);
        S.nodes.fullUi.appendChild(head);

        const termWrap = mkEl('div', { class: 'gae-terminal-wrapper' });
        S.nodes.termMeta = mkEl('div', { class: 'gae-term-frame text-hint', title: 'Live system metrics and quotas', 'aria-label': 'System Telemetry Window' });

        // SHADOW DOM CONSOLE ATTACHMENT
        const cWrap = mkEl('div', { class: 'gae-term-frame text-hint', title: 'Live system operation logs', 'aria-label': 'Console Logs Window' });
        try {
            const shadow = cWrap.attachShadow({mode: 'open'});
            const style = mkEl('style', {}, ['.log-line{font-family:monospace;font-size:10px;margin-bottom:2px;word-break:break-all;}']);
            const container = mkEl('div', {id: 'log-container'});
            shadow.appendChild(style);
            shadow.appendChild(container);
            S.nodes.logContainer = container;
        } catch(e) {
            S.nodes.logContainer = cWrap; // Fallback if ShadowDOM fails
        }
        S.nodes.termConsole = cWrap;

        termWrap.append(S.nodes.termMeta, S.nodes.termConsole);
        S.nodes.fullUi.appendChild(termWrap);

        const apiGrid = mkEl('div', { class: 'api-grid' });
        const selAgent = mkEl('select', { id: 'gae-sel-agent', name: 'gae-sel-agent', class: 'api-input text-hint', title: 'Select which AI provider to connect to', 'aria-label': 'Select AI Provider', onchange: () => { S.agent = selAgent.value; storage.set('gae_agent', S.agent); } });
        ['Gemini', 'Ollama'].forEach(p => selAgent.appendChild(mkEl('option', { value: p, selected: p === S.agent }, [p])));

        // Wrapped API Key Input + External Links
        const kiWrap = mkEl('div', { style: 'display:flex; gap:4px; width:100%;' });
        const ki = mkEl('input', { id: 'gae-api-key', name: 'gae-api-key', class: 'api-input text-hint', style: 'flex:1;', type: 'password', placeholder: 'API Key (SESSION)', title: 'Enter your API key securely (cleared when closed)', 'aria-label': 'Enter Volatile API Key', value: S.apik });
        ki.onchange = () => { S.apik = ki.value; storage.sSet('gae_api', ki.value); };

        const keyLinksWrap = mkEl('div', { id: 'gae-api-key-links', style: 'display:flex; gap:4px; align-items:center; justify-content:center;' });
        keyLinksWrap.append(
            mkEl('a', { href: 'https://aistudio.google.com/api-keys', target: '_blank', title: 'Get Gemini API Key', class: 'gae-btn', style: 'padding:4px !important; width:28px; height:28px; border-radius:6px !important;' }, [icoFlat('✨')]),
            mkEl('a', { href: 'https://console.cloud.google.com/apis/credentials', target: '_blank', title: 'Get Google Cloud API Key', class: 'gae-btn', style: 'padding:4px !important; width:28px; height:28px; border-radius:6px !important;' }, [icoFlat('☁️')]),
            mkEl('a', { href: 'https://ollama.com/settings/keys', target: '_blank', title: 'Get Ollama API Key', class: 'gae-btn', style: 'padding:4px !important; width:28px; height:28px; border-radius:6px !important;' }, [icoFlat('🦙')])
        );
        kiWrap.append(ki, keyLinksWrap);

        S.nodes.selModel = mkEl('select', { id: 'gae-sel-model', name: 'gae-sel-model', class: 'api-input text-hint', title: 'Select the specific AI model to run', 'aria-label': 'Select AI Model', disabled: true });
        S.nodes.selModel.appendChild(mkEl('option', { value: '', selected: true }, ['[AWAITING PROBE]']));

        const selFocus = mkEl('select', { id: 'gae-sel-focus', name: 'gae-sel-focus', class: 'api-input text-hint', title: 'Force the AI to focus on specific data types when parsing', 'aria-label': 'Select Data Curation Focus', onchange: () => { S.focus = selFocus.value; storage.set('gae_focus', S.focus); } });
        C.focusOpts.forEach(f => selFocus.appendChild(mkEl('option', { value: f.id, selected: f.id === S.focus }, [f.name])));

        const btnProbe = mkEl('button', { class: 'nokia-key api-grid-span2', title: 'Scan your API key to find all authorized models', 'aria-label': 'Probe Available Models', style: 'background:linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.8) 100%); color:var(--gae-ui-accent);', onclick: (e) => { e.preventDefault(); probeConnection(); } }, btnLayout('📡', 'PROBE API CONNECTIONS'));

        apiGrid.append(selAgent, kiWrap, S.nodes.selModel, selFocus, btnProbe);
        S.nodes.fullUi.appendChild(apiGrid);

        const nkWrapper = mkEl('div', { class: 'nokia-chassis' });

        const nkRow1 = mkEl('div', { class: 'nokia-row', style: 'grid-template-columns: 2fr 1fr;' });
        const selTheme = mkEl('select', { id: 'gae-sel-theme', name: 'gae-sel-theme', class: 'nokia-key select-style text-hint', title: 'Change the color scheme of the interface', 'aria-label': 'Theme Selector', onchange: (e) => { e.preventDefault(); S.uiTheme = parseInt(selTheme.value); storage.set('gae_uitheme', S.uiTheme); applyUITheme(); } });
        C.themes.forEach((th, i) => selTheme.appendChild(mkEl('option', { value: i, selected: i === S.uiTheme }, [`🎨 ${th.name}`])));

        const selPos = mkEl('select', { id: 'gae-sel-pos', name: 'gae-sel-pos', class: 'nokia-key select-style text-hint', title: 'Change which edge of the screen the panel docks to', 'aria-label': 'Dock Position Selector', onchange: (e) => { e.preventDefault(); S.pos = selPos.value; storage.set('gae_pos', S.pos); applyPosition(); } });
        ['right', 'left', 'top', 'bottom'].forEach(p => selPos.appendChild(mkEl('option', { value: p, selected: p === S.pos }, [`⚓ ${p.toUpperCase()}`])));
        nkRow1.append(selTheme, selPos);

        const nkRow2 = mkEl('div', { class: 'nokia-row', style: 'grid-template-columns: 1fr 1fr;' });
        S.nodes.btnRun = mkEl('button', { class: 'nokia-key primary', title: 'Start or Stop the automated scraping loop', 'aria-label': 'Toggle Scraper Execution', onclick: (e) => { e.preventDefault(); window.Castor.engage(); } }, btnLayout('⏯️', 'ENGAGE'));
        const btnPurge = mkEl('button', { class: 'nokia-key danger', title: 'Permanently delete all extracted data from the vault', 'aria-label': 'Delete All Vault Data', onclick: (e) => { e.preventDefault(); window.Castor.purge(); } }, btnLayout('⚠️', 'HALT + PURGE'));
        nkRow2.append(S.nodes.btnRun, btnPurge);

        const nkRow3 = mkEl('div', { class: 'nokia-row' });
        nkRow3.append(
            mkEl('button', { class: 'nokia-key', title: 'Download all raw data as a JSON file', 'aria-label': 'Export JSON File', onclick: (e) => { e.preventDefault(); window.Castor.export('json'); } }, btnLayout('📋', 'JSON')),
            mkEl('button', { class: 'nokia-key', title: 'Download all data as a readable Markdown file', 'aria-label': 'Export Markdown File', onclick: (e) => { e.preventDefault(); window.Castor.export('md'); } }, btnLayout('📝', 'MD')),
            mkEl('button', { class: 'nokia-key', title: 'Download all data as plain text', 'aria-label': 'Export Text File', onclick: (e) => { e.preventDefault(); window.Castor.export('txt'); } }, btnLayout('📄', 'TXT')),
            mkEl('button', { class: 'nokia-key', title: 'Download raw data as JSON Lines', 'aria-label': 'Export JSON Lines File', onclick: (e) => { e.preventDefault(); window.Castor.export('jsonl'); } }, btnLayout('📚', 'JSONL')),
            mkEl('button', { class: 'nokia-key', title: 'Use AI to structure and clean your raw data', 'aria-label': 'Generate SFT Dataset via AI', onclick: (e) => { e.preventDefault(); window.Castor.genSFT(); } }, btnLayout('🧠', 'GEN SFT')),
            mkEl('button', { class: 'nokia-key', title: 'Download your structured AI data as JSON Lines', 'aria-label': 'Export SFT JSON Lines File', onclick: (e) => { e.preventDefault(); window.Castor.export('sft'); } }, btnLayout('🧪', 'SFT-JSONL'))
        );

        const nkRow4 = mkEl('div', { class: 'nokia-row', style: 'grid-template-columns: 1fr 1fr;' });
        nkRow4.append(
            mkEl('button', { class: 'nokia-key primary', style: 'background: linear-gradient(180deg, rgba(80,80,200,0.9) 0%, rgba(20,20,80,0.9) 100%);', title: 'Download a fully functional Obsidian Vault zip file', 'aria-label': 'Generate Obsidian Vault File', onclick: (e) => { e.preventDefault(); window.Castor.genObsidian(); } }, btnLayout('💎', 'OBSIDIAN')),
            mkEl('button', { class: 'nokia-key', title: 'Deploy the static offline Pollux HTML5 Viewer', 'aria-label': 'Generate HTML Viewer Application', onclick: (e) => { e.preventDefault(); window.Castor.genHtml(); } }, btnLayout('🌐', 'GEN HTML'))
        );

        nkWrapper.append(nkRow1, nkRow2, nkRow3, nkRow4);
        S.nodes.fullUi.appendChild(nkWrapper);

        S.nodes.pW.append(S.nodes.miniUi, S.nodes.fullUi);
        document.body.appendChild(S.nodes.pW);
        applyUITheme(); applyPosition(); updTele();

        buildMarquee(document.body);
    };

    /* ─────────────────────────────────────────────
       9. CORE SCRAPER (O(1) QUEUE, NON-DESTRUCTIVE)
    ──────────────────────────────────────────── */

    const procCard = async (c) => {
        try {
            if (C.excl.some(r => r.test(c.innerText))) { c.style.opacity = "0.2"; S.cull++; updTele(); return; }
            const raw = c.innerText.replace(/[\uFFFD\u200B-\u200D\uFEFF]/g, '').trim();
            if (!raw || raw.length < 50) { c.style.opacity = "0.2"; S.cull++; updTele(); return; }

            const hash = await hashText(raw);
            if (S.knownHashes.has(hash)) {
                c.style.opacity = "0.2"; c.style.borderLeft = "3px solid #ff9933"; c.style.pointerEvents = "none";
                c.dataset.gaeProc = "true"; S.cull++; updTele(); return;
            }
            S.knownHashes.add(hash);

            const sum = raw.split('\n')[0].trim();
            const mediaUrls = extractMediaUrls(c);

            await saveVault({ hash, time: new Date().toISOString(), summary: sum, original: raw, media: mediaUrls, sftGenerated: false });

            if (S.fxEnabled) c.classList.add('gae-done-fx');
            else { c.style.opacity = "0.45"; c.style.borderLeft = `3px solid var(--gae-ui-accent)`; c.style.pointerEvents = "none"; }

            c.dataset.gaeProc = "true";
            S.cull++; updTele();
        } catch (e) { delete c.dataset.gaeQueued; S.seen.delete(c); }
    };

    const executeScanner = () => {
        if (S.queue.length >= 200) {
            if (!S.queueHalted) { S.queueHalted = true; sysLog("QUEUE MAXED. Halting scroll to drain...", "#ff9933"); } return;
        }
        const cards = document.querySelectorAll('[jsname="MFYZYe"]:not([data-gae-queued])');
        if (cards.length === 0) return;

        cards.forEach(c => {
            c.dataset.gaeQueued = "true"; S.seen.add(c);
            if (!c.querySelector('.gae-manual-btn')) {
                const b = mkEl('button', { class: 'gae-manual-btn', title: 'Manually Extract Card', 'aria-label': 'Extract Manual', onclick: async (e) => {
                    e.preventDefault(); e.stopPropagation(); document.activeElement.blur();
                    if (!S.key && !(await initSec())) return;
                    if (!c.dataset.gaeProc) { S.queue.push(c); updTele(); }
                }}, btnLayout('⚙️', 'Extract'));
                c.appendChild(b);
            }
            if (S.run) S.queue.push(c);
        });
        if (S.run) updTele();
    };

    const workerLoop = async () => {
        while (true) {
            try {
                if (S.queue.length <= 50 && S.queueHalted) { S.queueHalted = false; sysLog("QUEUE DRAINED. Resuming extraction.", "#4dff4d"); }
                if (!S.run || S.queue.length === 0) { await sleep(150); continue; }
                const card = S.queue.shift(); if (!card) continue;
                S.active++; updTele(); await procCard(card);
            } catch (fatalErr) { await sleep(500); } finally { if (S.active > 0) S.active--; updTele(); }
        }
    };

    /* ─────────────────────────────────────────────
       10. GLOBAL EXPORTS & BOOT SEQUENCE
    ──────────────────────────────────────────── */

    window.Castor = {
        engage: async () => {
            if (!S.key && !(await initSec())) return;
            S.run = !S.run;
            S.nodes.btnRun.replaceChildren(...btnLayout('⏯️', S.run ? 'HALT' : 'ENGAGE'));

            if (S.run) {
                sysLog("Scraping Matrix Engaged.", "#4dff4d");
                if (S.audioToggled && S.audioCtx && S.audioCtx.state !== 'running') S.audioCtx.resume();
                S.metro.postMessage('run');
            } else {
                sysLog("Scraping Matrix Halted.", "#ff9933");
                S.metro.postMessage('halt');
            }
        },
        purge: purgeVault,
        export: (type) => exportData(type),
        genSFT: processDatasetWithAI,
        genHtml: generateHtmlViewer,
        genObsidian: exportObsidianVault,
        audio: toggleMusic,
        anim: toggleAnim,
        fx: toggleFX,
        pip: togglePiP,
        minimize: () => { S.min = true; applyPosition(); },
        maximize: () => { S.min = false; applyPosition(); }
    };

    const boot = async () => {
        if (document.getElementById('gae-matrix-bg')) return;

        injectCSS(); initMetronome(); initVisuals(); buildUI();

        for(let i=0; i<S.workers; i++) workerLoop();

        if (S.audioToggled) initAudio();
        await initSec();

        sysLog("Castor Matrix Booted.", "#4dffff");
        console.log("%c 🦫 CASTOR MATRIX %c v19.98 \n%c The Omnissiah approves this payload. System Ready.", "background:#000;color:#FFE135;font-size:16px;padding:4px;border-radius:4px 0 4px;", "background:#333;color:#fff;font-size:16px;padding:4px;border-radius:0 4px 4px 0;", "color:#aaaaaa;font-style:italic;margin-top:4px;display:block;");

        // Walkthrough Tour Initialization
        if (!storage.get('gae_tour_done', false)) {
            setTimeout(() => { Tour.init(castorSteps); }, 2000);
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

})();
