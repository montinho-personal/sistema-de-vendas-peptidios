-- Alertas de recompra já tratados (contato feito ou descartados).
-- A chave inclui "ultimaCompra" para o alerta voltar no próximo ciclo
-- caso o cliente compre de novo.
CREATE TABLE IF NOT EXISTS "AlertaDispensado" (
  "id"           TEXT PRIMARY KEY,
  "cliente"      TEXT NOT NULL,
  "produto"      TEXT NOT NULL,
  "ultimaCompra" DATE NOT NULL,
  "motivo"       TEXT NOT NULL DEFAULT 'contato',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "AlertaDispensado_cliente_produto_ultimaCompra_key"
  ON "AlertaDispensado" ("cliente", "produto", "ultimaCompra");

-- Mesma proteção das demais tabelas: acesso só pelo backend.
ALTER TABLE "AlertaDispensado" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backend_only" ON "AlertaDispensado";
CREATE POLICY "backend_only" ON "AlertaDispensado"
  FOR ALL TO postgres USING (true) WITH CHECK (true);
