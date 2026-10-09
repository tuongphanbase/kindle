# Kindle Games

Light games built for the Kindle web browser (and any other e-ink or low-power browser):

- **Chess**: play the computer (Easy, Medium or Hard) or a friend on the same device
- **Chinese Chess (Xiangqi)**: play the computer or a friend
- **2048**

It's plain HTML, CSS and ES5 JavaScript with no build step and no external requests. The pages use high-contrast black-and-white graphics and large tap targets, and they save games in `localStorage`.

## Put it online (GitHub Pages)

1. Merge this branch into `main`.
2. Open **Settings → Pages** in the repository, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. Open `https://<your-username>.github.io/kindle/` in the Kindle browser and bookmark it.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` and visit `http://localhost:8000`.
