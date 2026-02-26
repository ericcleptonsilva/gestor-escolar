from playwright.sync_api import sync_playwright
import time
import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    # Capture console logs
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

    try:
        # 1. Login
        print("Navigating to login page...")
        page.goto("http://localhost:3000/gestor_escolar/")

        try:
            page.wait_for_selector("text=Painel Geral", timeout=2000)
            print("Already logged in.")
        except:
            print("Logging in as Admin...")
            page.get_by_placeholder("admin@escola.com").fill("admin@escola.com")
            page.get_by_placeholder("••••••").fill("123")
            page.get_by_role("button", name="Entrar no Sistema").click()
            page.wait_for_selector("text=Painel Geral")
            print("Logged in successfully.")

        # 2. Go to Pedagogical View
        print("Clicking 'Pedagógico'...")
        page.get_by_text("Pedagógico").click()

        # 3. New Record
        print("Clicking 'Novo Registro'...")
        page.get_by_role("button", name="Novo Registro").click()

        # Unique Teacher Name
        teacher_name = f"Prof. Persistence {datetime.datetime.now().strftime('%H%M%S')}"
        print(f"Creating record for: {teacher_name}")

        # Target Modal Inputs explicitly
        modal = page.locator("div.fixed.z-50") # Modal container

        modal.get_by_placeholder("Ex: João da Silva").fill(teacher_name)

        # Fill Week Start
        modal.locator("input[type='date']").first.fill("2024-02-05")

        # 4. Save
        print("Saving record...")
        modal.get_by_role("button", name="Salvar").click()

        # Wait for modal to close
        page.locator("text=Novo Registro Pedagógico").wait_for(state="hidden", timeout=5000)

        # 5. Verify Immediate Appearance
        print("Verifying immediate appearance...")
        page.wait_for_timeout(1000)
        if page.get_by_text(teacher_name).is_visible():
            print("SUCCESS: Record visible immediately after save.")
        else:
            print("FAIL: Record NOT visible immediately after save (maybe overwritten by loadAllData?).")

        # 6. Reload Page
        print("Reloading page...")
        page.reload()
        page.wait_for_selector("text=Painel Geral")
        page.get_by_text("Pedagógico").click()

        # 7. Verify Persistence
        print("Verifying persistence after reload...")
        page.wait_for_timeout(2000)
        if page.get_by_text(teacher_name).is_visible():
            print("SUCCESS: Record persisted after reload.")
        else:
            print("FAIL: Record NOT visible after reload.")

        page.screenshot(path="verification/pedagogical_persistence_result.png")

    except Exception as e:
        print(f"Test failed with exception: {e}")
        page.screenshot(path="verification/pedagogical_persistence_error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
