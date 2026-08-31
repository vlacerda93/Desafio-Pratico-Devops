# Desafio Prático DevOps & Observabilidade 🚀

Este repositório contém o projeto prático desenvolvido para a disciplina de **DevOps / Engenharia de Software**. O objetivo principal é simular o fluxo de trabalho de uma equipe profissional de engenharia, integrando **Git Flow**, pipelines de **Integração Contínua (CI/CD)** via GitHub Actions, orquestração de containers com **Docker Compose** e monitoramento com **Prometheus** e **Grafana**.

---

## 🛠️ Tecnologias Utilizadas

* **API Backend:** Node.js com TypeScript e Express.
* **Persistência:** PostgreSQL gerenciado via ORM Prisma.
* **Orquestração:** Docker & Docker Compose.
* **Observabilidade:** Prometheus (coleta de métricas) & Grafana (visualização em dashboards).
* **CI/CD:** GitHub Actions (etapas de Validação de Sintaxe, Linter, Testes de Integração e Build de Imagem).

---

## 📐 Arquitetura da Solução

O ambiente de desenvolvimento está orquestrado em 4 containers rodando em uma rede virtual comum:

1. **`db` (PostgreSQL):** Banco de dados relacional para persistência de usuários.
2. **`api` (Node/Express):** Nossa API principal, que expõe rotas de usuários e métricas instrumentadas.
3. **`prometheus`:** Responsável por realizar a raspagem (*scraping*) de métricas na rota `http://api:3000/metrics`.
4. **`grafana`:** Conectado ao Prometheus para gerar gráficos interativos de requisições e latência.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Ter o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.
* Ter o `git` instalado para clonar o repositório.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/vlacerda93/Desafio-Pratico-Devops.git
   cd Desafio-Pratico-Devops
   ```

2. **Acesse a pasta do projeto:**
   ```bash
   cd Observabilidade
   ```

3. **Inicie os containers com o Docker Compose:**
   ```bash
   docker compose up --build -d
   ```
   *(Este comando irá construir a imagem da API, realizar a migração automática do banco de dados com `prisma db push` e iniciar todos os serviços).*

4. **Acesse os serviços locais no seu navegador:**
   * **API / Métricas:** [http://localhost:3000/metrics](http://localhost:3000/metrics)
   * **Prometheus Targets:** [http://localhost:9090/targets](http://localhost:9090/targets)
   * **Grafana Dashboard:** [http://localhost:3001](http://localhost:3001) *(login padrão: admin / admin)*

---

## 📊 Estrutura de Observabilidade

* **Métricas Customizadas:** A API está instrumentada utilizando a biblioteca `prom-client` com um middleware que intercepta todas as requisições em `src/middlewares/metrics.middleware.ts`, medindo a quantidade de requisições por rota/status code e registrando a latência por meio de um Histograma.
* **Dashboards:** No Grafana (porta `3001`), configure a fonte de dados (*Data Source*) como Prometheus informando a URL `http://prometheus:9090` e utilize a aba **Explore** com consultas como `http_requests_total` para visualizar o tráfego em tempo real.

---

## ⚙️ Pipeline de CI/CD (GitHub Actions)

A cada commit ou pull request realizado nas branches `feat/*`, `develop` e `main`, o pipeline automatizado executa as seguintes etapas sequenciais para garantir a qualidade e estabilidade:

1. **Setup Node.js:** Instala a versão correta do Node.js.
2. **Install Dependencies:** Instala as dependências de produção e desenvolvimento do projeto.
3. **Lint & Code Quality:** Valida as regras de estilo de código usando o ESLint + Prettier (garantindo ausência de erros de quebra de linha CRLF/LF).
4. **Run Tests:** Executa a suíte de testes de integração com o Jest.
5. **Docker Build:** Valida a construção da imagem Docker da API para garantir que o container inicializará sem problemas em produção.

---

**Desenvolvido por Vinicius Lacerda (vlacerda93) & Team Alê e Carlos.**
