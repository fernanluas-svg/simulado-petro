# TRANSPETRO SIMULADOS — PWA

Aplicativo web progressivo (PWA) de alto desempenho desenvolvido para preparação para o **Processo Seletivo Público Transpetro 2026** (Edital nº 03 — TRANSPETRO/PSP/TERRA/NÍVEL MÉDIO — 2026.3, ênfase **Administração e Controle**, banca **Fundação Cesgranrio**).

---

## 🚀 Tecnologias Utilizadas

- **React 19 + Vite + TypeScript**
- **Tailwind CSS v4** (Interface responsiva, moderna e mobile-first)
- **React Router** / Zustand (Navegação e estado global robusto)
- **IndexedDB** (Persistência local de simulados, respostas e histórico sem duplicação)
- **Vite PWA Plugin** (Manifest e Service Worker para funcionamento offline e instalação em desktop/mobile)
- **Vitest & React Testing Library** (Suíte de testes automatizados)

---

## 📋 Estrutura da Prova (Edital Transpetro 2026.3)

O simulado completo padrão possui exatamente **60 questões objetivas** distribuídas em:
- **10 questões** de Língua Portuguesa (Peso 1.0)
- **10 questões** de Matemática (Peso 1.0)
- **40 questões** de Conhecimentos Específicos - Administração e Controle (Peso 1.0)
- **5 alternativas** por questão (A a E), com uma única resposta correta.
- **Tempo padrão**: 4 horas (240 minutos), configurável.

---

## 🛠️ Como Executar o Projeto Localmente

Certifique-se de ter o **Node.js** instalado (versão 18+ recomendada).

1. Clone ou abra a pasta do projeto:
   ```bash
   cd simulado_petro
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador: `http://localhost:5173`

---

## 🧪 Como Executar os Testes

Para rodar a suíte de testes com Vitest:
```bash
npm run test
```

Para verificar tipos TypeScript e build de produção:
```bash
npm run build
```

---

## 📂 Organização dos Dados (Banco JSON)

Os dados estão completamente desacoplados da interface nos seguintes arquivos em `public/data/`:
- `public/data/exam_configs.json`: Configurações do edital, pesos e critérios de aprovação.
- `public/data/subjects.json`: Matérias e tópicos do edital de Administração e Controle.
- `public/data/questions/portugues.json`: Banco de questões de Língua Portuguesa.
- `public/data/questions/matematica.json`: Banco de questões de Matemática.
- `public/data/questions/conhecimentos_especificos.json`: Banco de questões de Conhecimentos Específicos.

Para adicionar ou atualizar questões, basta editar os arquivos JSON respectivos. O sistema carrega os dados dinamicamente.

---

## 📱 Instalação PWA

O aplicativo suporta instalação direta pelo navegador (Chrome, Safari, Edge, Firefox):
1. Abra a aplicação em um navegador compatível.
2. Clique no ícone de instalação na barra de endereços ou selecione "Adicionar à Tela Inicial" no menu do celular.
3. O aplicativo funcionará em janela própria (*standalone*) e estará disponível offline após o primeiro acesso.

---

## 🌐 Publicação (Ex: Vercel)

Para publicar em produção com suporte a HTTPS:
```bash
npm run build
```
O diretório `dist` gerado pode ser publicado diretamente na **Vercel**, Netlify ou qualquer hospedagem estática moderna.
