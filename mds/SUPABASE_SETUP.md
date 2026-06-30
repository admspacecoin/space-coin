# Guia de Configuração — Space Coin + Supabase

Este guia explica como conectar o Space Coin ao Supabase em **~15 minutos**, de forma **gratuita**.

---

## Por que Supabase?

| Recurso | Plano Gratuito |
|---------|---------------|
| Banco de dados PostgreSQL | 500 MB |
| Autenticação de usuários | Ilimitada |
| Storage (imagens) | 1 GB |
| Edge Functions | 500k chamadas/mês |
| Row Level Security | Incluído |
| Hospedagem | Supabase Cloud |

---

## Passo 1 — Criar conta e projeto

1. Acesse [supabase.com](https://supabase.com) e clique em **Start for free**
2. Entre com sua conta do GitHub (mais fácil)
3. Clique em **New project**
4. Preencha:
   - **Project name**: `space-coin`
   - **Database password**: escolha uma senha forte (guarde em local seguro)
   - **Region**: `South America (São Paulo)` — menor latência para o Brasil
5. Clique em **Create new project** e aguarde ~2 minutos

---

## Passo 2 — Executar o schema do banco

1. No painel do Supabase, clique em **SQL Editor** (ícone de código) no menu esquerdo
2. Clique em **New query**
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. Copie **todo o conteúdo** e cole no editor
5. Clique em **Run** (ícone de play) ou pressione `Ctrl+Enter`
6. Você deve ver `Success. No rows returned` — isso é correto

> **Dica**: Se aparecer erro no bloco de `storage.buckets`, execute o restante do SQL
> primeiro e depois crie os buckets manualmente (veja Passo 4).

---

## Passo 3 — Obter as credenciais

1. No painel do Supabase, clique em **Project Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Copie os dois valores:
   - **Project URL** — ex: `https://abcxyz123.supabase.co`
   - **anon / public key** — começa com `eyJh...`

> A chave `anon` é **segura para expor no frontend**. Ela é pública por design.
> A segurança real vem do Row Level Security (RLS) configurado no banco.
> Nunca exponha a **service_role key** — essa sim é secreta.

---

## Passo 4 — Configurar Storage (imagens)

Se o Passo 2 não criou os buckets automaticamente, faça manualmente:

1. No painel, clique em **Storage** (ícone de pasta)
2. Clique em **New bucket**
3. Crie o bucket **`pecas-fotos`**:
   - Name: `pecas-fotos`
   - Marque **Public bucket** ✓
   - Clique em **Save**
4. Crie o bucket **`avatars`**:
   - Name: `avatars`
   - Marque **Public bucket** ✓
   - Clique em **Save**

Agora configure as políticas de segurança para cada bucket:

### Para `pecas-fotos`:

Clique no bucket → **Policies** → **New policy** → **For full customization**

**Política 1 — Upload (INSERT)**
```
Policy name: Usuário faz upload das suas fotos
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: (storage.foldername(name))[1] = auth.uid()::text
```

**Política 2 — Leitura pública (SELECT)**
```
Policy name: Qualquer um lê fotos
Allowed operation: SELECT
Target roles: (deixe vazio para público)
USING expression: true
```

Repita as mesmas políticas para o bucket `avatars`.

---

## Passo 5 — Atualizar o arquivo de configuração

Abra o arquivo `public/js/config.js` e substitua os valores:

```javascript
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';   // <-- cole a Project URL
const SUPABASE_ANON_KEY = 'sua_chave_anon_aqui';          // <-- cole a anon key
```

**Exemplo:**
```javascript
const SUPABASE_URL = 'https://abcxyz123456.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Passo 6 — Rodar localmente

```bash
# Clone o repositório (se ainda não fez)
git clone https://github.com/SEU_USUARIO/space-coin.git
cd space-coin

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

Acesse em: **http://localhost:3000**

---

## Passo 7 — Publicar no GitHub Pages (opcional)

O app funciona como site estático — basta hospedar os arquivos da pasta `public/`.

1. Vá nas configurações do repositório no GitHub
2. Clique em **Pages** (menu lateral)
3. Em **Source**, selecione **Deploy from a branch**
4. Branch: `main` / Folder: `/public`
5. Clique em **Save**

Seu app estará disponível em: `https://SEU_USUARIO.github.io/space-coin/`

> **Atenção**: A `anon key` do Supabase ficará visível no código público.
> Isso é **seguro e esperado** — o Supabase foi projetado para isso.
> A proteção dos dados vem do Row Level Security (RLS).

---

## Passo 8 — Configurar autenticação (e-mail)

Por padrão, o Supabase exige confirmação de e-mail no cadastro.

**Para desativar durante o desenvolvimento:**
1. Vá em **Authentication** → **Providers** → **Email**
2. Desmarque **Confirm email** ✓
3. Clique em **Save**

**Para produção (recomendado manter ativo):**
- Configure um servidor SMTP customizado em **Authentication** → **SMTP Settings**
- Ou use o SMTP do Supabase (limitado a 2 e-mails/hora no plano gratuito)

---

## Estrutura do banco de dados

```
auth.users (gerenciado pelo Supabase)
    │
    ├── profiles          (nome, bio, avatar_url)
    ├── pecas             (moedas e cédulas do usuário)
    │     └── colecao_id ─┐
    └── colecoes ──────────┘ (coleções do usuário)

eventos    (agenda — visível a todos os usuários)
parceiros  (parceiros e banners — visível a todos)
```

### Row Level Security (RLS)

| Tabela | Quem pode ler | Quem pode escrever |
|--------|--------------|-------------------|
| `profiles` | Próprio usuário | Próprio usuário |
| `pecas` | Próprio usuário | Próprio usuário |
| `colecoes` | Próprio usuário | Próprio usuário |
| `eventos` | Qualquer usuário autenticado | Admins (pelo painel) |
| `parceiros` | Qualquer usuário autenticado | Admins (pelo painel) |

---

## Resolução de problemas

### "Invalid API key"
- Verifique se copiou a chave `anon` (não a `service_role`)
- Verifique se não há espaços extras na chave

### "Failed to fetch" / CORS
- Verifique se a `SUPABASE_URL` está correta
- Certifique-se de que o projeto no Supabase está ativo (projetos pausam após 1 semana sem uso no plano gratuito)

### Usuário cadastrado mas não consegue entrar
- Verifique se a confirmação de e-mail está desativada para desenvolvimento
- Ou confirme o e-mail manualmente em **Authentication** → **Users**

### Fotos não aparecem
- Verifique se os buckets `pecas-fotos` e `avatars` existem e são públicos
- Verifique as políticas de Storage (Passo 4)

### Projeto pausado (plano gratuito)
- Projetos Supabase no plano gratuito pausam após 1 semana sem acesso
- Reative em: **Project Settings** → **General** → **Restore project**

---

## Segurança — Checklist

- [x] Row Level Security ativado em todas as tabelas de usuário
- [x] Senhas gerenciadas pelo Supabase Auth (bcrypt internamente)
- [x] `anon key` usada no frontend (seguro por design)
- [x] `service_role key` nunca exposta no código
- [x] Uploads de arquivo limitados à pasta do próprio usuário
- [x] Buckets de storage com políticas por usuário
- [ ] Configurar domínio customizado (produção)
- [ ] Ativar confirmação de e-mail (produção)
- [ ] Configurar SMTP customizado (produção)

---

## Próximos passos (roadmap)

- [ ] Integração com IA para identificação de moedas por foto
- [ ] Estimativa de valor via scraping de sites numismáticos
- [ ] Exportação PDF e CSV
- [ ] Notificações de novos eventos
- [ ] Modo offline com sincronização
