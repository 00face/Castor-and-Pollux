# Castor & Pollux

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

### Getting Started

1. Inject the castor.js script into your target environment via the browser developer console or a userscript manager.

2. Once the Castor UI appears, set your target Focus (e.g., Code, Lore, Auto).

3. Click ENGAGE to start the automated scroll-and-scrape matrix.

3.A. (Optional) Paste an API key and click GEN SFT to have the AI structure your raw data.

4. Export your data using the OBSIDIAN button for a markdown vault, or click GEN HTML to create your personal Pollux viewer.

### What's Next

- Implement chunked downloading for massive vaults (10,000+ records) to prevent memory allocation crashes during zip generation.

- Add multi-modal vision parsing to the SFT pipeline to transcribe diagrams/images scraped during the Castor run.

- Expand the Pollux viewer to support full-text regex search.

- Add a few more focuses for SFT processing.

- SYS.SEC: AES-GCM | SYS.STO: IDB V2
