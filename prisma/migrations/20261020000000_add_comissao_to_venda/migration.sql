-- Comissão paga na venda. Entra no lucro líquido junto com a taxa.
-- Vendas já existentes recebem 0, então o lucro líquido delas não muda.
ALTER TABLE "Venda"
ADD COLUMN IF NOT EXISTS "comissao" DECIMAL(12,2) NOT NULL DEFAULT 0;
