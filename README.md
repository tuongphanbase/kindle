# Kindle Games

A "Kindle Home" page of light games for the Kindle web browser (and any other e-ink or low-power browser):

- **Chess**: play the computer (Easy, Medium or Hard) or a friend on the same device
- **Chinese Chess (Xiangqi)**: play the computer or a friend
- **Ô Ăn Quan**: Vietnamese Mandarin Square Capturing, against the computer or a friend
- **Minesweeper**: Easy, Medium and Hard boards, with Dig and Flag modes for touch screens
- **2048**

It's plain HTML, CSS and ES5 JavaScript with no build step and no external requests. Boards are HTML tables, not canvas, so they work in the Kindle's basic browser. The pages are high-contrast black and white with large tap targets and no animations. Games save in `localStorage`, and chess and Chinese chess show a move log.

## Put it online (GitHub Pages)

1. Merge this branch into `main`.
2. Open **Settings → Pages** in the repository, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. Open `https://<your-username>.github.io/kindle/` in the Kindle browser and bookmark it.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` and visit `http://localhost:8000`.
