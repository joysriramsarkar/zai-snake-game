from playwright.sync_api import sync_playwright, Page, expect

def verify_snake_visuals(page: Page):
    """
    This test verifies that the snake's new visual design is rendered correctly.
    """
    # 1. Arrange: Go to the game's homepage.
    page.goto("http://localhost:3000")

    # 2. Act: Find the "Start Game" button and click it to begin.
    # The button is identified by its accessible name, which includes the emoji.
    start_button = page.get_by_role("button", name="🎮 খেলা শুরু করুন")
    start_button.click()

    # 3. Assert: Confirm the game board is visible after starting.
    # We use a more specific locator to uniquely identify the game board.
    game_board = page.locator("div.grid.shadow-inner")
    expect(game_board).to_be_visible()

    # 4. Screenshot: Capture the game board with the newly designed snake.
    page.screenshot(path="jules-scratch/verification/snake-visuals.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_snake_visuals(page)
        browser.close()

if __name__ == "__main__":
    main()