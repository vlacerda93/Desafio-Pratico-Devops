# Desafio Prático DevOps e Observabilidade

## Execução individual de aprendizagem

Este diretório documenta minha execução prática do projeto de **DevOps e Observabilidade**, realizada em uma branch separada para estudo, validação e compreensão do funcionamento da solução.

Branch utilizada:

```text
feat/ale-desafio-devops
```

O objetivo desta execução foi reproduzir o ambiente localmente, compreender a integração entre os componentes, solucionar problemas encontrados durante a execução e validar o fluxo completo envolvendo:

- Git e branches
- Node.js e TypeScript
- Docker e Docker Compose
- PostgreSQL
- Prisma ORM
- Prometheus
- Grafana
- Terraform
- LocalStack

> Esta documentação registra minha execução e aprendizado individual sobre o projeto desenvolvido em equipe.

---

# 1. Arquitetura da solução

O ambiente utiliza diferentes serviços integrados:

```text
                    ┌─────────────────────┐
                    │     Aplicação       │
                    │ Node.js / Express   │
                    │     Porta 3000      │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐        ┌──────────────────┐
        │   PostgreSQL    │        │    Prometheus    │
        │   Porta 5432    │        │    Porta 9090    │
        └─────────────────┘        └────────┬─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │     Grafana      │
                                   │    Porta 3001    │
                                   └──────────────────┘


             Infraestrutura como Código

        Terraform ──────► LocalStack
                              │
                              ▼
                    AWS EC2 simulada
                    + Security Group
```

---

# 2. Tecnologias utilizadas

| Tecnologia | Função |
|---|---|
| Node.js | Ambiente de execução da API |
| TypeScript | Linguagem utilizada no backend |
| Express | Framework HTTP da API |
| PostgreSQL | Banco de dados relacional |
| Prisma | ORM utilizado pela aplicação |
| Docker | Containerização |
| Docker Compose | Orquestração dos containers |
| Prometheus | Coleta de métricas |
| Grafana | Visualização das métricas |
| Terraform | Infraestrutura como Código |
| LocalStack | Simulação local de serviços AWS |
| Git/GitHub | Versionamento e colaboração |
| GitHub Actions | Automação de CI/CD |

---

# 3. Estratégia com Git

Para realizar os testes sem interferir diretamente no código principal da equipe, foi utilizada uma branch específica:

```bash
git switch -c feat/ale-desafio-devops
```

A branch permitiu executar alterações, testes e correções de maneira isolada.

Para verificar a branch:

```bash
git branch --show-current
```

Resultado:

```text
feat/ale-desafio-devops
```

Essa abordagem representa uma prática comum em Git Flow, na qual funcionalidades e experimentações são desenvolvidas em branches separadas antes de eventual integração.

---

# 4. Validação do Build TypeScript

Durante a análise do pipeline foi identificado que o projeto não possuía um script explícito de build no `package.json`.

Foi adicionado:

```json
"build": "tsc --noEmit"
```

O comando:

```bash
npm run build
```

passou então a validar a compilação TypeScript sem gerar arquivos JavaScript.

## Por que usar `tsc --noEmit`?

O objetivo nesta etapa é verificar se o código TypeScript possui erros de compilação.

O parâmetro:

```text
--noEmit
```

faz o TypeScript realizar a validação sem gerar arquivos de saída.

Isso é útil em pipelines de CI/CD como uma etapa de qualidade antes de testes, criação de imagens ou deploy.

---

# 5. Problema encontrado com dependências

Na primeira execução:

```bash
npm run build
```

foi apresentado erro relacionado ao módulo:

```text
prom-client
```

O projeto declarava a dependência, porém ela ainda não estava corretamente disponível no ambiente local.

Foi executado:

```bash
npm install
```

Após a instalação das dependências:

```bash
npm run build
```

foi executado novamente e concluído com sucesso.

---

# 6. Pipeline CI/CD

O workflow do GitHub Actions possui etapas para validação automatizada do projeto.

Entre as etapas analisadas estão:

```text
SAST
  ↓
Build
  ↓
Lint
  ↓
Tests
  ↓
Docker Build/Push
  ↓
Terraform
```

Na etapa de build foi incluída a execução:

```yaml
- run: npm run build
```

Assim, além da instalação das dependências, o pipeline verifica a compilação TypeScript.

## Objetivo

Evitar que código com erros de tipagem ou compilação avance para etapas posteriores do pipeline.

---

# 7. Docker Compose

O ambiente foi executado com:

```bash
docker compose up -d --build
```

Foram utilizados quatro serviços principais:

```text
db
api
prometheus
grafana
```

A verificação foi realizada com:

```bash
docker compose ps
```

e também:

```bash
docker ps
```

Os containers esperados são:

```text
rental_db
api_observabilidade
prometheus
grafana
```

---

# 8. Problema encontrado entre API e PostgreSQL

Durante a primeira inicialização do ambiente, o container da API encerrou.

A investigação foi realizada com:

```bash
docker compose ps -a
```

e:

```bash
docker logs api_observabilidade
```

O Prisma apresentou:

```text
Error: P1001: Can't reach database server at `db:5432`
```

## Causa

O `depends_on` original garantia apenas que o container PostgreSQL fosse iniciado antes da API.

Isso não garantia que o PostgreSQL estivesse efetivamente pronto para aceitar conexões.

A API executava:

```text
npx prisma db push
```

antes que o banco estivesse disponível.

---

# 9. Solução: Healthcheck no PostgreSQL

Foi configurado um `healthcheck` no serviço do banco:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U user -d rentaldatabase"]
  interval: 5s
  timeout: 5s
  retries: 5
```

E a dependência da API passou a considerar a saúde do banco:

```yaml
depends_on:
  db:
    condition: service_healthy
```

Depois da alteração, o ambiente foi recriado:

```bash
docker compose down
docker compose up -d --build
```

O PostgreSQL passou a aparecer como:

```text
healthy
```

e a API permaneceu em execução.

## Por que utilizar healthcheck?

Porque iniciar um container não significa necessariamente que o serviço interno já esteja pronto.

O healthcheck permite verificar se o PostgreSQL realmente está aceitando conexões antes da inicialização da API.

---

# 10. Observabilidade

A aplicação disponibiliza métricas utilizando:

```text
prom-client
```

O middleware registra informações das requisições HTTP e disponibiliza métricas para coleta pelo Prometheus.

Endpoint utilizado:

```text
http://localhost:3000/metrics
```

---

# 11. Prometheus

O Prometheus foi configurado para coletar as métricas da API.

Arquivo:

```text
prometheus.yml
```

Configuração:

```yaml
scrape_configs:
  - job_name: 'express-app'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api:3000']
```

Dentro da rede Docker, o Prometheus consegue acessar a aplicação pelo nome do serviço:

```text
api:3000
```

A interface do Prometheus pode ser acessada em:

```text
http://localhost:9090
```

Para verificar o target:

```text
http://localhost:9090/targets
```

Durante a validação, o target:

```text
express-app
```

apresentou estado:

```text
UP
```

Isso confirma que o Prometheus estava conseguindo coletar as métricas da API.

---

# 12. Grafana

O Grafana foi executado localmente na porta:

```text
3001
```

Acesso:

```text
http://localhost:3001
```

O Prometheus foi configurado como Data Source.

Como Grafana e Prometheus estão na mesma rede Docker, foi utilizado:

```text
http://prometheus:9090
```

A conexão foi validada com sucesso.

---

# 13. Métrica `http_requests_total`

Uma das métricas analisadas foi:

```promql
http_requests_total
```

Ela permite acompanhar a quantidade de requisições HTTP processadas pela aplicação.

As séries podem incluir labels como:

```text
method
route
status_code
```

Isso permite observar, por exemplo:

- quantidade de requisições;
- rotas acessadas;
- códigos HTTP retornados;
- comportamento do tráfego.

---

# 14. Métrica `process_resident_memory_bytes`

Também foi analisada:

```promql
process_resident_memory_bytes
```

Essa métrica representa aproximadamente a quantidade de memória RAM residente utilizada pelo processo Node.js.

Durante a execução foi observado consumo próximo de:

```text
90 MB a 100 MB
```

## Por que monitorar memória?

O acompanhamento do consumo de memória pode ajudar na identificação de:

- crescimento anormal de utilização;
- possíveis vazamentos de memória;
- aumento de consumo após determinada carga;
- necessidade de investigação de desempenho.

A métrica isoladamente não comprova um vazamento de memória. Ela funciona como um indicador que pode revelar comportamento anormal ao longo do tempo.

---

# 15. Relação Prometheus e Grafana

Os dois possuem funções diferentes.

### Prometheus

Responsável principalmente por:

```text
coletar → armazenar → consultar métricas
```

### Grafana

Responsável principalmente por:

```text
consultar → visualizar → criar dashboards
```

Fluxo utilizado:

```text
API
 ↓
/metrics
 ↓
Prometheus
 ↓
Grafana
 ↓
Gráficos e dashboards
```

---

# 16. Infraestrutura como Código

O projeto também utiliza Terraform para representar infraestrutura AWS como código.

Arquivo:

```text
terraform/main.tf
```

Foram definidos:

```text
aws_security_group.api_sg
aws_instance.api_server
```

---

# 17. Por que utilizar LocalStack?

Para o laboratório foi utilizado LocalStack para simular serviços AWS localmente.

Isso permite estudar:

```text
Terraform + AWS Provider
```

sem precisar provisionar infraestrutura real na AWS.

Benefícios no ambiente educacional:

- evita custos;
- permite experimentação;
- facilita repetição do laboratório;
- possibilita validar Terraform localmente.

O provider foi configurado para utilizar:

```text
http://localhost:4566
```

como endpoint EC2.

---

# 18. Inicialização do Terraform

Dentro da pasta:

```text
Observabilidade/terraform
```

foi executado:

```bash
terraform init
```

Resultado:

```text
Terraform has been successfully initialized!
```

O provider instalado foi:

```text
hashicorp/aws v5.100.0
```

Também foi criado:

```text
.terraform.lock.hcl
```

Esse arquivo registra a seleção do provider utilizada pelo projeto.

---

# 19. Validação da configuração

Foi executado:

```bash
terraform validate
```

Resultado:

```text
Success! The configuration is valid.
```

Isso confirmou a validade sintática e estrutural da configuração Terraform.

---

# 20. Terraform Plan

Antes de provisionar os recursos foi executado:

```bash
terraform plan
```

Resultado:

```text
Plan: 2 to add, 0 to change, 0 to destroy.
```

Os dois recursos planejados foram:

```text
aws_security_group.api_sg
aws_instance.api_server
```

---

# 21. Terraform Apply

O provisionamento foi realizado com:

```bash
terraform apply -auto-approve
```

Resultado:

```text
Apply complete! Resources: 2 added, 0 changed, 0 destroyed.
```

Foram criados no ambiente simulado:

```text
Security Group
EC2
```

---

# 22. Validação do Terraform State

Para verificar os recursos registrados pelo Terraform:

```bash
terraform state list
```

Resultado:

```text
aws_instance.api_server
aws_security_group.api_sg
```

---

# 23. Inspeção da EC2 simulada

Foi utilizado:

```bash
terraform state show aws_instance.api_server
```

Entre as informações verificadas:

```text
instance_state = "running"
instance_type  = "t2.micro"
Name           = "NodeAPIServer"
```

A instância também apresentou associação com:

```text
api_security_group
```

---

# 24. Security Group

Para verificar o Security Group:

```bash
terraform state show aws_security_group.api_sg
```

A regra de entrada utilizada foi:

```text
protocol  = tcp
from_port = 3000
to_port   = 3000
cidr      = 0.0.0.0/0
```

## Por que a porta 3000?

Porque a aplicação Node.js/Express está configurada para utilizar a porta `3000`.

No laboratório, o Security Group foi criado para representar a liberação necessária para acesso ao serviço da API.

> Em um ambiente de produção real, regras como `0.0.0.0/0` devem ser avaliadas cuidadosamente e restringidas conforme os requisitos de segurança.

---

# 25. Idempotência

Depois da criação dos recursos foi executado novamente:

```bash
terraform plan
```

Resultado:

```text
No changes. Your infrastructure matches the configuration.
```

Esse comportamento demonstra uma característica fundamental da Infraestrutura como Código.

O Terraform compara:

```text
estado desejado
        ↓
estado conhecido da infraestrutura
```

e não propõe novas alterações quando ambos estão consistentes.

---

# 26. Arquivos Terraform que não devem ser versionados

Durante a execução foram gerados arquivos locais.

O `.gitignore` foi atualizado com:

```gitignore
# Terraform
**/.terraform/*
*.tfstate
*.tfstate.*
crash.log
crash.*.log
```

O arquivo:

```text
terraform.tfstate
```

não deve ser enviado ao GitHub.

Ele representa o estado da infraestrutura e pode conter informações que não devem ser expostas em um repositório.

Já:

```text
.terraform.lock.hcl
```

foi mantido para versionamento, pois registra as versões selecionadas dos providers.

---

# 27. Principais problemas encontrados e soluções

| Problema | Diagnóstico | Solução |
|---|---|---|
| Build inexistente | `npm run build` não existia | Adicionado `tsc --noEmit` |
| `prom-client` não encontrado | Dependências locais incompletas | `npm install` |
| API encerrava | Prisma P1001 | Investigação dos logs |
| PostgreSQL indisponível | API iniciava antes do banco estar pronto | Healthcheck + `service_healthy` |
| AWS CLI não disponível | Comando `aws` não reconhecido | Validação pelo Terraform State |
| Necessidade de AWS | Evitar recursos reais e custos | LocalStack |
| Arquivos Terraform locais | `tfstate` aparecia no Git | Atualização do `.gitignore` |

---

# 28. Comandos principais para reproduzir o laboratório

## Instalar dependências

```bash
npm install
```

## Validar TypeScript

```bash
npm run build
```

## Subir ambiente Docker

```bash
docker compose up -d --build
```

## Verificar containers

```bash
docker compose ps
```

## Verificar API

```text
http://localhost:3000/metrics
```

## Verificar Prometheus

```text
http://localhost:9090/targets
```

## Grafana

```text
http://localhost:3001
```

## Terraform

```bash
cd terraform

terraform init
terraform validate
terraform plan
terraform apply -auto-approve
terraform state list
terraform state show aws_instance.api_server
terraform state show aws_security_group.api_sg
terraform plan
```

---

# 29. Perguntas que podem surgir na apresentação

### Por que utilizar Prometheus?

Porque ele coleta e armazena métricas da aplicação ao longo do tempo, permitindo monitorar seu comportamento.

### Por que Grafana?

Porque fornece visualização das métricas por meio de gráficos e dashboards.

### Por que monitorar memória?

Porque alterações anormais no consumo podem indicar problemas de desempenho ou necessidade de investigação.

### Por que `process_resident_memory_bytes`?

Porque permite acompanhar a memória residente utilizada pelo processo Node.js ao longo do tempo.

### Essa métrica prova que existe vazamento de memória?

Não. Ela é um indicador. Um crescimento persistente e não esperado pode motivar uma investigação mais aprofundada.

### Por que a porta 3000 no Security Group?

Porque a API Node.js/Express do laboratório utiliza essa porta.

### Por que Terraform?

Porque permite definir infraestrutura como código, tornando o provisionamento reproduzível, versionável e automatizável.

### Por que LocalStack?

Porque permite simular serviços AWS localmente, possibilitando executar o laboratório sem provisionar recursos reais ou gerar custos na AWS.

### O LocalStack é a AWS?

Não. Ele simula APIs e comportamentos de serviços AWS para desenvolvimento e testes locais.

### O que significa idempotência?

Significa que, após atingir o estado desejado, executar novamente o planejamento não deve gerar alterações desnecessárias.

### Por que usar healthcheck no PostgreSQL?

Porque um container iniciado não significa necessariamente que o banco já esteja pronto para receber conexões.

### Qual foi o erro encontrado?

A API apresentou o erro Prisma `P1001`, pois tentou acessar `db:5432` antes de o PostgreSQL estar pronto.

### Como foi resolvido?

Foi adicionado um healthcheck ao PostgreSQL e a API passou a aguardar o estado `service_healthy`.

---

# 30. Fluxo validado

Ao final da execução, o laboratório apresentou o seguinte fluxo:

```text
Código TypeScript
       │
       ▼
Validação de Build
       │
       ▼
Docker Compose
       │
       ├────────► PostgreSQL
       │
       ▼
Node.js / Express
       │
       ▼
    /metrics
       │
       ▼
   Prometheus
       │
       ▼
     Grafana


Terraform
    │
    ▼
AWS Provider
    │
    ▼
LocalStack
    │
    ├────► Security Group :3000
    │
    └────► EC2 simulada
```

---

# 31. Resultado da execução

Foram validados com sucesso:

- build TypeScript;
- execução da API;
- comunicação com PostgreSQL;
- healthcheck do banco;
- containers Docker;
- endpoint de métricas;
- coleta pelo Prometheus;
- integração Prometheus/Grafana;
- visualização de métricas;
- execução do LocalStack;
- inicialização do Terraform;
- validação da configuração;
- planejamento da infraestrutura;
- criação da EC2 simulada;
- criação do Security Group;
- inspeção do Terraform State;
- idempotência da infraestrutura.

A execução permitiu compreender de forma prática como **desenvolvimento, CI/CD, containers, observabilidade e Infraestrutura como Código** podem fazer parte de um mesmo fluxo DevOps.

---

## Evidências

As evidências da execução incluem:

- containers Docker em execução;
- PostgreSQL com status `healthy`;
- endpoint `/metrics`;
- target `express-app` com status `UP` no Prometheus;
- consultas de métricas no Grafana;
- métrica `http_requests_total`;
- métrica `process_resident_memory_bytes`;
- `terraform validate`;
- `terraform plan`;
- `terraform apply`;
- `terraform state list`;
- inspeção da EC2;
- inspeção do Security Group;
- segundo `terraform plan` sem alterações.

---

**Projeto acadêmico desenvolvido para estudo prático de DevOps, CI/CD, Observabilidade e Infraestrutura como Código.**