# Kindle Games

A "Kindle Home" page of light games for the Kindle web browser (and any other e-ink or low-power browser):

- **Cờ Gánh**: the Vietnamese capture-by-conversion game (gánh, vây and mở rules), against the computer or a friend
- **Cờ Hùm**: one Hùm (tiger) against 16 Trâu (buffaloes); play either side
- **Caro**: five in a row on a 15×15 board
- **Nối Ô**: Dots & Boxes, 3×3 to 6×6
- **Khoanh Số**: find and circle the numbers in order, against the clock
- **Mê Cung**: random mazes in four sizes
- **Nối Hình**: Onet-style tile matching (paths with at most two turns)
- **Sudoku**: three difficulties, with notes, check and hints
- **Xếp Bài**: Klondike Solitaire, draw 1 or draw 3
- **Cờ Lật**: Reversi / Othello against the computer or a friend
- **Cờ Đam**: 8×8 checkers with compulsory and multiple jumps
- **Bốn Liên Tiếp**: Connect Four
- **Xếp Số**: the sliding 15-puzzle in 3×3, 4×4 and 5×5
- **Tắt Đèn**: Lights Out, getting harder each puzzle
- **Cờ Úp**: Chinese chess with face-down pieces
- **Xì Dách**: Vietnamese Blackjack against the dealer
- **Đẩy Hộp**: Sokoban, 13 levels (all checked solvable)
- **Nonogram**: picture logic puzzles, 5×5 to 10×10
- **Takuzu**: binary 0/1 puzzles, all solvable by logic
- **Hải Chiến**: Battleship against the computer
- **Nhảy Quân**: Peg Solitaire, cross and French boards
- **Đoán Chữ**: Hangman in English or Vietnamese (without accents)
- **Đoán Mã**: Mastermind, three levels
- **Tiến Lên**: the Southern Vietnamese card game against three computer players
- **Bầu Cua Tôm Cá**: the Tết dice betting game
- **Lô Tô**: Vietnamese bingo against two computer players
- **Cờ Cá Ngựa**: Ludo for 2–4 players or against the computer
- **Cờ Vây**: Go on 9×9 or 13×13, with a beginner computer player
- **Cờ Cối Xay**: Nine Men's Morris
- **Ultimate Tic-Tac-Toe**
- **FreeCell**
- **Lật Hình**: memory pairs, 1 or 2 players
- **Killer Sudoku**, **KenKen**, **Futoshiki**, **Skyscrapers**: number puzzles, each with exactly one solution
- **Star Battle** and **Akari (Light Up)**
- **Tháp Hà Nội**: Tower of Hanoi
- **Tìm Chữ**: word search in English or Vietnamese
- **Tính Nhẩm**: mental maths practice
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
