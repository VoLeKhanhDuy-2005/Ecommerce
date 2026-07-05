import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Header from "./header";
import { AuthContext } from "../context/auth.context";

describe("Header Component", () => {
  it("renders correctly with logo", () => {
    const mockAuthContext = {
      auth: { isAuthenticated: false, user: null },
      setAuth: () => {},
      cartCount: 0,
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </AuthContext.Provider>,
    );

    // Assert the logo text exists
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });
});
