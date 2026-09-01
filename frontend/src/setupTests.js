import "@testing-library/jest-dom";

// Prepare environment before running React test
// Mock because jsom don't support some api for Ant Design

// Mock window.matchMedia for Ant Design (background running)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,// mock .matches is false
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});//=> stimulate real responsive

// Mock ResizeObserver for Ant Design
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
