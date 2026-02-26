from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Pre-set session to be Admin so we can access Coordination view
    session_data = '{"id":"1","name":"Admin","email":"admin@escola.com","role":"Admin","photoUrl":"https://ui-avatars.com/api/?name=Admin","allowedGrades":[]}'

    url = "http://localhost:5173"

    try:
        page.goto(url, timeout=10000)
    except:
        pass

    # Wait for page to be ready before evaluating
    time.sleep(2)

    # Inject session
    try:
        page.evaluate(f"localStorage.setItem('escola360_session_v1', '{session_data}')")
    except Exception as e:
        print(f"Session injection failed: {e}")

    page.reload()
    time.sleep(3)

    # Navigate to Coordination -> Config
    try:
        page.get_by_text("Coordenação").click()
        time.sleep(1)
        page.get_by_text("Configurações").click()
        time.sleep(1)

        page.screenshot(path="verification/coordination_config.png")
        print("Screenshot taken: verification/coordination_config.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
