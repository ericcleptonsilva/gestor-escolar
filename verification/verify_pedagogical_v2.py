from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    print("Navigating to login page...")
    try:
        page.goto("http://localhost:3000/gestor_escolar/", timeout=60000)
        page.wait_for_load_state("networkidle") # Wait for network to be idle
    except Exception as e:
        print(f"Navigation failed: {e}")
        page.screenshot(path="verification/navigation_error.png")
        browser.close()
        return

    print("Checking for login form...")
    page.screenshot(path="verification/login_page.png")

    try:
        # Check if already logged in (persistence)
        if page.locator("text=Painel Geral").is_visible():
            print("Already logged in.")
        else:
            print("Logging in...")
            page.get_by_placeholder("admin@escola.com").fill("admin@escola.com")
            page.get_by_placeholder("••••••").fill("admin")
            page.get_by_role("button", name="Entrar no Sistema").click()
            page.wait_for_selector("text=Painel Geral", timeout=10000)
            print("Logged in successfully.")
    except Exception as e:
        print(f"Login failed: {e}")
        page.screenshot(path="verification/login_error.png")
        browser.close()
        return

    # Click on Pedagogical Sidebar Item
    print("Clicking 'Pedagógico' sidebar item...")
    try:
        pedagogical_btn = page.locator("div", has_text="Pedagógico").last
        pedagogical_btn.click()

        # Wait for view to load
        page.wait_for_selector("h1:has-text('Gestão Pedagógica')", timeout=5000)
    except Exception as e:
        print(f"Failed to open Pedagogical View: {e}")
        page.screenshot(path="verification/pedagogical_error.png")
        browser.close()
        return

    # Verify content
    print("Verifying Pedagogical View...")
    content_visible = page.get_by_text("Checklist de Entregas").is_visible()
    hours_visible = page.get_by_text("Gestão de Horas").is_visible()

    if content_visible and hours_visible:
        print("SUCCESS: Pedagogical view loaded correctly.")
    else:
        print(f"FAILURE: Content missing. Checklist: {content_visible}, Hours: {hours_visible}")

    print("Taking final screenshot...")
    page.screenshot(path="verification/pedagogical_success.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
