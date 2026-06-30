-- ═══════════════════════════════════════════════════════════════
-- SPACE COIN — Schema do Banco de Dados Supabase
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ═══════════════════════════════════════════════════════════════

-- ── PERFIS DE USUÁRIO ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT,
  bio        TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seu próprio perfil"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuário cria seu próprio perfil"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário edita seu próprio perfil"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Cria perfil automaticamente ao cadastrar novo usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── COLEÇÕES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colecoes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome       TEXT NOT NULL,
  descricao  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE colecoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia suas coleções"
  ON colecoes FOR ALL USING (auth.uid() = user_id);


-- ── PEÇAS (MOEDAS E CÉDULAS) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pecas (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  colecao_id UUID REFERENCES colecoes(id) ON DELETE SET NULL,

  -- Campos comuns
  tipo          TEXT NOT NULL CHECK (tipo IN ('moeda', 'cedula')),
  pais          TEXT NOT NULL,
  ano           INTEGER,
  valor_facial  NUMERIC,
  moeda_codigo  TEXT,
  material      TEXT,
  conservacao   TEXT,
  variacao      TEXT,
  descricao     TEXT,

  -- Especificações de moeda
  diametro        NUMERIC,
  peso            NUMERIC,
  espessura       NUMERIC,
  formato         TEXT,
  borda           TEXT,
  rotacao         TEXT,
  cunhagem        BIGINT,
  codigo_krause   TEXT,
  inicio_emissao  INTEGER,
  fim_emissao     INTEGER,

  -- Especificações de cédula
  largura             NUMERIC,
  altura              NUMERIC,
  numero_serie        TEXT,
  serie_assinatura    TEXT,
  placa               TEXT,
  impressor           TEXT,
  recursos_seguranca  TEXT,

  -- Fotos e valor
  foto_frente_url TEXT,
  foto_verso_url  TEXT,
  valor_estimado  NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE pecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia suas peças"
  ON pecas FOR ALL USING (auth.uid() = user_id);


-- ── EVENTOS NUMISMÁTICOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  data_evento DATE NOT NULL,
  local       TEXT,
  cidade      TEXT,
  estado      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer usuário autenticado lê eventos"
  ON eventos FOR SELECT TO authenticated USING (true);


-- ── PARCEIROS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parceiros (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome       TEXT NOT NULL,
  logo_url   TEXT,
  url        TEXT,
  tipo       TEXT CHECK (tipo IN ('parceiro', 'banner')),
  ativo      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer usuário autenticado lê parceiros"
  ON parceiros FOR SELECT TO authenticated USING (true);


-- ── DADOS DE EXEMPLO (EVENTOS) ───────────────────────────────────
INSERT INTO eventos (nome, descricao, data_evento, local, cidade, estado) VALUES
  ('Feira Numismática do Rio',          'Exposição e troca de moedas raras.',                              '2026-07-12', 'Hotel Glória',                        'Rio de Janeiro', 'RJ'),
  ('Encontro Nacional de Numismática',  'Maior encontro brasileiro de colecionadores.',                    '2026-08-15', 'Centro de Convenções',                'São Paulo',      'SP'),
  ('Feira Numismática de Salvador',     'Tradicional feira de moedas e cédulas brasileiras e estrangeiras.','2026-09-12', 'Centro de Convenções da Bahia',       'Salvador',       'BA'),
  ('Encontro de Numismática de Curitiba','Encontro de colecionadores do sul do país.',                     '2026-10-03', 'Expo Barigui',                        'Curitiba',       'PR'),
  ('Feira de Numismática de Fortaleza', 'Exposição e troca entre numismatas do Nordeste.',                 '2026-11-07', 'Centro de Eventos do Ceará',          'Fortaleza',      'CE'),
  ('Convenção Numismática de Recife',   'Convenção tradicional com palestras.',                            '2026-12-05', 'Centro de Convenções de Pernambuco',  'Recife',         'PE'),
  ('Encontro Numismático de Manaus',    'Primeiro encontro do Norte com foco em moedas comemorativas.',    '2027-01-23', 'Studio 5 Centro de Convenções',       'Manaus',         'AM')
ON CONFLICT DO NOTHING;


-- ── STORAGE: BUCKETS ─────────────────────────────────────────────
-- Execute estes comandos separadamente no painel Storage do Supabase,
-- ou use o SQL abaixo se a extensão storage estiver disponível.
--
-- Bucket para fotos de peças (público para leitura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pecas-fotos', 'pecas-fotos', true)
ON CONFLICT DO NOTHING;

-- Bucket para avatares (público para leitura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Políticas de Storage para fotos de peças
CREATE POLICY "Usuário faz upload das suas fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pecas-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Usuário atualiza suas fotos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pecas-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Qualquer um lê fotos de peças"
  ON storage.objects FOR SELECT USING (bucket_id = 'pecas-fotos');

-- Políticas de Storage para avatares
CREATE POLICY "Usuário faz upload do seu avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Usuário atualiza seu avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Qualquer um lê avatares"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
