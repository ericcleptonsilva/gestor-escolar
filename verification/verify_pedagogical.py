from playwright.sync_api import sync_playwright
import time

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

        print("Logging in as Admin...")
        page.get_by_placeholder("admin@escola.com").fill("admin@escola.com")
        page.get_by_placeholder("••••••").fill("123")
        page.get_by_role("button", name="Entrar no Sistema").click()

        # Wait for dashboard
        page.wait_for_selector("text=Painel Geral")
        print("Logged in successfully.")

        # 2. Go to Pedagogical View
        print("Clicking 'Pedagógico'...")
        page.get_by_text("Pedagógico").click()

        # 3. New Record
        print("Clicking 'Novo Registro'...")
        page.get_by_role("button", name="Novo Registro").click()

        # Fill basic
        print("Filling form...")
        # Target Modal Inputs explicitly
        modal = page.locator("div.fixed.z-50") # Modal container

        modal.get_by_placeholder("Ex: João da Silva").fill("Prof. Automacao V2")

        # Fill Week Start (First date input in modal)
        modal.locator("input[type='date']").first.fill("2024-02-05")

        # 4. Test Dynamic Checklist
        print("Testing Dynamic Checklist...")
        modal.get_by_placeholder("Novo item...").fill("Relatório Mensal")
        modal.locator("div.flex.items-center.gap-2 button").click()

        if modal.get_by_text("Relatório Mensal").is_visible():
            print("Success: Dynamic checklist item added.")
        else:
            print("FAIL: Dynamic checklist item missing.")

        # 5. Test Missed Class
        print("Testing Missed Class...")
        # The missed class inputs are in a grid-cols-3 container inside the modal
        missed_section = modal.locator("div.grid.grid-cols-3")
        missed_section.locator("input[type='date']").fill("2024-02-06")
        missed_section.locator("input[type='time']").fill("10:00")
        missed_section.get_by_placeholder("Motivo").fill("Emergencia Medica")

        missed_section.locator("button").click()

        if modal.get_by_text("Emergencia Medica").is_visible():
            print("Success: Missed class added.")
        else:
            print("FAIL: Missed class missing.")

        # 6. Save
        print("Saving record...")
        modal.get_by_role("button", name="Salvar").click()

        # 7. Wait for Modal to Close
        print("Waiting for modal to close...")
        try:
            page.locator("text=Novo Registro Pedagógico").wait_for(state="hidden", timeout=5000)
            print("Modal closed.")
        except Exception as e:
            print(f"FAIL: Modal did not close. {e}")
            page.screenshot(path="verification/pedagogical_error_modal.png")
            raise e

        # 8. Verify Table Badge
        print("Verifying table badge...")

        # We look for the row with "Prof. Automacao V2"
        # Wait a bit for React to render
        page.wait_for_timeout(1000)

        row = page.get_by_role("row", name="Prof. Automacao V2")
        if row.count() > 0:
            print("Row found.")
            # Check for "1 falta(s)" badge
            if row.get_by_text("1 falta(s)").is_visible():
                print("Success: '1 falta(s)' badge visible.")
            else:
                print("FAIL: Badge not visible in row.")
                print(f"Row Text: {row.inner_text()}")
        else:
             print("FAIL: Row not found.")
             # Check if filters are interfering
             print("Checking filters...")
             filter_val = page.locator("div.bg-white input[type='date']").input_value()
             print(f"Filter Value: '{filter_val}'")

        page.screenshot(path="verification/pedagogical_verification.png")

    except Exception as e:
        print(f"Test failed with exception: {e}")
        page.screenshot(path="verification/pedagogical_error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
