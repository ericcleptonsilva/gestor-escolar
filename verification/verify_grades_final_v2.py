from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    session_data = '{"id":"1","name":"Admin","email":"admin@escola.com","role":"Admin","photoUrl":"https://ui-avatars.com/api/?name=Admin","allowedGrades":[]}'
    url = "http://localhost:5174/gestor_escolar/"

    try:
        page.goto(url, timeout=10000)
    except:
        pass

    time.sleep(2)
    page.evaluate(f"localStorage.setItem('escola360_session_v1', '{session_data}')")
    page.reload()
    time.sleep(5)

    try:
        page.get_by_text("Coordenação").click()
        time.sleep(2)

        # Use exact match for the tab button to avoid conflict with settings icon
        page.get_by_role("button", name="Configurações", exact=True).click()
        time.sleep(2)

        page.screenshot(path="verification/coordination_config_final.png")
        print("Screenshot taken: verification/coordination_config_final.png")

    except Exception as e:
        print(f"Error during interaction: {e}")
        page.screenshot(path="verification/error_interaction.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
