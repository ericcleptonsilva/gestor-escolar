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

        # Check if already logged in (dashboard text) or need login
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
        teacher_name = f"Prof. DisplayTest {datetime.datetime.now().strftime('%H%M%S')}"
        print(f"Creating record for: {teacher_name}")

        # Target Modal Inputs explicitly
        modal = page.locator("div.fixed.z-50") # Modal container

        modal.get_by_placeholder("Ex: João da Silva").fill(teacher_name)

        # Fill Week Start (First date input in modal)
        # Using a fixed date for week start
        modal.locator("input[type='date']").first.fill("2024-02-05")

        # 4. Add Missed Class
        print("Adding Missed Class...")
        # The missed class inputs are in a grid-cols-12 container inside the modal (updated layout?)
        # Let's find inputs by placeholder or type relative to "Faltas por Horário"

        # Check if "Faltas por Horário" text is visible
        if modal.get_by_text("Faltas por Horário").is_visible():
            print("Found 'Faltas por Horário' section.")

        # Find the inputs for adding missed class.
        # In my read of the code, I saw inputs with:
        # value={newMissedClass.date} (type=date)
        # value={newMissedClass.time} (type=time)
        # value={newMissedClass.hours} (type=number, placeholder="Hrs")
        # value={newMissedClass.reason} (placeholder="Motivo")

        # There are multiple date inputs in the modal (Week Start, and New Missed Class Date).
        # We need the one associated with the missed class.
        # It's inside the grid.

        # Let's be specific.
        # The modal has a section "Gestão de Horas". inside that a grid for new missed class.

        # Let's try filling the last date input, usually the new record one if others are above.
        # But wait, Week Start is above.
        # So we want the SECOND date input?

        date_inputs = modal.locator("input[type='date']")
        print(f"Found {date_inputs.count()} date inputs.")

        # The second one should be the missed class date
        missed_date = "2024-02-07"
        date_inputs.nth(1).fill(missed_date)

        time_input = modal.locator("input[type='time']")
        missed_time = "14:30"
        time_input.fill(missed_time)

        hours_input = modal.locator("input[type='number'][placeholder='Hrs']")
        hours_input.fill("2")

        reason_input = modal.get_by_placeholder("Motivo")
        reason_input.fill("Doctor Appointment")

        # Click the + button to add
        # The button is next to the reason input.
        # Using the icon selector or locating button in the same container.
        # We can find the button with the Plus icon inside the grid.
        add_btn = modal.locator("div.grid button").last
        add_btn.click()

        # Verify it appears in the list inside the modal
        if modal.get_by_text("Doctor Appointment").is_visible():
            print("Success: Missed class added to list in modal.")
        else:
            print("FAIL: Missed class missing in modal list.")

        # 5. Save
        print("Saving record...")
        modal.get_by_role("button", name="Salvar").click()

        # Wait for modal to close
        try:
            page.locator("text=Novo Registro Pedagógico").wait_for(state="hidden", timeout=5000)
            print("Modal closed.")
        except:
             print("Modal didn't close, maybe validation error?")
             page.screenshot(path="verification/pedagogical_modal_stuck.png")

        # 6. Verify Table Display
        print("Verifying table display...")

        # Look for the row
        page.wait_for_timeout(1000) # Wait for re-render
        row = page.get_by_role("row").filter(has_text=teacher_name)

        if row.count() > 0:
            print(f"Found row for {teacher_name}")

            # Check for "1 falta(s)" badge
            if row.get_by_text("1 falta(s)").is_visible():
                print("Badge '1 falta(s)' is visible.")
            else:
                print("FAIL: Badge not visible.")

            # Check for Date and Time display
            # Format: 07/02/2024 14:30
            # Note: 2024-02-07 in UTC is 07/02/2024.
            expected_text = "07/02/2024 14:30"

            # Since I put it in a specific span structure, searching by text should work if it's visible.
            if row.get_by_text(expected_text).is_visible():
                print(f"SUCCESS: Found expected date/time text: '{expected_text}'")
            else:
                print(f"FAIL: Could not find text '{expected_text}' in row.")
                print(f"Row text content: {row.inner_text()}")

        else:
            print("FAIL: Row not found.")

        page.screenshot(path="verification/pedagogical_display_result.png")

    except Exception as e:
        print(f"Test failed with exception: {e}")
        page.screenshot(path="verification/pedagogical_display_error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
