  ___   _   ___ _____ ___  ___ 
 / __| /_\ / __|_   _/ _ \| _ \
| (__ / _ \\__ \ | || (_) |   /
 \___/_/ \_\___/ |_| \___/|_|_\

TL;DR: Castor is a robust, client-side extraction matrix designed to systematically scrape, secure, and structure raw digital conversations into a local data vault, while Pollux is its twin component functioning as an exported, offline HTML5 explorer to search, visualize, and filter those harvested archives.


Caption: The Castor matrix panel running directly in the browser, showing extraction telemetry and active queues.

## What is this?

If you use AI chat interfaces heavily, you generate a massive amount of valuable data—code snippets, worldbuilding lore, research, and project planning. Relying on the platform's default history tab makes this data hard to search, impossible to query offline, and difficult to format for other uses (like fine-tuning your own models).

This project solves that problem in two parts:

Castor: A script you run in your browser that automatically scrolls through your chat history, grabs the text and media, encrypts it, and saves it locally. It can also use an API key to turn that messy chat text into highly structured JSON data.

Pollux: A single, standalone web page that Castor generates for you. You can open it entirely offline to search, read, and filter everything Castor saved.


Caption: The Pollux offline viewer displaying archived conversations with active taxonomy filters.

## 🦫 Castor Features (The Extractor)

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/562ad928-40e9-4a21-b354-778c2640856f" />

Castor operates directly inside the browser environment where your data lives.

Automated Extraction: Click "Engage" and Castor automatically scrolls the page, capturing conversation cards into a processing queue without you having to manually copy and paste.

Local-First Security: All scraped data is immediately encrypted using AES-GCM and stored in your browser's local IndexedDB. It never touches an external server unless you explicitly tell it to.

AI-Powered Structuring (SFT): Supply a Gemini or Ollama API key, and Castor will process your raw chat logs into a pristine, structured Supervised Fine-Tuning (SFT) dataset. It infers categories, generates summaries, and cleans up the text.

Resilient API Gateway: Includes an exponential backoff and circuit-breaker system. If the AI API gets rate-limited or goes down, Castor pauses, waits, and resumes without losing your data.

Export Everything: Download your vault as raw JSON, JSON Lines (JSONL), readable Markdown (MD), or Plain Text (TXT).

Native Obsidian Vault Generation: With one click, Castor bundles all your scraped conversations into a complete, ready-to-open Obsidian markdown vault (.zip), neatly organized with tags and frontmatter.

Telemetry & Diagnostics: Features a Picture-in-Picture (PiP) mode to monitor extraction stats while you do other things, plus integrated background audio and visual demoscene effects to keep the browser tab awake.

## ✨ Pollux Features (The Explorer)

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/6c69f220-d59a-4ce8-b835-ce47b19674b1" />

Pollux is the reader. It is a zero-dependency HTML file, meaning you don't need a web server, Node.js, or an internet connection to run it. Just double-click the file.

Completely Offline: Bring your own data. Upload the JSON, JSONL, or MD files Castor exported, and Pollux will render them instantly.

Instant Search & Filtering: Filter your massive archive by inferred taxonomy (e.g., Code, Projects, Media) or specific entity tags generated during the Castor extraction phase.

Media Lightbox: Safely views extracted images and videos isolated in a dark-mode lightbox.

Customizable UI: Toggle between 14 different color themes (from "Terminal Teriyaki" to "Blackberry Sherbet"), adjust text sizing, and switch between Light/Dark modes.

Quick Actions: Every archived message features one-click copy, deep-linking, and standalone Markdown downloading.


Caption: Castor's SFT pipeline purifying raw chat logs into training-ready datasets.

### 🚀 Deployment Instructions

**CRITICAL:** Do _not_ deploy Castor by pasting it into the standard Chrome DevTools Console. Repeatedly pasting a massive script will bloat Chromium's internal `console-history` array and crash your DevTools environment. (Thank you for the feedback Marxi)

1.  Open Chrome DevTools (`F12` or `Ctrl+Shift+I`).
    
2.  Navigate to the **Sources** tab.
    
3.  In the left-hand navigation pane, select the **Snippets** tab (click `>>` if hidden).
    
4.  Click **+ New snippet** and name it `Castor`.
    
5.  Paste the `castor&pollux.js` code into the editor and save (`Ctrl+S` / `Cmd+S`).
    
6.  Right-click the `Castor` snippet and select **Run** (or press `Ctrl+Enter`).

## Latest Updates:

Planned Update Log: These listed are all basically for the goal of minimizing exposure in memory and the DOM, and enforcing strict lifecycle management aligned with user activity, rather than just leaving the door open all day.

### API Key Exposure Hardening

- [x] Transition from URL Parameter to HTTP Header: The API key will no longer be passed via URL parameters. Instead, it will be securely transmitted using the x-goog-api-key HTTP header within the safeApiFetch configuration to mitigate risks from proxy logs, browser tools, and DNS monitoring.

- [x]  DOM Sanitization: After the API key is captured into internal state, the value in the input field (<input id="gae-api-key">) will be immediately overwritten with masked characters to eliminate exposure to malicious scripts or browser extensions.

- [x] Memory Obfuscation: The API key will be stored in a scoped variable within the Immediately Invoked Function Expression (IIFE), rather than in the global state object, preventing access from the global window context.


### Browser Storage and Lifecycle Management

- [x]  Removal of sessionStorage Usage: To eliminate persistent security vulnerabilities and reduce exposure to cross-site scripting (XSS) threats, the script will discontinue storing the API key in sessionStorage.

- [x]  Ephemeral Memory Storage: Users will be required to input the API key at each script injection. The key will reside only in ephemeral closure memory, ensuring it is cleared upon page refresh or tab closure.


Inactivity-Based Zeroization (Time-to-Live)

- [x]  Implementation of a Rolling Inactivity Timeout: The API key will be automatically cleared from memory after 15 minutes of inactivity (no API calls). Each successful API request will reset this timer.

- [x]  User Re-Authentication Prompt: Upon zeroization, users will be prompted to re-enter their API key to continue operations.

- [x] Consideration for Long-Running Processes: This approach balances security with functionality by avoiding premature key deletion during extended batch operations, preventing unauthorized access errors mid-process.

## (Hardened against CWE-522)

-   **Zero-Knowledge Vault Encryption:** Your local IndexedDB storage is encrypted using AES-GCM. The encryption key is dynamically derived using PBKDF2 from a **Vault Password** you provide upon injection. The key is marked `extractable: false`. **If you lose your password, your local database is permanently cryptographically shredded. There is no recovery.**

-   
