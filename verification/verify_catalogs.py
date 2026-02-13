from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # 1. Login
        print("Navigating to login...")
        page.goto("http://localhost:3000/gestor_escolar/")
        page.fill("input[type='email']", "admin@escola.com")
        page.fill("input[type='password']", "123")
        page.click("button[type='submit']")

        # Wait for dashboard
        print("Waiting for dashboard...")
        page.wait_for_selector("text=Painel Geral")

        # 2. Click Sidebar 'Coordenação'
        print("Clicking Coordenação...")
        # Specific selector for sidebar item
        page.click("aside >> text=Coordenação")

        # Wait for view to load
        page.wait_for_selector("text=Coordenação Pedagógica")

        # 3. Open 'Cadastros Auxiliares'
        print("Opening Catalogs section...")
        page.click("text=Cadastros Auxiliares")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/catalogs_section.png")
        print("Screenshot 1 taken: Catalogs")

        # 4. Open 'Cadastros (Professores)'
        print("Opening Teachers section...")
        page.click("text=Cadastros (Professores)")
        page.wait_for_timeout(500)

        # 5. Open Teacher Modal
        print("Opening Teacher Modal...")
        page.click("text=Novo Professor")
        page.wait_for_selector("text=Editar Professor") # or Novo Professor, title check
        page.wait_for_timeout(500)
        page.screenshot(path="verification/teacher_modal_with_grades.png")
        print("Screenshot 2 taken: Teacher Modal")

        browser.close()

if __name__ == "__main__":
    run()
