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
        teacher_name = f"Prof. SwapTest {datetime.datetime.now().strftime('%H%M%S')}"
        print(f"Creating record for: {teacher_name}")

        # Target Modal Inputs explicitly
        modal = page.locator("div.fixed.z-50") # Modal container

        modal.get_by_placeholder("Ex: João da Silva").fill(teacher_name)

        # Fill Week Start (First date input in modal)
        modal.locator("input[type='date']").first.fill("2024-02-05")

        # Set Hours
        # We need to find the inputs for Planned and Given hours.
        # They are inputs of type number.
        # "Horas Planejadas" label is above the first one.
        # "Horas Dadas" label is above the second one.

        # Since they are in a grid, let's target by label text if possible or order.
        # Assuming Planned is the first number input in the "Gestão de Horas" section?
        # Actually, "Horas Planejadas" -> Input

        # Let's use get_by_label logic approximation (looking for nearby text)
        # Or simpler: The modal has inputs.
        # Planned is likely the first number input. Given is the second.
        # Missed hours is the third.

        number_inputs = modal.locator("input[type='number']")
        print(f"Found {number_inputs.count()} number inputs.")

        # Input 0: Planned
        # Input 1: Given
        # Input 2: Missed Hours (in the add section)

        print("Setting Planned: 40")
        number_inputs.nth(0).fill("40")

        print("Setting Given: 40")
        number_inputs.nth(1).fill("40")

        # 4. Add Missed Class (2 hours)
        print("Adding Missed Class (2 hours)...")

        # Date
        date_inputs = modal.locator("input[type='date']")
        missed_date = "2024-02-07"
        date_inputs.nth(1).fill(missed_date)

        time_input = modal.locator("input[type='time']")
        missed_time = "14:30"
        time_input.fill(missed_time)

        # Hours to miss
        # This is the 3rd number input (index 2)
        hours_input = number_inputs.nth(2)
        hours_input.fill("2")

        reason_input = modal.get_by_placeholder("Motivo")
        reason_input.fill("Swap Verification")

        # Click Add
        add_btn = modal.locator("div.grid button").last
        add_btn.click()

        # Verify calculation in "Given" input?
        # The logic updates the `given` state. The input value should reflect that.
        # Let's check the Given input value (index 1).
        given_val = number_inputs.nth(1).input_value()
        print(f"Given Input Value after deduction: {given_val}")
        if given_val == "38":
            print("SUCCESS: Given hours automatically deducted to 38.")
        else:
            print(f"FAIL: Given hours not deducted correctly. Value: {given_val}")

        # 5. Save
        print("Saving record...")
        modal.get_by_role("button", name="Salvar").click()

        # Wait for modal to close
        page.locator("text=Novo Registro Pedagógico").wait_for(state="hidden", timeout=5000)

        # 6. Verify Table Display
        print("Verifying table display order...")

        # Look for the row
        page.wait_for_timeout(1000) # Wait for re-render
        row = page.get_by_role("row").filter(has_text=teacher_name)

        if row.count() > 0:
            print(f"Found row for {teacher_name}")

            # Check for "40 / 38"
            # Since "Planned / Given" is the header.
            expected_text = "40 / 38"

            if row.get_by_text(expected_text).is_visible():
                print(f"SUCCESS: Found expected text order: '{expected_text}'")
            else:
                print(f"FAIL: Could not find text '{expected_text}' in row.")
                print(f"Row text content: {row.inner_text()}")

        else:
            print("FAIL: Row not found.")

        page.screenshot(path="verification/pedagogical_swap_result.png")

    except Exception as e:
        print(f"Test failed with exception: {e}")
        page.screenshot(path="verification/pedagogical_swap_error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
