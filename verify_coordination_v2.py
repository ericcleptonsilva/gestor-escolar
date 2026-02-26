from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Pre-set session with classes
    session_data = '{"id":"1","name":"Admin","email":"admin@escola.com","role":"Admin","photoUrl":"https://ui-avatars.com/api/?name=Admin","allowedGrades":[]}'

    page.on("dialog", lambda dialog: dialog.dismiss())

    url = "http://localhost:3000/gestor_escolar/"
    try:
        page.goto(url, timeout=5000)
    except:
        pass

    page.evaluate(f"localStorage.setItem('escola360_session_v1', '{session_data}')")
    page.reload()
    time.sleep(5)

    try:
        # Part 1: Drives & Records
        page.get_by_text("Coordenação").click()
        time.sleep(2)

        page.get_by_text("Entrega de provas e roteiros").click()
        time.sleep(1)

        page.get_by_text("Novo Registro").first.click()
        time.sleep(2)
        page.screenshot(path="coordination_record_modal.png")
        print("Record modal screenshot taken")

    except Exception as e:
        print(f"Error Part 1: {e}")
        page.screenshot(path="verification_error_p1.png")

    # Part 2: Teachers (Reload to clear modal state)
    try:
        page.reload()
        time.sleep(4)

        page.get_by_text("Coordenação").click()
        time.sleep(2)

        page.get_by_text("Professores", exact=True).click()
        time.sleep(2)

        page.get_by_text("Novo Professor").click()
        time.sleep(2)
        page.screenshot(path="coordination_teacher_modal.png")
        print("Teacher modal screenshot taken")

    except Exception as e:
        print(f"Error Part 2: {e}")
        page.screenshot(path="verification_error_p2.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
