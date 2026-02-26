from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Pre-set session to be Admin so we can access Coordination view
    session_data = '{"id":"1","name":"Admin","email":"admin@escola.com","role":"Admin","photoUrl":"https://ui-avatars.com/api/?name=Admin","allowedGrades":[]}'

    # Use the working port
    url = "http://localhost:5174/gestor_escolar/"

    try:
        page.goto(url, timeout=10000)
    except Exception as e:
        print(f"Navigation error: {e}")
        pass

    time.sleep(2)

    # Inject session
    page.evaluate(f"localStorage.setItem('escola360_session_v1', '{session_data}')")

    # Reload to apply session
    try:
        page.reload()
    except:
        pass

    time.sleep(5)

    # Navigate to Coordination -> Config
    try:
        # Check if we are logged in
        if page.get_by_text("Entrar no Sistema").is_visible():
             print("Login failed, still on login page")
             page.screenshot(path="verification/login_fail.png")
             return

        # Navigate to Coordination
        page.get_by_text("Coordenação").click()
        time.sleep(2)

        # Navigate to Config tab
        page.get_by_role("button", name="Configurações").click()
        time.sleep(2)

        # Take screenshot of Config tab to verify UI is intact
        page.screenshot(path="verification/coordination_config_final.png")
        print("Screenshot taken: verification/coordination_config_final.png")

    except Exception as e:
        print(f"Error during interaction: {e}")
        page.screenshot(path="verification/error_interaction.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
