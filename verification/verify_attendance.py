import re
from playwright.sync_api import sync_playwright

def verify_attendance_observation(page):
    # 1. Navigate to the app (using port 3000)
    # The vite config was modified to remove base, so root is /
    page.goto("http://localhost:3000/")

    # 2. Login
    # Wait for login form
    page.wait_for_selector('input[type="email"]', timeout=30000)

    page.fill('input[type="email"]', 'admin@escola.com')
    page.fill('input[type="password"]', '123')
    page.click('button[type="submit"]')

    # Wait for dashboard to load
    page.wait_for_selector('text=Painel Geral', timeout=30000)

    # 3. Navigate to Attendance View (Frequência)
    # The text might be "Frequência" or inside a button
    # Using locator for SidebarItem
    page.click('text=Frequência')

    # Wait for Attendance view to load
    page.wait_for_selector('text=Controle de Frequência', timeout=30000)

    # 4. Verify presence of Observation input
    # Assuming there's at least one student card
    # We will look for the first input with placeholder "Adicionar observação..."
    # Note: If no students are visible (e.g. empty database), this might fail.
    # In a real scenario we'd mock data, but here we rely on the seeded database.

    # Check if there are any student cards
    # If not, try to select a class that has students?
    # For now, let's just see if we find any inputs.

    # Give it a moment to render the list
    page.wait_for_timeout(3000)

    obs_inputs = page.locator('input[placeholder="Adicionar observação..."]')
    count = obs_inputs.count()

    if count > 0:
        print(f"Found {count} observation inputs.")
        obs_input = obs_inputs.first

        # 5. Type into the input
        obs_input.click()
        obs_input.fill("Teste de observação")

        # 6. Take a screenshot of the filled input BEFORE blurring
        page.screenshot(path="verification/attendance_input_filled.png")
        print("Screenshot taken: attendance_input_filled.png")

        # 7. Blur the input (triggering the save)
        # Click somewhere else
        page.click('text=Controle de Frequência')

        # 8. Take another screenshot after blur
        page.screenshot(path="verification/attendance_after_blur.png")
        print("Screenshot taken: attendance_after_blur.png")

    else:
        print("No observation input found. Are there students loaded?")
        # Take a screenshot to debug
        page.screenshot(path="verification/attendance_debug.png")
        print("Debug screenshot taken: attendance_debug.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_attendance_observation(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
