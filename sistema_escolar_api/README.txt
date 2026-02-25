INSTRUÇÕES DE INSTALAÇÃO DO BACKEND (XAMPP)
=============================================

Esta pasta "sistema_escolar_api" contém os arquivos PHP necessários para o funcionamento
do sistema em modo "Sync" (Híbrido) ou "Online".

Passos para instalação:

1.  Localize a pasta de instalação do XAMPP (geralmente "C:\xampp").
2.  Entre na pasta "htdocs".
3.  Copie a pasta inteira "sistema_escolar_api" para dentro de "htdocs".
    - Caminho final: "C:\xampp\htdocs\sistema_escolar_api"

4.  Configuração do Banco de Dados:
    - O arquivo "db.php" já está configurado com as credenciais padrão do XAMPP:
      - Host: localhost
      - Usuário: root
      - Senha: (vazia)
      - Banco: escola360

    - Certifique-se de criar o banco de dados "escola360" no PHPMyAdmin
      (http://localhost/phpmyadmin), ou o sistema tentará criar as tabelas automaticamente
      se o banco já existir.

5.  Tabelas:
    - O sistema cria as tabelas automaticamente ao acessar.
    - Se precisar criar manualmente a tabela pedagógica, use o arquivo "create_pedagogical_table.sql".

6.  Teste:
    - Acesse http://localhost/sistema_escolar_api/students.php no navegador.
    - Se retornar "[]" (lista vazia) ou dados JSON, está funcionando.

Arquivos incluídos:
- db.php (Conexão)
- students.php, users.php, etc. (Endpoints da API)
- pedagogical.php (Novo módulo pedagógico)
- setup.sql (Esquema do banco)
