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
      - Banco: escola360 (configurado automaticamente)

    - O sistema tentará criar o banco de dados "escola360" e as tabelas automaticamente
      no primeiro acesso. Não é necessário criar manualmente.

5.  Diagnóstico:
    - Se houver problemas, acesse http://localhost/sistema_escolar_api/debug.php
    - Este arquivo testará a conexão com o banco e permissões de escrita.

6.  Documentação:
    - Consulte o arquivo "DICIONARIO_DADOS.md" nesta pasta para ver a estrutura
      completa das tabelas e colunas do banco de dados.

Arquivos incluídos:
- db.php (Conexão e Criação Automática do Banco)
- cors.php (Configuração de Permissões de Acesso/CORS)
- debug.php (Ferramenta de Diagnóstico)
- DICIONARIO_DADOS.md (Documentação do Banco)
- students.php, users.php, etc. (Endpoints da API)
- pedagogical.php (Novo módulo pedagógico)
