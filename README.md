# TRANSPETRO SIMULADOS — PWA

Aplicativo web progressivo (PWA) de alto desempenho desenvolvido para preparação para o **Processo Seletivo Público Transpetro 2026** (Edital nº 03 — TRANSPETRO/PSP/TERRA/NÍVEL MÉDIO — 2026.3, ênfase **Administração e Controle**, banca **Fundação Cesgranrio**).

---

## 🚀 Tecnologias Utilizadas

- **React 19 + Vite + TypeScript**
- **Tailwind CSS v4** (interface responsiva, mobile-first e tokens de cor para os temas Atual, Branco e Preto)
- **React Router (HashRouter)** — rotas compartilháveis e navegação com voltar/avançar do navegador
- **Zustand** (estado global do simulado, cronômetro e preferências)
- **IndexedDB** com fallback para `localStorage` (persistência de tentativas, respostas, sessão e preferências)
- **Vite PWA Plugin** (manifest e service worker para funcionamento offline e instalação em desktop/mobile)
- **Vitest & React Testing Library** (suíte de testes automatizados)
- **oxlint** (análise estática)

---

## 📋 Estrutura da Prova (Edital Transpetro 2026.3)

O simulado completo padrão possui exatamente **60 questões objetivas** distribuídas em:
- **10 questões** de Língua Portuguesa (peso 1.0)
- **12 questões** de Matemática (peso 1.0)
- **38 questões** de Conhecimentos Específicos — Administração e Controle (peso 1.0, mínimo de 12 acertos)
- **5 alternativas** por questão (A a E), com uma única resposta correta.
- **Tempo padrão**: 4 horas (240 minutos), configurável entre 1 e 600 minutos.

### Critérios de aprovação

- Aproveitamento mínimo de **50% em Conhecimentos Gerais** (Português + Matemática).
- Aproveitamento mínimo de **50% em Conhecimentos Específicos**.
- Mínimo de **12 acertos** em Conhecimentos Específicos.
- **Não zerar** nenhuma matéria.
- O percentual geral considera o peso de cada matéria.

---

## ✨ Funcionalidades

- Simulado completo ou por matérias selecionadas, com correção imediata opcional.
- **Cronômetro real baseado em tempo de parede** (não depende de ticks do navegador).
- **Pausa real**: congela o tempo restante, as respostas e a navegação; ao retomar, o relógio continua exatamente de onde parou.
- **Sessão persistida**: fechar ou recarregar a página não perde o simulado. Ao reabrir, o app restaura questões, respostas, marcações, tempo restante e a última questão aberta.
- **Retomada e descarte** de simulados em andamento na tela inicial e no histórico.
- Finalização automática quando o prazo vence (inclusive com o app fechado).
- **Histórico ordenado** do mais recente para o mais antigo, com resultado, aproveitamento e tempo gasto.
- **Preferências persistidas** (tema, correção imediata padrão e duração padrão).
- **Três temas**: **Atual** (azul-marinho original), **Branco** (claro) e **Preto** (fundo puro para OLED), trocáveis em Ajustes e aplicados na hora.
- Resultado detalhado por matéria, critérios de reprovação e revisão comentada com filtros.
- Banco de questões pesquisável por enunciado, assunto, matéria e dificuldade.
- Limpeza completa dos dados locais nas configurações.
- Navegação acessível com foco visível, rótulos ARIA e modais identificados.
- **Grade de questões com feedback**: com a correção imediata ativa, cada número respondido fica verde (acerto) ou vermelho (erro); sem ela, a grade sinaliza apenas "respondida" para não revelar o gabarito.
- **Layout mobile-first**: barra fixa com cronômetro, pausa e finalização durante a prova, alvos de toque de pelo menos 44px, campos com 16px (sem zoom automático no iOS) e modais roláveis em telas baixas.

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

Para acompanhar os testes em modo watch:
```bash
npm run test:watch
```

Para verificar tipos TypeScript, build de produção e lint:
```bash
npm run build
npm run lint
```

A suíte cobre cálculo de tempo/pausa, pontuação e critérios de aprovação, início de simulado, restauração de sessão, ordenação do histórico, descarte, integridade dos bancos JSON, troca/persistência de temas e as cores de acerto/erro da grade de questões.

---

## 🗺️ Rotas da Aplicação

Com o `HashRouter`, as telas ficam em URLs compartilháveis:

| Rota | Tela |
| --- | --- |
| `#/` | Início |
| `#/setup` | Configuração do simulado |
| `#/exam` | Simulado em andamento |
| `#/result` | Resultado |
| `#/review` | Revisão comentada |
| `#/history` | Histórico |
| `#/bank` | Banco de questões |
| `#/settings` | Configurações e preferências |

---

## 📂 Organização dos Dados (Banco JSON)

Os dados estão completamente desacoplados da interface nos seguintes arquivos em `public/data/`:
- `public/data/exam_configs.json`: Configurações do edital, pesos e critérios de aprovação.
- `public/data/subjects.json`: Matérias e tópicos do edital de Administração e Controle.
- `public/data/questions/portugues.json`: Banco de questões de Língua Portuguesa.
- `public/data/questions/matematica.json`: Banco de questões de Matemática.
- `public/data/questions/conhecimentos_especificos.json`: Banco de questões de Conhecimentos Específicos.

Para adicionar ou atualizar questões, basta editar os arquivos JSON respectivos. O sistema carrega os dados dinamicamente e valida a estrutura durante os testes (`npm run test`).

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
