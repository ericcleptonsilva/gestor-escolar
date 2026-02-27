from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Pre-set session to be Admin so we can access Coordination view
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
        # Navigate to Coordination -> Config to see the Grade List
        page.get_by_text("Coordenação").click()
        time.sleep(2)

        page.get_by_role("button", name="Configurações", exact=True).click()
        time.sleep(2)

        # We want to verify that the NEW standardized grades are what we'd see here.
        # Although we can't fully mock the PHP backend returning the new list without more complex setup,
        # checking the UI loads is a good smoke test.

        page.screenshot(path="verification/standardized_grades_check.png")
        print("Screenshot taken: verification/standardized_grades_check.png")

    except Exception as e:
        print(f"Error during interaction: {e}")
        page.screenshot(path="verification/error_interaction_v3.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
