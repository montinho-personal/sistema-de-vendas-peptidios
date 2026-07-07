-- Ativa Row-Level Security em todas as tabelas
ALTER TABLE "Venda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VendaPerdida" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CadastroCliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CadastroProduto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Meta" ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas o role postgres (service_role / backend) tem acesso total
-- Bloqueia completamente o acesso anônimo (via API pública do Supabase)

CREATE POLICY "backend_only" ON "Venda"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

CREATE POLICY "backend_only" ON "VendaPerdida"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

CREATE POLICY "backend_only" ON "CadastroCliente"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

CREATE POLICY "backend_only" ON "CadastroProduto"
  FOR ALL TO postgres USING (true) WITH CHECK (true);

CREATE POLICY "backend_only" ON "Meta"
  FOR ALL TO postgres USING (true) WITH CHECK (true);
