-- Estoque com consignado. O saldo de cada lote é derivado (recebido menos
-- movimentações), nunca guardado, para não divergir do histórico.

-- Só vendas registradas a partir daqui dão baixa; as antigas ficam false.
ALTER TABLE "Venda" ADD COLUMN IF NOT EXISTS "baixaEstoque" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "LoteEstoque" (
  "id" TEXT PRIMARY KEY,
  "produto" TEXT NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'consignado',
  "fornecedor" TEXT NOT NULL DEFAULT '',
  "dataRecebimento" DATE NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "custoUnitario" DECIMAL(12,2) NOT NULL,
  "observacao" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "MovimentoEstoque" (
  "id" TEXT PRIMARY KEY,
  "loteId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "vendaId" TEXT,
  "data" DATE NOT NULL,
  "observacao" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "MovimentoEstoque_loteId_idx" ON "MovimentoEstoque" ("loteId");
CREATE INDEX IF NOT EXISTS "MovimentoEstoque_vendaId_idx" ON "MovimentoEstoque" ("vendaId");

CREATE TABLE IF NOT EXISTS "PagamentoFornecedor" (
  "id" TEXT PRIMARY KEY,
  "fornecedor" TEXT NOT NULL,
  "data" DATE NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "observacao" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "LoteEstoque" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimentoEstoque" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PagamentoFornecedor" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend_only" ON "LoteEstoque";
DROP POLICY IF EXISTS "backend_only" ON "MovimentoEstoque";
DROP POLICY IF EXISTS "backend_only" ON "PagamentoFornecedor";
CREATE POLICY "backend_only" ON "LoteEstoque" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_only" ON "MovimentoEstoque" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "backend_only" ON "PagamentoFornecedor" FOR ALL TO postgres USING (true) WITH CHECK (true);
