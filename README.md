# 🪙 SPACE COIN

> Catálogo inteligente de moedas e cédulas para colecionadores brasileiros

<div align="center">

![Version](https://img.shields.io/badge/versão-1.0.0-verde?style=for-the-badge&color=1a7a4a)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=for-the-badge)
![License](https://img.shields.io/badge/licença-privada-red?style=for-the-badge)
![Language](https://img.shields.io/badge/idioma-Português%20BR-green?style=for-the-badge)

</div>

---

## 📋 Sobre o Projeto

O **SPACE COIN** é um aplicativo mobile completo para catalogação de moedas e cédulas, desenvolvido especialmente para o público brasileiro. Inspirado no app MakTun, o sistema permite que colecionadores — iniciantes ou avançados — organizem seu acervo de forma prática, automatizada e profissional.

O usuário fotografa a peça, a IA identifica automaticamente e preenche todas as informações numismáticas: país, ano, valor facial, material, estado de conservação, especificações técnicas, contexto histórico e estimativa de valor com base em sites brasileiros de referência.

---

## ✨ Funcionalidades

### 📸 Captura e Identificação com IA
- Fotografar anverso (frente) e reverso (verso) da peça
- Identificação automática via IA (OCR + visão computacional)
- Estimativa de valor baseada em sites numismáticos brasileiros
- Cadastro manual quando a IA não reconhece

### 🗂️ Catalogação Completa
- **Moedas:** diâmetro, peso, espessura, formato, tipo de borda, rotação, cunhagem, código Krause
- **Cédulas:** largura, altura, número de série, série/assinatura, placa, impressor, recursos de segurança, código Krause
- Campos comuns: país, ano, valor facial, material, estado de conservação, variação/edição
- Descrição histórica, contexto de emissão e curiosidades

### 📁 Sistema de Coleções
- Criar coleções personalizadas
- Organização por país, ano, tipo e valor
- Barra de progresso de completude
- Valor total estimado por coleção

### 📊 Estimativa de Valor
Baseada em scraping dos principais sites brasileiros:
- [Numismática Coan](https://numismaticacoan.com/)
- [Numismática Vieira](https://www.numismaticavieira.com.br/)
- [Moedas Contagem](https://www.moedascontagem.com.br/)
- [Caravelas Coleções](https://www.caravelascolecoes.com.br/)
- [Brasil Moedas](https://brasilmoedas.com.br/)
- [Loja do Colecionador DF](https://www.lojadocolecionadordf.com.br/)
- [Numismarket](https://www.numismarket.com.br/)
- [Rainha Numismática](https://www.rainhanumismatica.com.br/)

### 📄 Exportação e Impressão
- **CSV** — planilha com todos os itens
- **PDF resumido** — lista compacta para consulta
- **Catálogo estilo livro** — com fotos, contexto histórico e layout profissional
- **Backup JSON** — backup completo do acervo

### 📅 Parceiros e Eventos
- Agenda de feiras e encontros numismáticos no Brasil
- Carrossel de parceiros e banners patrocinados

### 👤 Perfil e Configurações
- Estatísticas do acervo (itens, valor, países, coleções)
- Edição de perfil e bio
- Modo escuro / claro
- Exclusão e exportação de conta

---

## 🖼️ Telas do Aplicativo

| Início | Catálogo | Catalogar Peça |
|--------|----------|----------------|
| Dashboard com estatísticas, recentes e ações rápidas | Lista agrupada por coleção com busca e filtros | Formulário completo com toggle Moeda/Cédula |

| Detalhe da Peça | Parceiros e Eventos | Perfil |
|-----------------|---------------------|--------|
| Fotos, especificações técnicas, notas históricas | Agenda de eventos e parceiros | Exportações, configurações e estatísticas |

---

## 🏗️ Arquitetura

```
spacecoin/
│
├── frontend/               # Aplicativo mobile (React Native / Flutter)
│   ├── src/
│   │   ├── screens/        # Telas do app
│   │   │   ├── Home/
│   │   │   ├── Catalog/
│   │   │   ├── AddItem/
│   │   │   ├── ItemDetail/
│   │   │   ├── Collections/
│   │   │   ├── Events/
│   │   │   └── Profile/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── services/       # Chamadas de API
│   │   ├── store/          # Gerenciamento de estado (Zustand / Redux)
│   │   └── utils/          # Utilitários e helpers
│   └── assets/             # Imagens, ícones, fontes
│
├── backend/                # API REST (Node.js / NestJS)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # JWT + Refresh Token
│   │   │   ├── coins/      # CRUD de moedas e cédulas
│   │   │   ├── collections/# Coleções
│   │   │   ├── ai/         # Integração com IA
│   │   │   └── valuation/  # Estimativa de valor (scraping)
│   │   ├── common/         # Guards, DTOs, interceptors
│   │   └── database/       # Migrations e seeds
│   └── prisma/             # Schema do banco (PostgreSQL)
│
├── ai-service/             # Serviço de reconhecimento (Python / FastAPI)
│   ├── vision/             # Google Vision / AWS Rekognition
│   ├── ocr/                # Extração de texto
│   └── matching/           # Matching com base de dados
│
├── docs/                   # Documentação
│   ├── spacecoin.html      # Protótipo HTML interativo completo
│   └── wireframes/
│
└── README.md
```

---

## 🛠️ Stack Tecnológica

### Frontend (Mobile)
| Tecnologia | Uso |
|------------|-----|
| React Native ou Flutter | Framework mobile (Android + iOS) |
| Zustand / Redux | Gerenciamento de estado |
| React Query | Cache e sincronização de dados |
| Expo Camera | Captura de imagens |

### Backend (API)
| Tecnologia | Uso |
|------------|-----|
| Node.js + NestJS | Framework da API REST |
| PostgreSQL | Banco de dados relacional |
| Prisma ORM | Acesso ao banco de dados |
| JWT + Refresh Token | Autenticação segura |
| AWS S3 | Armazenamento de imagens |

### Serviço de IA
| Tecnologia | Uso |
|------------|-----|
| Python + FastAPI | Serviço de reconhecimento |
| Google Vision API | OCR + classificação de imagens |
| Firecrawl | Scraping de preços em sites brasileiros |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Conta AWS (S3) ou equivalente

### 1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/space-coin.git
cd space-coin
```

### 2. Configure as variáveis de ambiente
```bash
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/spacecoin"
JWT_SECRET="sua_chave_secreta"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="spacecoin-media"
GOOGLE_VISION_KEY="..."

# frontend/.env
API_BASE_URL="http://localhost:3000"
```

### 3. Instale as dependências e rode

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# Frontend
cd frontend
npm install
npx expo start

# AI Service
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🔒 Segurança

- Senhas com **bcrypt** (salt rounds: 12)
- Autenticação via **JWT + Refresh Token** com rotação
- **Rate limiting** em todos os endpoints
- Validação de dados com **DTOs** (class-validator)
- Proteção contra **upload malicioso** (tipo, tamanho, extensão)
- **Row-Level Security (RLS)** no PostgreSQL
- Endpoints sensíveis protegidos por **guards**

---

## 📱 Estados de Conservação Suportados

| Sigla | Nome Completo |
|-------|---------------|
| FC | Flor de Cunho |
| S | Soberba |
| MBC | Muito Bem Conservada |
| BC | Bem Conservada |
| R | Regular |
| FE | Flor de Estampa (cédulas) |

---

## 🗺️ Roadmap

- [x] Protótipo HTML interativo completo
- [x] Design das 7 telas principais
- [ ] Setup do projeto (monorepo)
- [ ] Autenticação (Google, Apple, Magic Link)
- [ ] CRUD de moedas e cédulas
- [ ] Upload de imagens para S3
- [ ] Integração com IA para reconhecimento
- [ ] Estimativa de valor (scraping)
- [ ] Sistema de coleções
- [ ] Exportação PDF e JSON
- [ ] Modo offline (sincronização posterior)
- [ ] Publicação na App Store e Google Play

---

## 👤 Autor

**Caio Rerisson**
- GitHub: [@SEU_USUARIO](https://github.com/SEU_USUARIO)
- E-mail: rerisson80@gmail.com

---

## 📄 Licença

Este projeto é **privado e proprietário**. Todos os direitos reservados © 2026 Caio Rerisson.
Não é permitida a cópia, distribuição ou uso sem autorização expressa do autor.
