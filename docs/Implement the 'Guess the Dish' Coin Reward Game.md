# Implement Coin Reward Game ("Guess the Dish" Mini-Game)

The "Coin Reward Game" feature allows users to earn extra coins through a food guessing game. Users view an image of a dish and must select the correct dish name from 4 randomized choices.

## Proposed Changes

### Backend (ExpressJS)

Add new APIs to fetch questions and evaluate answers, integrated with the User model to award coins.

#### [NEW] `ExpressJS01/src/controllers/gameController.js`

- `getFoodQuestion`:
  - Randomly fetch 1 product with an image to serve as the correct answer.
  - Randomly fetch 3 other products to serve as incorrect choices.
  - Generate a list of 4 choices (shuffled).
  - Use `jsonwebtoken` (jwt) to generate a token containing the correct `productId` and send it back to the client along with the image and 4 choices. This hides the correct answer on the client side to ensure security.
- `submitGameAnswer`:
  - Receive `token` and `answer` (the dish name selected by the user).
  - Decode the token to retrieve the correct `productId` and query the real dish name from the DB.
  - Compare the answer. If correct, award a random amount of coins (e.g., 1) to the User's account.
  - Return the correct/incorrect result and the amount of coins earned.

#### [MODIFY] `ExpressJS01/src/routes/api.js`

- Add new routes:
  - `GET /game/question`: Requires authentication (`auth`), calls `getFoodQuestion`.
  - `POST /game/submit`: Requires authentication (`auth`), calls `submitGameAnswer`.

---

### Frontend (ReactJS)

Add the game UI and integrate it into the existing system. The design will feature a modern UI/UX with smooth animations and production-ready "Wow factor".

#### [MODIFY] `ReactJS01/src/util/api.js`

- Add 2 new API call functions:
  - `getGameQuestionApi()`
  - `submitGameAnswerApi(token, answer)`

#### [NEW] `ReactJS01/src/pages/user/game.jsx`

- Create the game UI using React and Ant Design / Vanilla CSS.
- Display a prominent product image with a skeleton loading effect.
- Render 4 choice buttons.
- Handle micro-animations:
  - Change button color upon selection: Green for correct, Red for incorrect.
  - Coin drop (or celebration) effect when guessed correctly.
- State management: Loading state, current question, selection state, and results.
- Include a "Play Again" button for continuous gameplay.

#### [MODIFY] `ReactJS01/src/main.jsx`

- Register the new `/game` route under the `children` array of path `/`.

#### [MODIFY] `ReactJS01/src/components/layout/header.jsx`

- Add a "Coin Game" link button (with icon 🎮 or 🎁) to the navigation menu for easy access.

## Verification Plan

### Automated/Manual Tests

- **Backend**: Test APIs via tools (or directly via UI) to ensure tokens cannot be tampered with.
- **Frontend**:
  - Ensure images load properly.
  - Test game flow: Select correct answer, select incorrect answer, verify that the coin balance increases on the backend and updates on the UI.

> [!IMPORTANT]
>
> - Using JSON Web Tokens (JWT) for minigames prevents revealing answers on the client-side, which is best practice for production systems.
