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

        # 2. Setup: Ensure a student exists and add 3 attendance records OUT OF ORDER
        print("Navigating to Students...")
        # Use specific sidebar selector
        page.get_by_role("button", name="Alunos").click()

        # Pick first student
        page.wait_for_selector("tbody tr")
        page.locator("tbody tr").first.click()

        # Get Student Name for confirmation
        student_name = page.locator("h3.text-xl").inner_text()
        print(f"Selected student: {student_name}")

        # Go to Attendance View to add records (since Detail View is read-only for history usually? Wait, Detail View shows history, Attendance View adds it)
        print("Navigating to Attendance...")
        page.get_by_role("button", name="Frequência").click()

        # Find row for student
        row = page.get_by_role("row").filter(has_text=student_name)

        # We need to add records for specific dates.
        # The AttendanceView allows setting a date at the top.

        dates_to_add = ["2024-02-01", "2024-02-05", "2024-01-20"]
        # Expected sort order (Desc): 05/02, 01/02, 20/01

        for date_iso in dates_to_add:
            print(f"Adding attendance for {date_iso}...")
            # Set Date
            page.locator("input[type='date']").fill(date_iso)

            # Locate student row status buttons
            # We toggle 'Present' -> 'Absent' -> 'Present' to force a save?
            # Or just set to Present if not.
            # Assuming row structure: Name | Grade | Status Buttons

            # Click "Presente" button (Green)
            # The buttons are Badges with onClick.
            # "P" badge usually.
            # Let's use the status toggles in the row.

            # Wait for list to update
            page.wait_for_timeout(500)

            # Click "Presente" (P)
            # Selector: button with text "P" or title "Presente" inside the row
            # Actually, `AttendanceView` has `Badge` components that are clickable?
            # Let's check `AttendanceView` code from memory or inspection.
            # It has `P`, `F`, `J` buttons.

            present_btn = row.get_by_text("P", exact=True)
            present_btn.click()

            # Wait for save
            page.wait_for_timeout(500)

        # 3. Verify Order in Student Detail View
        print("Navigating back to Student Detail...")
        page.get_by_role("button", name="Alunos").click()
        page.get_by_role("row").filter(has_text=student_name).click()

        print("Checking History Order...")
        # Locate the history table
        history_table = page.locator("h4", has_text="Histórico de Frequência").locator("..").locator("table")

        # Get all date cells
        date_cells = history_table.locator("tbody tr td:first-child").all_inner_texts()
        print(f"Dates found: {date_cells}")

        # Filter for our test year 2024 to avoid noise from existing data
        test_dates = [d for d in date_cells if "2024" in d]

        # Check if sorted Descending
        # Format DD/MM/YYYY
        import datetime

        parsed_dates = []
        for d in test_dates:
            parts = d.split('/')
            dt = datetime.date(int(parts[2]), int(parts[1]), int(parts[0]))
            parsed_dates.append(dt)

        print(f"Parsed Test Dates: {parsed_dates}")

        is_sorted = all(parsed_dates[i] >= parsed_dates[i+1] for i in range(len(parsed_dates)-1))

        if is_sorted and len(parsed_dates) >= 3:
            print("SUCCESS: Dates are sorted descending.")
        elif len(parsed_dates) < 3:
             print("WARNING: Not enough test dates found to verify sort (maybe filtered out?).")
        else:
            print("FAIL: Dates are NOT sorted descending.")

        page.screenshot(path="verification/history_sort_result.png")

    except Exception as e:
        print(f"Test failed with exception: {e}")
        page.screenshot(path="verification/history_sort_error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
