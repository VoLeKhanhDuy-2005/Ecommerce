# Setup Automated Testing and CI for Backend and Frontend

This plan outlines the steps to introduce automated testing for both the ExpressJS backend and ReactJS frontend, as well as configuring a Continuous Integration (CI) pipeline using GitHub Actions to automatically run these tests. The CI pipeline will be configured using GitHub Actions (`.github/workflows/ci.yml`)

## Proposed Changes

### Backend (`ExpressJS01`)

The backend will use **Jest** and **Supertest** for testing APIs and controllers.

#### [MODIFY] [package.json](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/package.json)
- Add development dependencies: `jest`, `supertest`, `mongodb-memory-server` (for isolated DB testing).
- Add test script: `"test": "jest --detectOpenHandles --forceExit"`.

#### [NEW] [jest.config.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/jest.config.js)
- Create Jest configuration for Node.js environment.

#### [NEW] [productController.test.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ExpressJS01/src/tests/productController.test.js)
- Create sample unit/integration tests for the product controller endpoints using Supertest.

---

### Frontend (`ReactJS01`)

The frontend will use **Vitest**, **React Testing Library**, and **jsdom** for component testing.

#### [MODIFY] [package.json](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/package.json)
- Add development dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- Add test script: `"test": "vitest run"`.

#### [MODIFY] [vite.config.ts](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/vite.config.ts)
- Update Vite configuration to include Vitest settings (environment `jsdom`, setup files).

#### [NEW] [setupTests.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/setupTests.js)
- Setup file to import `@testing-library/jest-dom` for global DOM matchers.

#### [NEW] [header.test.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/ReactJS01/src/components/layout/header.test.jsx)
- Create sample component tests for the Header component.

---

### Continuous Integration (CI)

#### [NEW] [ci.yml](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/Theory/Excercise/BaiTap3_4_5_6_FullStack/VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026/.github/workflows/ci.yml)
- Create a GitHub Actions workflow that runs on `push` and `pull_request` to the `main` branch.
- Define a job `test-backend` that installs backend dependencies and runs backend tests.
- Define a job `test-frontend` that installs frontend dependencies and runs frontend tests.

## Verification Plan

### Automated Tests
- For Backend: I will run `npm install` and `npm run test` in the `ExpressJS01` directory.
- For Frontend: I will run `npm install` and `npm run test` in the `ReactJS01` directory.
