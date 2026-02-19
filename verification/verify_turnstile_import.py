from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    # Create a mock TopData.txt
    # Format: ID;Matrícula;Code;Date;Time;Turnstile
    # 29/01/2026 (Assuming "today" in the script will be 29/01/2026? No, the app uses system date.)
    # We need to construct a file with TODAY's date.
    import datetime
    today = datetime.date.today()
    today_str = today.strftime("%d%m%Y")

    # Mock Data:
    # Student 1 (Morning): Present at 07:00
    # Student 2 (Morning): Absent (Not in file)
    # Student 3 (Afternoon): Not in file (Should be absent if file has afternoon data?)

    # We need to know the IDs/Matriculas of students in the system.
    # Let's assume we can create them or they exist.
    # To be safe, let's login and create strict test students.

    try:
        print("Logging in...")
        page.goto("http://localhost:3000/gestor_escolar/")
        try:
            page.wait_for_selector("text=Painel Geral", timeout=2000)
        except:
            page.get_by_placeholder("admin@escola.com").fill("admin@escola.com")
            page.get_by_placeholder("••••••").fill("123")
            page.get_by_role("button", name="Entrar no Sistema").click()
            page.wait_for_selector("text=Painel Geral")

        # Create Test Students
        print("Creating Test Students...")
        page.get_by_role("button", name="Alunos").click()

        def create_student(name, matricula, shift):
            page.get_by_role("button", name="Novo Aluno").click()
            page.get_by_placeholder("Nome Completo").fill(name)
            page.get_by_placeholder("Matrícula").fill(matricula)
            # Select Shift
            # Assuming Select component or native select
            # The app uses a custom Select? Or native?
            # In `StudentEditView`, shift is a select.
            page.locator("select").nth(1).select_option(shift) # 0 is Grade, 1 is Shift usually

            page.get_by_role("button", name="Salvar").click()
            page.wait_for_timeout(500)

        # Matrícula 9901 (Morning Present)
        # Matrícula 9902 (Morning Absent)
        create_student("Test Aluno Manha Presente", "9901", "Manhã")
        create_student("Test Aluno Manha Falta", "9902", "Manhã")

        # Create TopData.txt
        # "00001;00009901;111;DDMMYYYY;0700;01"
        file_content = f"00001;00009901;111;{today_str};0700;01\n"

        with open("TopData.txt", "w") as f:
            f.write(file_content)

        # Go to Attendance
        print("Importing Turnstile Data...")
        page.get_by_role("button", name="Frequência").click()

        # Upload
        # Find input[type=file] for "Importar Catraca"
        # It's hidden, usually triggered by label.
        # We need to set input files directly.
        with page.expect_file_chooser() as fc_info:
            page.get_by_text("Importar Catraca").click()
        file_chooser = fc_info.value
        file_chooser.set_files("TopData.txt")

        # Wait for alert
        # page.on("dialog") ... handled by playwright?
        # We need to accept dialog
        # But `handleImportTurnstile` uses `alert()`.
        # Playwright auto-dismisses dialogs but we might missed the message.
        # Let's just wait a bit.
        page.wait_for_timeout(2000)

        # Verify Results
        # Check Student 9901: Should be Present
        # Check Student 9902: Should be Absent (Automatic)

        # Filter for our test students if needed?
        # Just search in page text.

        row_present = page.get_by_role("row").filter(has_text="Test Aluno Manha Presente")
        row_absent = page.get_by_role("row").filter(has_text="Test Aluno Manha Falta")

        status_present = row_present.get_by_text("Presente", exact=True)
        status_absent = row_absent.get_by_text("Falta", exact=True)

        if status_present.is_visible():
            print("SUCCESS: Student 9901 marked Present.")
        else:
            print("FAIL: Student 9901 NOT marked Present.")

        if status_absent.is_visible():
            print("SUCCESS: Student 9902 marked Absent.")
        else:
            print("FAIL: Student 9902 NOT marked Absent.")
            # Check what status is
            print(f"Row text: {row_absent.inner_text()}")

        page.screenshot(path="verification/turnstile_import_result.png")

    except Exception as e:
        print(f"Test failed: {e}")
        page.screenshot(path="verification/turnstile_error.png")
    finally:
        browser.close()
        if os.path.exists("TopData.txt"):
            os.remove("TopData.txt")

with sync_playwright() as playwright:
    run(playwright)
