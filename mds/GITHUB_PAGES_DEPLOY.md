# Deploy no GitHub Pages — Space Coin

Guia completo para publicar o Space Coin gratuitamente no GitHub Pages usando **GitHub Actions** para injetar as credenciais do Supabase com segurança — sem expor nada no código do repositório.

---

## Como funciona

```
Você faz git push
       │
       ▼
GitHub Actions executa o workflow .github/workflows/deploy.yml
       │
       ├─ Lê SUPABASE_URL e SUPABASE_ANON_KEY dos Secrets do repositório
       ├─ Injeta os valores no public/js/config.js (somente na cópia do deploy)
       └─ Publica a pasta public/ no GitHub Pages
```

O `config.js` no seu repositório **permanece com os placeholders** — as credenciais reais ficam apenas nos Secrets do GitHub e na versão publicada.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com)
- Supabase configurado (veja `SUPABASE_SETUP.md`)
- Git instalado na sua máquina

---

## Passo 1 — Criar o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Preencha:
   - **Repository name**: `space-coin`
   - **Description**: `Catálogo de moedas e cédulas`
   - **Visibility**: `Public` *(obrigatório para GitHub Pages gratuito)*
3. **Não** marque nenhuma opção de inicialização (README, .gitignore, license)
4. Clique em **Create repository**

---

## Passo 2 — Adicionar os Secrets do Supabase

Os secrets são armazenados de forma criptografada pelo GitHub e nunca ficam visíveis no código.

1. No repositório recém-criado, clique em **Settings** (aba no topo)
2. No menu lateral, clique em **Secrets and variables** → **Actions**
3. Clique em **New repository secret** e adicione os dois secrets abaixo:

### Secret 1 — URL do projeto

| Campo | Valor |
|-------|-------|
| **Name** | `SUPABASE_URL` |
| **Secret** | `https://abcxyz123456.supabase.co` *(sua URL real)* |

Clique em **Add secret**.

### Secret 2 — Chave anon

| Campo | Valor |
|-------|-------|
| **Name** | `SUPABASE_ANON_KEY` |
| **Secret** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` *(sua chave real)* |

Clique em **Add secret**.

> **Onde encontrar esses valores?**
> Painel do Supabase → **Project Settings** → **API** → seção "Project URL" e "anon / public".
> Veja também o Passo 3 do `SUPABASE_SETUP.md`.

Ao final, a tela de secrets deve estar assim:

```
Repository secrets
┌─────────────────────┬──────────────────┐
│ SUPABASE_ANON_KEY   │ Updated just now │
│ SUPABASE_URL        │ Updated just now │
└─────────────────────┴──────────────────┘
```

---

## Passo 3 — Ativar o GitHub Pages com GitHub Actions

1. Ainda em **Settings**, clique em **Pages** no menu lateral
2. Em **Source**, selecione **GitHub Actions** *(não "Deploy from a branch")*
3. Não precisa salvar — a opção é aplicada imediatamente

> Isso instrui o GitHub a aguardar o workflow publicar os arquivos,
> em vez de pegar os arquivos diretamente do branch.

---

## Passo 4 — Subir o código para o GitHub

Abra o terminal na pasta do projeto:

```bash
# Confirma que está na pasta certa
cd /caminho/para/space-coin

# Conecta ao repositório remoto (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/space-coin.git

# Adiciona todos os arquivos
git add .

# Cria o primeiro commit
git commit -m "Initial commit — Space Coin app"

# Sobe para o GitHub
git push -u origin main
```

Assim que o `git push` terminar, o GitHub Actions dispara automaticamente.

---

## Passo 5 — Acompanhar o deploy

1. No repositório, clique na aba **Actions**
2. Você verá o workflow **"Deploy Space Coin → GitHub Pages"** rodando
3. Clique nele para ver os logs em tempo real
4. Quando aparecer o ícone ✅ verde, o deploy foi concluído

O endereço do seu app aparecerá em:
```
Settings → Pages → "Your site is live at https://SEU_USUARIO.github.io/space-coin/"
```

---

## Passo 6 — Configurar o Supabase para aceitar o domínio

Para que o login funcione no domínio publicado:

1. No painel do Supabase, vá em **Authentication** → **URL Configuration**
2. Em **Site URL**, coloque:
   ```
   https://SEU_USUARIO.github.io
   ```
3. Em **Redirect URLs**, adicione:
   ```
   https://SEU_USUARIO.github.io/space-coin/app.html
   https://SEU_USUARIO.github.io/space-coin/index.html
   ```
4. Clique em **Save**

---

## Passo 7 — Verificar o deploy

1. Acesse `https://SEU_USUARIO.github.io/space-coin/`
2. A tela de login do Space Coin deve aparecer
3. Cadastre uma conta e teste o fluxo completo

---

## Como publicar atualizações

Toda vez que fizer mudanças no código:

```bash
git add .
git commit -m "Descrição do que mudou"
git push
```

O GitHub Actions repete o processo automaticamente. O deploy leva ~1 minuto.

---

## Estrutura de URLs do site publicado

| URL | O que é |
|-----|---------|
| `/space-coin/` | Redireciona para `index.html` |
| `/space-coin/index.html` | Login / Cadastro |
| `/space-coin/app.html` | App principal (requer login) |

---

## Segurança — o que fica onde

| Item | Onde fica | Visível? |
|------|-----------|----------|
| `SUPABASE_URL` | GitHub Secrets | Não (criptografado) |
| `SUPABASE_ANON_KEY` | GitHub Secrets | Não (criptografado) |
| `config.js` no repositório | Git / GitHub | Sim, mas com placeholders |
| `config.js` publicado | GitHub Pages | Sim, com credenciais reais |

> A `anon key` publicada no JavaScript do site é **normal e seguro** por design do Supabase.
> Qualquer pessoa que inspecionar o código do site poderá vê-la — isso é esperado.
> A proteção real dos dados vem do **Row Level Security (RLS)** no banco,
> não do sigilo da chave.
>
> O que **nunca** deve ir para o repositório ou para secrets públicos:
> a `service_role key` do Supabase (essa sim é secreta e não é usada aqui).

---

## Solução de problemas

### O workflow falhou na aba Actions

Clique no workflow com ❌ vermelho, expanda o step com erro e leia o log.

Causas comuns:
- **Secret não configurado** — verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` existem em Settings → Secrets → Actions
- **Secret com espaço extra** — ao colar o valor, certifique-se de não incluir espaços no início/fim
- **Permissão negada no Pages** — verifique se em Settings → Pages a source está em "GitHub Actions"

### Página em branco ou erro 404

- Confirme que o workflow completou com ✅
- Verifique se em Settings → Pages aparece a URL do site
- Aguarde até 5 minutos no primeiro deploy

### "Failed to fetch" ao tentar entrar

- Confirme que os secrets têm os valores corretos (você pode deletar e recriar)
- Verifique se o domínio está na lista de Redirect URLs do Supabase (Passo 6)
- Certifique-se que o projeto no Supabase está ativo (não pausado)

### Login funciona mas redireciona para página errada

- Revise as URLs em Authentication → URL Configuration no Supabase
- Certifique-se de incluir o caminho completo até `app.html`

---

## Domínio personalizado (opcional)

Se quiser usar um domínio próprio como `spacecoin.com.br`:

1. Compre o domínio em um registrador (Registro.br, Hostinger, etc.)
2. No DNS do registrador, adicione um registro:
   - **Tipo**: `CNAME`
   - **Nome**: `www`
   - **Valor**: `SEU_USUARIO.github.io`
3. No repositório: Settings → Pages → **Custom domain** → adicione seu domínio
4. Marque **Enforce HTTPS** ✓
5. Atualize o **Site URL** e os **Redirect URLs** no Supabase para o novo domínio
6. Atualize os secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY` se necessário (não mudam, mas é bom confirmar)
