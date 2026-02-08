from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    # 1. Login
    print("Navigating to login page...")
    page.goto("http://localhost:3000/gestor_escolar/")

    print("Logging in as Admin...")
    page.get_by_placeholder("admin@escola.com").fill("admin@escola.com")
    page.get_by_placeholder("••••••").fill("123")
    page.get_by_role("button", name="Entrar no Sistema").click()

    # Wait for dashboard
    page.wait_for_selector("text=Painel Geral")
    print("Logged in successfully.")

    # 2. Click on Pedagogical Sidebar Item
    print("Clicking 'Pedagógico' sidebar item...")
    page.get_by_text("Pedagógico").click()

    # 3. Verify Pedagogical View
    print("Verifying Pedagogical View...")
    # Wait for the header
    page.wait_for_selector("h1:has-text('Gestão Pedagógica')")

    # Verify Checklist Section
    if page.get_by_text("Checklist de Entregas").is_visible():
        print("Checklist section is visible.")
    else:
        print("Checklist section NOT visible.")

    # Verify Hours Section
    if page.get_by_text("Gestão de Horas").is_visible():
        print("Hours section is visible.")
    else:
        print("Hours section NOT visible.")

    # 4. Take Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/pedagogical_verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
