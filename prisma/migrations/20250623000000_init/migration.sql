CREATE TABLE "Venda" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "mes" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cliente" TEXT NOT NULL,
    "produto" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoCusto" DECIMAL(12,2) NOT NULL,
    "precoVenda" DECIMAL(12,2) NOT NULL,
    "lucroBruto" DECIMAL(12,2) NOT NULL,
    "diasDuracao" INTEGER NOT NULL,
    "proximaCompra" DATE NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "taxa" DECIMAL(12,2) NOT NULL,
    "lucroLiquido" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendaPerdida" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "cliente" TEXT NOT NULL,
    "produto" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendaPerdida_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CadastroCliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "cidade" TEXT NOT NULL DEFAULT '',
    "aniversario" DATE,
    "indicadoPor" TEXT NOT NULL DEFAULT '',
    "observacoes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CadastroCliente_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CadastroCliente_nome_key" ON "CadastroCliente"("nome");

CREATE TABLE "CadastroProduto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT '',
    "custoPadrao" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vendaPadrao" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "duracaoPadrao" INTEGER NOT NULL DEFAULT 90,
    "descricao" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CadastroProduto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CadastroProduto_nome_key" ON "CadastroProduto"("nome");

CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "valorMeta" DECIMAL(12,2) NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);
