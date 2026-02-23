# Dicionário de Dados - Escola 360

Este documento descreve a estrutura do banco de dados `escola360` utilizado pelo sistema.

## 1. Tabela: `students` (Alunos)
Armazena as informações cadastrais dos alunos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) | Identificador único (gerado pelo frontend/UUID). Chave Primária. |
| `name` | VARCHAR(255) | Nome completo do aluno. |
| `registration` | VARCHAR(50) | Número da matrícula (Único). |
| `sequenceNumber` | VARCHAR(50) | Número de chamada/sequência na turma. |
| `birthDate` | DATE | Data de nascimento (AAAA-MM-DD). |
| `grade` | VARCHAR(50) | Turma/Série (ex: "INF II", "1º Ano"). |
| `shift` | VARCHAR(20) | Turno (ex: "Manhã", "Tarde"). |
| `email` | VARCHAR(255) | Email do aluno ou responsável. |
| `photoUrl` | TEXT | URL ou Base64 da foto do aluno. |
| `fatherName` | VARCHAR(255) | Nome do pai. |
| `fatherPhone` | VARCHAR(50) | Telefone do pai. |
| `motherName` | VARCHAR(255) | Nome da mãe. |
| `motherPhone` | VARCHAR(50) | Telefone da mãe. |
| `guardians` | JSON | Lista de outros responsáveis (nome, telefone, parentesco). |
| `bookStatus` | VARCHAR(50) | Status do livro (ex: "Comprou", "Nao Comprou"). |
| `peStatus` | VARCHAR(50) | Status do atestado de Ed. Física (ex: "Pendente", "Aprovado"). |
| `turnstileRegistered` | TINYINT(1) | Se possui cadastro na catraca (0 ou 1). |

## 2. Tabela: `users` (Usuários)
Armazena os usuários do sistema (Administradores, Coordenadores, Professores).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) | Identificador único. Chave Primária. |
| `name` | VARCHAR(255) | Nome do usuário. |
| `email` | VARCHAR(255) | Email de login. |
| `password` | VARCHAR(255) | Senha. |
| `role` | VARCHAR(50) | Perfil de acesso: 'Admin', 'Coordinator', 'Teacher'. |
| `photoUrl` | TEXT | URL ou Base64 da foto de perfil. |
| `allowedGrades` | JSON | Lista de turmas que o usuário pode acessar (para Professores). |

## 3. Tabela: `attendance` (Frequência)
Registra as presenças e faltas diárias.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) | Identificador único. Chave Primária. |
| `studentId` | VARCHAR(255) | ID do aluno (Chave Estrangeira). |
| `date` | DATE | Data da frequência (AAAA-MM-DD). |
| `status` | VARCHAR(20) | 'Present', 'Absent' (Falta), 'Excused' (Justificado). |
| `observation` | TEXT | Observação opcional (ex: "Atestado", "Catraca"). |

## 4. Tabela: `documents` (Documentos de Saúde)
Registra entrega de atestados e laudos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) | Identificador único. Chave Primária. |
| `studentId` | VARCHAR(255) | ID do aluno. |
| `type` | VARCHAR(50) | Tipo: 'Atestado Educação Física' ou 'Laudo Médico'. |
| `description` | TEXT | Detalhes do documento. |
| `dateIssued` | DATE | Data de emissão do documento. |

## 5. Tabela: `exams` (2ª Chamada)
Gerencia agendamentos de provas de segunda chamada.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) | Identificador único. Chave Primária. |
| `studentId` | VARCHAR(255) | ID do aluno. |
| `subject` | VARCHAR(100) | Disciplina da prova (ex: "Matemática"). |
| `originalDate` | DATE | Data original da prova perdida. |
| `scheduledDate` | DATE | Nova data agendada (opcional). |
| `reason` | TEXT | Motivo da falta (ex: "Doença"). |
| `status` | VARCHAR(20) | 'Pending', 'Completed', 'Cancelled'. |
| `period` | VARCHAR(20) | Período acadêmico (ex: "1ª Bi"). |

## 6. Tabela: `pedagogical_records` (Gestão Pedagógica)
Armazena dados de acompanhamento de professores e aulas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) | Identificador único. Chave Primária. |
| `teacherName` | VARCHAR(255) | Nome do professor. |
| `weekStart` | DATE | Data de início da semana de referência. |
| `checklist` | JSON | Objeto com itens do checklist (ex: `{"Diário": true}`). |
| `classHours` | JSON | Objeto com horas planejadas e dadas (ex: `{"planned": 40, "given": 38}`). |
| `missed_classes` | JSON | Lista de aulas perdidas (data, hora, motivo). |
| `observation` | TEXT | Observações gerais. |

## 7. Tabela: `subjects` (Disciplinas)
Lista simples das disciplinas disponíveis no sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `name` | VARCHAR(100) | Nome da disciplina (ex: "História"). Chave Primária. |
