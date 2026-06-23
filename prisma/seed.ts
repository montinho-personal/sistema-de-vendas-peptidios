import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const sales = [
  { data: '2025-11-14', mes: 'novembro', ano: 2025, cliente: 'Jessica de Oliveira', produto: 'Retatrutida 30mg', quantidade: 1, precoCusto: 1000, precoVenda: 1700, lucroBruto: 700, diasDuracao: 90, proximaCompra: '2026-02-12', formaPagamento: 'Pix', taxa: 85, lucroLiquido: 615 },
  { data: '2025-11-18', mes: 'novembro', ano: 2025, cliente: 'Paulo Henrique Freitas', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2500, lucroBruto: 1000, diasDuracao: 90, proximaCompra: '2026-02-16', formaPagamento: 'Cartão de Crédito', taxa: 124.5, lucroLiquido: 875.5 },
  { data: '2025-11-28', mes: 'novembro', ano: 2025, cliente: 'Suellen Lima', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 120, proximaCompra: '2026-03-28', formaPagamento: 'Cartão de Crédito', taxa: 98, lucroLiquido: 1602 },
  { data: '2025-11-19', mes: 'novembro', ano: 2025, cliente: 'Adriana Nascimento', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 1000, lucroBruto: 0, diasDuracao: 60, proximaCompra: '2026-01-18', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 0 },
  { data: '2025-12-02', mes: 'dezembro', ano: 2025, cliente: 'Flávio Alvarenga', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2500, lucroBruto: 1000, diasDuracao: 120, proximaCompra: '2026-04-01', formaPagamento: 'Pix', taxa: 125, lucroLiquido: 875 },
  { data: '2025-12-10', mes: 'dezembro', ano: 2025, cliente: 'Paula Fogli', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 60, proximaCompra: '2026-02-08', formaPagamento: 'Cartão de Crédito', taxa: 135, lucroLiquido: 1565 },
  { data: '2025-12-12', mes: 'dezembro', ano: 2025, cliente: 'Saionara', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 60, proximaCompra: '2026-02-10', formaPagamento: 'Pix', taxa: 135, lucroLiquido: 1565 },
  { data: '2025-12-15', mes: 'dezembro', ano: 2025, cliente: 'Danilo Pates', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 60, proximaCompra: '2026-02-13', formaPagamento: 'Pix', taxa: 135, lucroLiquido: 1565 },
  { data: '2025-12-17', mes: 'dezembro', ano: 2025, cliente: 'Zezé', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 1000, lucroBruto: 0, diasDuracao: 120, proximaCompra: '2026-04-16', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 0 },
  { data: '2025-12-19', mes: 'dezembro', ano: 2025, cliente: 'Leonardo Veiga', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2500, lucroBruto: 1000, diasDuracao: 120, proximaCompra: '2026-04-18', formaPagamento: 'Pix', taxa: 125, lucroLiquido: 875 },
  { data: '2026-01-06', mes: 'Janeiro', ano: 2026, cliente: 'Ricardo Fadul', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2500, lucroBruto: 1000, diasDuracao: 60, proximaCompra: '2026-03-07', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1000 },
  { data: '2026-01-06', mes: 'Janeiro', ano: 2026, cliente: 'Gabriel Oliveira', produto: 'Retatrutida 30mg', quantidade: 1, precoCusto: 900, precoVenda: 1700, lucroBruto: 800, diasDuracao: 90, proximaCompra: '2026-04-06', formaPagamento: 'Cartão de Crédito', taxa: 80, lucroLiquido: 720 },
  { data: '2026-01-07', mes: 'Janeiro', ano: 2026, cliente: 'Fiorangela', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 90, proximaCompra: '2026-04-07', formaPagamento: 'Pix', taxa: 135, lucroLiquido: 1565 },
  { data: '2026-01-09', mes: 'Janeiro', ano: 2026, cliente: 'Amélia', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 90, proximaCompra: '2026-04-09', formaPagamento: 'Pix', taxa: 135, lucroLiquido: 1565 },
  { data: '2026-01-09', mes: 'Janeiro', ano: 2026, cliente: 'Roberta Walter', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2500, lucroBruto: 1000, diasDuracao: 90, proximaCompra: '2026-04-09', formaPagamento: 'Pix', taxa: 125, lucroLiquido: 875 },
  { data: '2026-01-09', mes: 'Janeiro', ano: 2026, cliente: 'Roberta Walter', produto: 'Tesamorelin 15mg', quantidade: 1, precoCusto: 1090, precoVenda: 1500, lucroBruto: 410, diasDuracao: 90, proximaCompra: '2026-04-09', formaPagamento: 'Pix', taxa: 75, lucroLiquido: 335 },
  { data: '2026-01-09', mes: 'Janeiro', ano: 2026, cliente: 'Roberta Walter', produto: 'Slup332 5mg', quantidade: 1, precoCusto: 790, precoVenda: 1100, lucroBruto: 310, diasDuracao: 90, proximaCompra: '2026-04-09', formaPagamento: 'Pix', taxa: 55, lucroLiquido: 255 },
  { data: '2026-01-09', mes: 'Janeiro', ano: 2026, cliente: 'Roberta Walter', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 590, precoVenda: 830, lucroBruto: 240, diasDuracao: 50, proximaCompra: '2026-02-28', formaPagamento: 'Pix', taxa: 41.5, lucroLiquido: 198.5 },
  { data: '2026-01-09', mes: 'Janeiro', ano: 2026, cliente: 'Roberta Walter', produto: 'BPC 157 10mg', quantidade: 1, precoCusto: 490, precoVenda: 690, lucroBruto: 200, diasDuracao: 90, proximaCompra: '2026-04-09', formaPagamento: 'Pix', taxa: 34.5, lucroLiquido: 165.5 },
  { data: '2026-01-09', mes: 'Janeiro', ano: 2026, cliente: 'Rory', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 90, proximaCompra: '2026-04-09', formaPagamento: 'Pix', taxa: 135, lucroLiquido: 1565 },
  { data: '2026-01-10', mes: 'Janeiro', ano: 2026, cliente: 'Emílio Priore', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 90, proximaCompra: '2026-04-10', formaPagamento: 'Pix', taxa: 135, lucroLiquido: 1565 },
  { data: '2026-01-15', mes: 'Janeiro', ano: 2026, cliente: 'Felipe Vargas', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 900, precoVenda: 1700, lucroBruto: 800, diasDuracao: 90, proximaCompra: '2026-04-15', formaPagamento: 'Pix', taxa: 59, lucroLiquido: 741 },
  { data: '2026-01-16', mes: 'Janeiro', ano: 2026, cliente: 'Guilherme Ladeira', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2500, lucroBruto: 1000, diasDuracao: 90, proximaCompra: '2026-04-16', formaPagamento: 'Pix', taxa: 400, lucroLiquido: 600 },
  { data: '2026-01-22', mes: 'Janeiro', ano: 2026, cliente: 'Sueli Goltz', produto: 'BPC 157 10mg', quantidade: 1, precoCusto: 490, precoVenda: 690, lucroBruto: 200, diasDuracao: 90, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 200 },
  { data: '2026-01-22', mes: 'Janeiro', ano: 2026, cliente: 'Sueli Goltz', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 450, precoVenda: 830, lucroBruto: 380, diasDuracao: 90, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 380 },
  { data: '2026-01-22', mes: 'Janeiro', ano: 2026, cliente: 'Roberta Walter', produto: 'AOD1604 5mg', quantidade: 1, precoCusto: 690, precoVenda: 979, lucroBruto: 289, diasDuracao: 90, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 289 },
  { data: '2026-01-22', mes: 'Janeiro', ano: 2026, cliente: 'Roberta Walter', produto: 'PT141 10mg', quantidade: 1, precoCusto: 290, precoVenda: 450, lucroBruto: 160, diasDuracao: 90, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 160 },
  { data: '2026-01-26', mes: 'Janeiro', ano: 2026, cliente: 'Matilde Rodrigues', produto: 'BPC 157 10mg', quantidade: 1, precoCusto: 450, precoVenda: 690, lucroBruto: 240, diasDuracao: 90, proximaCompra: '2026-04-26', formaPagamento: 'Pix', taxa: 34.5, lucroLiquido: 205.5 },
  { data: '2026-01-26', mes: 'Janeiro', ano: 2026, cliente: 'Matilde Rodrigues', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 590, precoVenda: 830, lucroBruto: 240, diasDuracao: 50, proximaCompra: '2026-03-17', formaPagamento: 'Pix', taxa: 41.5, lucroLiquido: 198.5 },
  { data: '2026-01-29', mes: 'Janeiro', ano: 2026, cliente: 'Caroline Villela', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2500, lucroBruto: 1500, diasDuracao: 120, proximaCompra: '2026-05-29', formaPagamento: 'Pix', taxa: 100, lucroLiquido: 1400 },
  { data: '2026-02-04', mes: 'fevereiro', ano: 2026, cliente: 'Roberta Walter', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2700, lucroBruto: 1200, diasDuracao: 120, proximaCompra: '2026-06-04', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1200 },
  { data: '2026-02-10', mes: 'fevereiro', ano: 2026, cliente: 'Roberta Walter', produto: 'TB500 10mg', quantidade: 1, precoCusto: 640, precoVenda: 899, lucroBruto: 259, diasDuracao: 30, proximaCompra: '2026-03-12', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 259 },
  { data: '2026-02-10', mes: 'fevereiro', ano: 2026, cliente: 'Roberta Walter', produto: 'BPC 157 10mg', quantidade: 1, precoCusto: 490, precoVenda: 690, lucroBruto: 200, diasDuracao: 30, proximaCompra: '2026-03-12', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 200 },
  { data: '2026-02-10', mes: 'fevereiro', ano: 2026, cliente: 'Sueli Goltz', produto: 'BPC 157 10mg', quantidade: 1, precoCusto: 490, precoVenda: 690, lucroBruto: 200, diasDuracao: 30, proximaCompra: '2026-03-12', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 200 },
  { data: '2026-02-10', mes: 'fevereiro', ano: 2026, cliente: 'Sueli Goltz', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 450, precoVenda: 830, lucroBruto: 380, diasDuracao: 50, proximaCompra: '2026-04-01', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 380 },
  { data: '2026-02-11', mes: 'fevereiro', ano: 2026, cliente: 'Danilo Pardi', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2700, lucroBruto: 1200, diasDuracao: 90, proximaCompra: '2026-05-12', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1200 },
  { data: '2026-02-11', mes: 'fevereiro', ano: 2026, cliente: 'Élisson', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2700, lucroBruto: 1200, diasDuracao: 90, proximaCompra: '2026-05-12', formaPagamento: 'Dinheiro', taxa: 135, lucroLiquido: 1065 },
  { data: '2026-02-11', mes: 'fevereiro', ano: 2026, cliente: 'Élisson', produto: 'BPC 157 10mg', quantidade: 1, precoCusto: 490, precoVenda: 690, lucroBruto: 200, diasDuracao: 30, proximaCompra: '2026-03-13', formaPagamento: 'Dinheiro', taxa: 34.5, lucroLiquido: 165.5 },
  { data: '2026-02-11', mes: 'fevereiro', ano: 2026, cliente: 'Élisson', produto: 'TB500 10mg', quantidade: 1, precoCusto: 640, precoVenda: 899, lucroBruto: 259, diasDuracao: 30, proximaCompra: '2026-03-13', formaPagamento: 'Dinheiro', taxa: 45, lucroLiquido: 214 },
  { data: '2026-02-11', mes: 'fevereiro', ano: 2026, cliente: 'Rosângela Magalhães', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 450, precoVenda: 830, lucroBruto: 380, diasDuracao: 50, proximaCompra: '2026-04-02', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 380 },
  { data: '2026-02-13', mes: 'fevereiro', ano: 2026, cliente: 'Michelle', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2500, lucroBruto: 1500, diasDuracao: 120, proximaCompra: '2026-06-13', formaPagamento: 'Cartão de Crédito', taxa: 125, lucroLiquido: 1375 },
  { data: '2026-02-14', mes: 'fevereiro', ano: 2026, cliente: 'Claudio Vianna', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2700, lucroBruto: 1200, diasDuracao: 120, proximaCompra: '2026-06-14', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1200 },
  { data: '2026-02-19', mes: 'fevereiro', ano: 2026, cliente: 'Rosângela Magalhães', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1500, precoVenda: 2700, lucroBruto: 1200, diasDuracao: 90, proximaCompra: '2026-05-20', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1200 },
  { data: '2026-02-23', mes: 'fevereiro', ano: 2026, cliente: 'Paula Fogli', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2700, lucroBruto: 1700, diasDuracao: 70, proximaCompra: '2026-05-04', formaPagamento: 'Cartão de Crédito', taxa: 125, lucroLiquido: 1575 },
  { data: '2026-02-23', mes: 'fevereiro', ano: 2026, cliente: 'David', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-14', formaPagamento: 'Pix', taxa: 103.5, lucroLiquido: 204 },
  { data: '2026-02-23', mes: 'fevereiro', ano: 2026, cliente: 'David', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-14', formaPagamento: 'Pix', taxa: 103.5, lucroLiquido: 204 },
  { data: '2026-02-24', mes: 'fevereiro', ano: 2026, cliente: 'Ricardo Fadul', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2000, lucroBruto: 1000, diasDuracao: 60, proximaCompra: '2026-04-25', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1000 },
  { data: '2026-02-24', mes: 'fevereiro', ano: 2026, cliente: 'Ricardo Fadul', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2000, lucroBruto: 1000, diasDuracao: 60, proximaCompra: '2026-04-25', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1000 },
  { data: '2026-02-24', mes: 'fevereiro', ano: 2026, cliente: 'Ricardo Fadul', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1000, precoVenda: 2000, lucroBruto: 1000, diasDuracao: 60, proximaCompra: '2026-04-25', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1000 },
  { data: '2026-02-27', mes: 'fevereiro', ano: 2026, cliente: 'Nelson', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1275, precoVenda: 2700, lucroBruto: 1425, diasDuracao: 90, proximaCompra: '2026-05-28', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1425 },
  { data: '2026-03-03', mes: 'março', ano: 2026, cliente: 'Simone Cristina', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-03', mes: 'março', ano: 2026, cliente: 'Raphael Antonini', produto: 'GHK cu 50mg', quantidade: 2, precoCusto: 765, precoVenda: 1380, lucroBruto: 615, diasDuracao: 50, proximaCompra: '2026-04-22', formaPagamento: 'Cartão de Crédito', taxa: 69, lucroLiquido: 546 },
  { data: '2026-03-03', mes: 'março', ano: 2026, cliente: 'Katia Casagrande', produto: 'Retatrutida 30mg', quantidade: 1, precoCusto: 680, precoVenda: 1700, lucroBruto: 1020, diasDuracao: 90, proximaCompra: '2026-06-01', formaPagamento: 'Cartão de Crédito', taxa: 50, lucroLiquido: 970 },
  { data: '2026-03-03', mes: 'março', ano: 2026, cliente: 'Roberta Walter', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-03', mes: 'março', ano: 2026, cliente: 'Roberta Walter', produto: 'AOD1604 5mg', quantidade: 1, precoCusto: 586.5, precoVenda: 979, lucroBruto: 392.5, diasDuracao: 50, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 392.5 },
  { data: '2026-03-03', mes: 'março', ano: 2026, cliente: 'Sueli Goltz', produto: 'BPC 157 10mg', quantidade: 1, precoCusto: 416.5, precoVenda: 690, lucroBruto: 273.5, diasDuracao: 50, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 273.5 },
  { data: '2026-03-03', mes: 'março', ano: 2026, cliente: 'Sueli Goltz', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-04', mes: 'março', ano: 2026, cliente: 'Claudia Gonçalves', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-23', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-04', mes: 'março', ano: 2026, cliente: 'Flávio Alvarenga', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-23', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-05', mes: 'março', ano: 2026, cliente: 'Natália Nascimento', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-04-24', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-11', mes: 'março', ano: 2026, cliente: 'Roberta Walter', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1275, precoVenda: 2700, lucroBruto: 1425, diasDuracao: 60, proximaCompra: '2026-05-10', formaPagamento: 'Cartão de Crédito', taxa: 112.05, lucroLiquido: 1312.95 },
  { data: '2026-03-11', mes: 'março', ano: 2026, cliente: 'Roberta Walter', produto: 'Klow 80mg', quantidade: 1, precoCusto: 1096.5, precoVenda: 1800, lucroBruto: 703.5, diasDuracao: 50, proximaCompra: '2026-04-30', formaPagamento: 'Cartão de Crédito', taxa: 112.05, lucroLiquido: 591.45 },
  { data: '2026-03-11', mes: 'março', ano: 2026, cliente: 'Sueli Goltz', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1275, precoVenda: 2700, lucroBruto: 1425, diasDuracao: 90, proximaCompra: '2026-06-09', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1425 },
  { data: '2026-03-11', mes: 'março', ano: 2026, cliente: 'Julio Mariano', produto: 'AOD1604 5mg', quantidade: 1, precoCusto: 586.5, precoVenda: 979, lucroBruto: 392.5, diasDuracao: 30, proximaCompra: '2026-04-10', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 392.5 },
  { data: '2026-03-17', mes: 'março', ano: 2026, cliente: 'Fiorangela', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 850, precoVenda: 2500, lucroBruto: 1650, diasDuracao: 90, proximaCompra: '2026-06-15', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1650 },
  { data: '2026-03-18', mes: 'março', ano: 2026, cliente: 'Mara Bella', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 50, proximaCompra: '2026-05-07', formaPagamento: 'Cartão de Crédito', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-18', mes: 'março', ano: 2026, cliente: 'Julio Mariano', produto: 'Tesamorelin 15mg', quantidade: 1, precoCusto: 926.5, precoVenda: 1500, lucroBruto: 573.5, diasDuracao: 30, proximaCompra: '2026-04-17', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 573.5 },
  { data: '2026-03-18', mes: 'março', ano: 2026, cliente: 'Julio Mariano', produto: 'PT141 10mg', quantidade: 1, precoCusto: 246.5, precoVenda: 410, lucroBruto: 163.5, diasDuracao: 30, proximaCompra: '2026-04-17', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 163.5 },
  { data: '2026-03-18', mes: 'março', ano: 2026, cliente: 'Élisson', produto: 'PT141 10mg', quantidade: 2, precoCusto: 246.5, precoVenda: 410, lucroBruto: 163.5, diasDuracao: 30, proximaCompra: '2026-04-17', formaPagamento: 'Dinheiro', taxa: 0, lucroLiquido: 163.5 },
  { data: '2026-03-18', mes: 'março', ano: 2026, cliente: 'Élisson', produto: 'AOD1604 5mg', quantidade: 1, precoCusto: 586.5, precoVenda: 979, lucroBruto: 392.5, diasDuracao: 30, proximaCompra: '2026-04-17', formaPagamento: 'Dinheiro', taxa: 0, lucroLiquido: 392.5 },
  { data: '2026-03-21', mes: 'março', ano: 2026, cliente: 'Roberta Walter', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 382.5, precoVenda: 690, lucroBruto: 307.5, diasDuracao: 30, proximaCompra: '2026-04-20', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 307.5 },
  { data: '2026-03-21', mes: 'março', ano: 2026, cliente: 'Roberta Walter', produto: 'SS31 FDA 10mg', quantidade: 1, precoCusto: 501.5, precoVenda: 839, lucroBruto: 337.5, diasDuracao: 30, proximaCompra: '2026-04-20', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 337.5 },
  { data: '2026-03-23', mes: 'março', ano: 2026, cliente: 'Julio Mariano', produto: 'CJC + IPA 10mg', quantidade: 1, precoCusto: 629, precoVenda: 1040, lucroBruto: 411, diasDuracao: 30, proximaCompra: '2026-04-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 411 },
  { data: '2026-03-31', mes: 'março', ano: 2026, cliente: 'Vera Penteado', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 850, precoVenda: 2100, lucroBruto: 1250, diasDuracao: 120, proximaCompra: '2026-07-29', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1250 },
  { data: '2026-03-31', mes: 'março', ano: 2026, cliente: 'Emílio Priore', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 750, precoVenda: 2100, lucroBruto: 1350, diasDuracao: 90, proximaCompra: '2026-06-29', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1350 },
  { data: '2026-04-06', mes: 'abril', ano: 2026, cliente: 'Isabella Roismann', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-05-26', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-04-08', mes: 'abril', ano: 2026, cliente: 'Sueli Goltz', produto: 'BPC 157 10mg', quantidade: 2, precoCusto: 735, precoVenda: 1380, lucroBruto: 645, diasDuracao: 50, proximaCompra: '2026-05-28', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 645 },
  { data: '2026-04-08', mes: 'abril', ano: 2026, cliente: 'Sueli Goltz', produto: 'GHK cu 50mg', quantidade: 2, precoCusto: 675, precoVenda: 1311, lucroBruto: 636, diasDuracao: 50, proximaCompra: '2026-05-28', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 636 },
  { data: '2026-04-08', mes: 'abril', ano: 2026, cliente: 'Sueli Goltz', produto: 'Ipamorelin 10mg', quantidade: 1, precoCusto: 367.5, precoVenda: 690, lucroBruto: 322.5, diasDuracao: 50, proximaCompra: '2026-05-28', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 322.5 },
  { data: '2026-04-08', mes: 'abril', ano: 2026, cliente: 'Celiane Spósito', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 120, proximaCompra: '2026-08-06', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-04-11', mes: 'abril', ano: 2026, cliente: 'Tati Perez', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 120, proximaCompra: '2026-08-09', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-04-14', mes: 'abril', ano: 2026, cliente: 'Catia Silva', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 120, proximaCompra: '2026-08-12', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-04-14', mes: 'abril', ano: 2026, cliente: 'Catia Silva', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-06-03', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-04-14', mes: 'abril', ano: 2026, cliente: 'Roberta Walter', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 120, proximaCompra: '2026-08-12', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-04-14', mes: 'abril', ano: 2026, cliente: 'Roberta Walter', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-06-03', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-04-14', mes: 'abril', ano: 2026, cliente: 'Roberta Walter', produto: 'Tesamorelin 15mg', quantidade: 1, precoCusto: 926.5, precoVenda: 1500, lucroBruto: 573.5, diasDuracao: 30, proximaCompra: '2026-05-14', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 573.5 },
  { data: '2026-04-14', mes: 'abril', ano: 2026, cliente: 'Roberta Walter', produto: 'AOD1604 5mg', quantidade: 1, precoCusto: 517.5, precoVenda: 979, lucroBruto: 461.5, diasDuracao: 20, proximaCompra: '2026-05-04', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 461.5 },
  { data: '2026-04-17', mes: 'abril', ano: 2026, cliente: 'Élisson', produto: 'Kisspeptin 10mg', quantidade: 1, precoCusto: 0, precoVenda: 490, lucroBruto: 490, diasDuracao: 20, proximaCompra: '2026-05-07', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 490 },
  { data: '2026-04-17', mes: 'abril', ano: 2026, cliente: 'Élisson', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-06-06', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-04-17', mes: 'abril', ano: 2026, cliente: 'Thiago Snatch', produto: 'Klow 80mg', quantidade: 1, precoCusto: 974.25, precoVenda: 1800, lucroBruto: 825.75, diasDuracao: 30, proximaCompra: '2026-05-17', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 375 },
  { data: '2026-04-19', mes: 'abril', ano: 2026, cliente: 'Martina Hanna', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1275, precoVenda: 2700, lucroBruto: 1425, diasDuracao: 90, proximaCompra: '2026-07-18', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1425 },
  { data: '2026-04-19', mes: 'abril', ano: 2026, cliente: 'Roberta Trida', produto: 'SS31 FDA 10mg', quantidade: 2, precoCusto: 885, precoVenda: 1678, lucroBruto: 793, diasDuracao: 60, proximaCompra: '2026-06-18', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1325.5 },
  { data: '2026-04-17', mes: 'abril', ano: 2026, cliente: 'Marinez Batista', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-06-06', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-04-23', mes: 'abril', ano: 2026, cliente: 'Sueli Goltz', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1275, precoVenda: 2700, lucroBruto: 1425, diasDuracao: 90, proximaCompra: '2026-07-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1425 },
  { data: '2026-04-27', mes: 'abril', ano: 2026, cliente: 'Roberta Trida', produto: 'Tesamorelin 15mg', quantidade: 1, precoCusto: 817.5, precoVenda: 1500, lucroBruto: 682.5, diasDuracao: 30, proximaCompra: '2026-05-27', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 682.5 },
  { data: '2026-04-28', mes: 'abril', ano: 2026, cliente: 'Gisele Koraicho', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 90, proximaCompra: '2026-07-27', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-04-28', mes: 'abril', ano: 2026, cliente: 'Gisele Koraicho', produto: 'GHK cu 50mg', quantidade: 2, precoCusto: 675, precoVenda: 1311, lucroBruto: 636, diasDuracao: 50, proximaCompra: '2026-06-17', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 636 },
  { data: '2026-04-28', mes: 'abril', ano: 2026, cliente: 'Gisele Koraicho', produto: 'Klow 80mg', quantidade: 2, precoCusto: 1935, precoVenda: 3420, lucroBruto: 1485, diasDuracao: 40, proximaCompra: '2026-06-07', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1485 },
  { data: '2026-04-28', mes: 'abril', ano: 2026, cliente: 'Gisele Koraicho', produto: 'Tesamorelin 15mg', quantidade: 1, precoCusto: 817.5, precoVenda: 1425, lucroBruto: 607.5, diasDuracao: 15, proximaCompra: '2026-05-13', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 607.5 },
  { data: '2026-04-29', mes: 'abril', ano: 2026, cliente: 'Débora Sats', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-06-18', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-04-29', mes: 'abril', ano: 2026, cliente: 'Débora Sats', produto: 'Retatrutida 30mg', quantidade: 1, precoCusto: 765, precoVenda: 1700, lucroBruto: 935, diasDuracao: 90, proximaCompra: '2026-07-28', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 935 },
  { data: '2026-05-02', mes: 'maio', ano: 2026, cliente: 'Danilo Pardi', produto: 'Tizerpartida 60mg', quantidade: 4, precoCusto: 4800, precoVenda: 8000, lucroBruto: 3200, diasDuracao: 90, proximaCompra: '2026-07-31', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 3200 },
  { data: '2026-05-05', mes: 'maio', ano: 2026, cliente: 'Natália Nascimento', produto: 'Retatrutida 30mg', quantidade: 1, precoCusto: 765, precoVenda: 1700, lucroBruto: 935, diasDuracao: 90, proximaCompra: '2026-08-03', formaPagamento: 'Dinheiro', taxa: 0, lucroLiquido: 935 },
  { data: '2026-05-05', mes: 'maio', ano: 2026, cliente: 'Roberta Walter', produto: 'Klow 80mg', quantidade: 1, precoCusto: 974.25, precoVenda: 1800, lucroBruto: 825.75, diasDuracao: 45, proximaCompra: '2026-06-19', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 825.75 },
  { data: '2026-05-08', mes: 'maio', ano: 2026, cliente: 'Ricardo Fadul', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1200, precoVenda: 2100, lucroBruto: 900, diasDuracao: 90, proximaCompra: '2026-08-06', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 900 },
  { data: '2026-05-08', mes: 'maio', ano: 2026, cliente: 'Rory', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1200, precoVenda: 2100, lucroBruto: 900, diasDuracao: 60, proximaCompra: '2026-07-07', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 900 },
  { data: '2026-05-08', mes: 'maio', ano: 2026, cliente: 'Danilo Pates', produto: 'GHK cu 50mg', quantidade: 2, precoCusto: 675, precoVenda: 1380, lucroBruto: 705, diasDuracao: 50, proximaCompra: '2026-06-27', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 705 },
  { data: '2026-05-08', mes: 'maio', ano: 2026, cliente: 'Danilo Pardi', produto: 'GHK cu 50mg', quantidade: 2, precoCusto: 675, precoVenda: 1180, lucroBruto: 505, diasDuracao: 50, proximaCompra: '2026-06-27', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 505 },
  { data: '2026-05-11', mes: 'maio', ano: 2026, cliente: 'Roberta Walter', produto: 'GHK cu 50mg', quantidade: 2, precoCusto: 675, precoVenda: 1380, lucroBruto: 705, diasDuracao: 50, proximaCompra: '2026-06-30', formaPagamento: 'Cartão de Crédito', taxa: 69, lucroLiquido: 636 },
  { data: '2026-05-11', mes: 'maio', ano: 2026, cliente: 'Roberta Walter', produto: 'Slup332 5mg', quantidade: 1, precoCusto: 500, precoVenda: 840, lucroBruto: 340, diasDuracao: 30, proximaCompra: '2026-06-10', formaPagamento: 'Cartão de Crédito', taxa: 69, lucroLiquido: 271 },
  { data: '2026-05-11', mes: 'maio', ano: 2026, cliente: 'Élisson', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-06-30', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-05-11', mes: 'maio', ano: 2026, cliente: 'Roberta Trida', produto: 'GHK cu 50mg', quantidade: 2, precoCusto: 675, precoVenda: 1380, lucroBruto: 705, diasDuracao: 50, proximaCompra: '2026-06-30', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 705 },
  { data: '2026-05-13', mes: 'maio', ano: 2026, cliente: 'Renato', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 90, proximaCompra: '2026-08-11', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-05-14', mes: 'maio', ano: 2026, cliente: 'Katia Casagrande', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-07-03', formaPagamento: 'Cartão de Crédito', taxa: 136.5, lucroLiquido: 216 },
  { data: '2026-05-14', mes: 'maio', ano: 2026, cliente: 'Katia Casagrande', produto: 'Klow 80mg', quantidade: 1, precoCusto: 974.25, precoVenda: 1800, lucroBruto: 825.75, diasDuracao: 50, proximaCompra: '2026-07-03', formaPagamento: 'Cartão de Crédito', taxa: 136.5, lucroLiquido: 689.25 },
  { data: '2026-05-14', mes: 'maio', ano: 2026, cliente: 'Sueli Goltz', produto: 'BPC 157 10mg', quantidade: 2, precoCusto: 735, precoVenda: 1380, lucroBruto: 645, diasDuracao: 40, proximaCompra: '2026-06-23', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 645 },
  { data: '2026-05-14', mes: 'maio', ano: 2026, cliente: 'Sueli Goltz', produto: 'AOD1604 5mg', quantidade: 1, precoCusto: 517.5, precoVenda: 979, lucroBruto: 461.5, diasDuracao: 40, proximaCompra: '2026-06-23', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 461.5 },
  { data: '2026-05-15', mes: 'maio', ano: 2026, cliente: 'Pablo', produto: 'Retatrutida 30mg', quantidade: 1, precoCusto: 765, precoVenda: 1700, lucroBruto: 935, diasDuracao: 90, proximaCompra: '2026-08-13', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 793.97 },
  { data: '2026-05-26', mes: 'maio', ano: 2026, cliente: 'Roberta Walter', produto: 'AOD1604 5mg', quantidade: 3, precoCusto: 1552.5, precoVenda: 2640, lucroBruto: 1087.5, diasDuracao: 30, proximaCompra: '2026-06-25', formaPagamento: 'Cartão de Crédito', taxa: 181.47, lucroLiquido: 906.03 },
  { data: '2026-05-26', mes: 'maio', ano: 2026, cliente: 'Sueli Goltz', produto: 'AOD1604 5mg', quantidade: 3, precoCusto: 1552.5, precoVenda: 2640, lucroBruto: 1087.5, diasDuracao: 30, proximaCompra: '2026-06-25', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1087.5 },
  { data: '2026-05-27', mes: 'maio', ano: 2026, cliente: 'Simone Cristina', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-07-16', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-05-28', mes: 'maio', ano: 2026, cliente: 'Juliano Vilela', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 60, proximaCompra: '2026-07-27', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-05-29', mes: 'maio', ano: 2026, cliente: 'Amélia', produto: 'Tizerpartida 60mg', quantidade: 1, precoCusto: 1200, precoVenda: 2100, lucroBruto: 900, diasDuracao: 90, proximaCompra: '2026-08-27', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 900 },
  { data: '2026-06-01', mes: 'junho', ano: 2026, cliente: 'Roberta Trida', produto: 'SS31 FDA 10mg', quantidade: 2, precoCusto: 885, precoVenda: 1678, lucroBruto: 793, diasDuracao: 30, proximaCompra: '2026-07-01', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 793 },
  { data: '2026-06-02', mes: 'junho', ano: 2026, cliente: 'Pablo', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 180, proximaCompra: '2026-11-29', formaPagamento: 'Cartão de Crédito', taxa: 191.47, lucroLiquido: 1383.53 },
  { data: '2026-06-02', mes: 'junho', ano: 2026, cliente: 'Rosângela Magalhães', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-07-22', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-06-03', mes: 'junho', ano: 2026, cliente: 'Roberta Trida', produto: 'Sermorelin 10mg', quantidade: 1, precoCusto: 592.5, precoVenda: 1100, lucroBruto: 507.5, diasDuracao: 30, proximaCompra: '2026-07-03', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 747.5 },
  { data: '2026-06-04', mes: 'junho', ano: 2026, cliente: 'Élisson', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-07-24', formaPagamento: 'Dinheiro', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-06-04', mes: 'junho', ano: 2026, cliente: 'Élisson', produto: 'Sermorelin 10mg', quantidade: 1, precoCusto: 592.5, precoVenda: 1100, lucroBruto: 507.5, diasDuracao: 30, proximaCompra: '2026-07-04', formaPagamento: 'Dinheiro', taxa: 0, lucroLiquido: 507.5 },
  { data: '2026-06-08', mes: 'junho', ano: 2026, cliente: 'Raphael Antonini', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-07-28', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-06-09', mes: 'junho', ano: 2026, cliente: 'Sueli Goltz', produto: 'GHK cu 50mg', quantidade: 1, precoCusto: 337.5, precoVenda: 690, lucroBruto: 352.5, diasDuracao: 50, proximaCompra: '2026-07-29', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 352.5 },
  { data: '2026-06-09', mes: 'junho', ano: 2026, cliente: 'Sueli Goltz', produto: 'Retatrutida 60mg', quantidade: 1, precoCusto: 1125, precoVenda: 2700, lucroBruto: 1575, diasDuracao: 90, proximaCompra: '2026-09-07', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 1575 },
  { data: '2026-06-16', mes: 'junho', ano: 2026, cliente: 'Ricardo Fadul', produto: 'Slup332 5mg', quantidade: 4, precoCusto: 2000, precoVenda: 3192, lucroBruto: 1192, diasDuracao: 60, proximaCompra: '2026-08-15', formaPagamento: 'Cartão de Crédito', taxa: 348, lucroLiquido: 844 },
  { data: '2026-06-16', mes: 'junho', ano: 2026, cliente: 'Ricardo Fadul', produto: 'Tizerpartida 60mg', quantidade: 2, precoCusto: 2000, precoVenda: 4000, lucroBruto: 2000, diasDuracao: 60, proximaCompra: '2026-08-15', formaPagamento: 'Cartão de Crédito', taxa: 348, lucroLiquido: 1652 },
  { data: '2026-06-18', mes: 'junho', ano: 2026, cliente: 'Sueli Goltz', produto: 'Ipamorelin 10mg', quantidade: 1, precoCusto: 490, precoVenda: 690, lucroBruto: 200, diasDuracao: 50, proximaCompra: '2026-08-07', formaPagamento: 'Pix', taxa: 0, lucroLiquido: 200 },
  { data: '2026-06-18', mes: 'junho', ano: 2026, cliente: 'Roberta Walter', produto: 'Klow 80mg', quantidade: 1, precoCusto: 1290, precoVenda: 1800, lucroBruto: 510, diasDuracao: 50, proximaCompra: '2026-08-07', formaPagamento: 'Cartão de Crédito', taxa: 62, lucroLiquido: 448 },
  { data: '2026-06-19', mes: 'junho', ano: 2026, cliente: 'Roberta Walter', produto: 'Ipamorelin 10mg', quantidade: 1, precoCusto: 490, precoVenda: 690, lucroBruto: 200, diasDuracao: 90, proximaCompra: '2026-09-17', formaPagamento: 'Cartão de Crédito', taxa: 62, lucroLiquido: 138 },
]

const vendasPerdidas = [
  { data: '2026-06-12', cliente: 'Élisson', produto: 'Retatrutida 60mg', valor: 2700, quantidade: 1, motivo: 'Sem estoque' },
  { data: '2026-06-17', cliente: 'Marina Baptista', produto: 'Retatrutida 60mg', valor: 2700, quantidade: 1, motivo: 'Sem estoque' },
  { data: '2026-06-13', cliente: 'Roberta Walter', produto: 'Retatrutida 60mg', valor: 2700, quantidade: 1, motivo: 'Sem estoque' },
  { data: '2026-06-18', cliente: 'Claudio Vianna', produto: 'Retatrutida 60mg', valor: 2700, quantidade: 1, motivo: 'Sem estoque' },
  { data: '2026-06-10', cliente: 'Bella Almeida', produto: 'Retatrutida 60mg', valor: 2700, quantidade: 1, motivo: 'Sem estoque' },
  { data: '2026-06-10', cliente: 'Bella Almeida', produto: 'GHK cu 50mg', valor: 690, quantidade: 1, motivo: 'Sem estoque' },
  { data: '2026-06-10', cliente: 'Rosângela Magalhães', produto: 'GHK cu 50mg', valor: 690, quantidade: 1, motivo: 'Sem estoque' },
  { data: '2026-06-10', cliente: 'Rosângela Magalhães', produto: 'GHK cu 50mg', valor: 690, quantidade: 1, motivo: 'Sem estoque' },
]

const cadastroClientes = [
  { nome: 'Adriana Nascimento', telefone: '+55 11 99630-1888', indicadoPor: '' },
  { nome: 'Amélia', telefone: '+55 11 99688-1339', indicadoPor: 'Dadá' },
  { nome: 'Caroline Villela', telefone: '+55 47 9209-2332', indicadoPor: 'Katia' },
  { nome: 'Danilo Pardi', telefone: '11997768645', indicadoPor: 'Roberta Walter' },
  { nome: 'Danilo Pates', telefone: '+55 11 95439-2120', indicadoPor: '' },
  { nome: 'David', telefone: '+55 11 96973-2082', indicadoPor: 'Roberta Walter' },
  { nome: 'Élisson', telefone: '+55 27 99989-4333', indicadoPor: 'Thiago Snatch' },
  { nome: 'Emílio Priore', telefone: '+55 11 94377-2133', indicadoPor: 'Pedro Priore' },
  { nome: 'Felipe Vargas', telefone: '', indicadoPor: '' },
  { nome: 'Fiorangela', telefone: '+55 11 97169-6699', indicadoPor: 'Dadá' },
  { nome: 'Flávio Alvarenga', telefone: '11947161770', indicadoPor: '' },
  { nome: 'Gabriel Oliveira', telefone: '4898233397', indicadoPor: 'Katia Casagrande' },
  { nome: 'Guilherme Ladeira', telefone: '+55 11 99983-8656', indicadoPor: '' },
  { nome: 'Jessica de Oliveira', telefone: '+55 11 99128-7922', indicadoPor: 'Paulo Henrique Freitas' },
  { nome: 'Leonardo Veiga', telefone: '+55 11 97156-9875', indicadoPor: '' },
  { nome: 'Matilde Rodrigues', telefone: '+55 19 98831-9961', indicadoPor: '' },
  { nome: 'Michelle', telefone: '+55 11 98761-1414', indicadoPor: 'Adriana Nascimento' },
  { nome: 'Nelson', telefone: '+55 11 96164-0566', indicadoPor: 'Élisson Dias' },
  { nome: 'Paula Fogli', telefone: '+55 11 96603-6650', indicadoPor: '' },
  { nome: 'Paulo Henrique Freitas', telefone: '11991966023', indicadoPor: '' },
  { nome: 'Ricardo Fadul', telefone: '+55 11 98585-5344', indicadoPor: 'Adriana Nascimento' },
  { nome: 'Rory', telefone: '+55 11 99004-3223', indicadoPor: '' },
  { nome: 'Rosângela Magalhães', telefone: '+55 21 97019-0076', indicadoPor: 'Marcus Vinícius' },
  { nome: 'Saionara', telefone: '+55 21 99954-1392', indicadoPor: 'Adriana Nascimento' },
  { nome: 'Sueli Goltz', telefone: '+55 11 98667-0961', indicadoPor: 'Roberta Walter' },
  { nome: 'Zezé', telefone: '', indicadoPor: '' },
  { nome: 'Simone Cristina', telefone: '+55 11 95980-0437', indicadoPor: 'Natália Nascimento' },
  { nome: 'Raphael Antonini', telefone: '11994011108', indicadoPor: '' },
  { nome: 'Claudia Gonçalves', telefone: '', indicadoPor: '' },
  { nome: 'Natália Nascimento', telefone: '+55 11 94146-5119', indicadoPor: '' },
  { nome: 'Julio Mariano', telefone: '+55 11 99497-3773', indicadoPor: '' },
  { nome: 'Mara Bella', telefone: '+55 22 99810-2636', indicadoPor: '' },
  { nome: 'Vera Penteado', telefone: '+55 11 99253-6984', indicadoPor: '' },
  { nome: 'Isabella Roismann', telefone: '+55 11 97133-2992', indicadoPor: 'Roberta Walter' },
  { nome: 'Celiane Spósito', telefone: '+55 11 99940-6205', indicadoPor: 'Flávio Alvarenga' },
  { nome: 'Tati Perez', telefone: '+55 11 97114-6001', indicadoPor: 'Roberta Walter' },
  { nome: 'Catia Silva', telefone: '', indicadoPor: '' },
  { nome: 'Thiago Snatch', telefone: '+55 11 97621-4976', indicadoPor: '' },
  { nome: 'Martina Hanna', telefone: '', indicadoPor: '' },
  { nome: 'Marinez Batista', telefone: '+55 11 94326-3131', indicadoPor: 'Roberta Walter' },
  { nome: 'Roberta Trida', telefone: '', indicadoPor: '' },
  { nome: 'Gisele Koraicho', telefone: '+55 11 97592-4403', indicadoPor: 'Roberta Walter' },
  { nome: 'Débora Sats', telefone: '+55 11 95093-1408', indicadoPor: 'Roberta Walter' },
  { nome: 'Renato', telefone: '', indicadoPor: '' },
  { nome: 'Pablo', telefone: '+55 11 99321-7180', indicadoPor: '' },
  { nome: 'Juliano Vilela', telefone: '+55 11 94016-3040', indicadoPor: 'Ricardo Fadul' },
  { nome: 'Roberta Walter', telefone: '+55 11 99693-9897', indicadoPor: 'Adriana Nascimento' },
  { nome: 'Roberta', telefone: '', indicadoPor: '' },
  { nome: 'Claudio Vianna', telefone: '+55 21 98509-4103', indicadoPor: '' },
  { nome: 'Katia Casagrande', telefone: '', indicadoPor: '' },
  { nome: 'Suellen Lima', telefone: '+55 31 8807-8783', indicadoPor: 'Giovanna Aversano' },
]

async function main() {
  console.log('Limpando banco...')
  await prisma.vendaPerdida.deleteMany()
  await prisma.venda.deleteMany()
  await prisma.cadastroCliente.deleteMany()
  await prisma.cadastroProduto.deleteMany()

  console.log('Inserindo vendas...')
  for (const s of sales) {
    await prisma.venda.create({
      data: {
        data: new Date(s.data + 'T12:00:00Z'),
        mes: s.mes,
        ano: s.ano,
        cliente: s.cliente,
        produto: s.produto,
        quantidade: s.quantidade,
        precoCusto: s.precoCusto,
        precoVenda: s.precoVenda,
        lucroBruto: s.lucroBruto,
        diasDuracao: s.diasDuracao,
        proximaCompra: new Date(s.proximaCompra + 'T12:00:00Z'),
        formaPagamento: s.formaPagamento,
        taxa: s.taxa,
        lucroLiquido: s.lucroLiquido,
      },
    })
  }

  console.log('Inserindo vendas perdidas...')
  for (const vp of vendasPerdidas) {
    await prisma.vendaPerdida.create({
      data: {
        data: new Date(vp.data + 'T12:00:00Z'),
        cliente: vp.cliente,
        produto: vp.produto,
        valor: vp.valor,
        quantidade: vp.quantidade,
        motivo: vp.motivo,
      },
    })
  }

  console.log('Inserindo clientes...')
  for (const c of cadastroClientes) {
    await prisma.cadastroCliente.create({
      data: {
        nome: c.nome,
        telefone: c.telefone,
        indicadoPor: c.indicadoPor,
      },
    })
  }

  console.log('Inserindo produtos...')
  const produtos = [
    'Retatrutida 30mg', 'Retatrutida 60mg', 'Tizerpartida 60mg', 'GHK cu 50mg',
    'BPC 157 10mg', 'TB500 10mg', 'AOD1604 5mg', 'PT141 10mg', 'Tesamorelin 15mg',
    'Slup332 5mg', 'Klow 80mg', 'SS31 FDA 10mg', 'CJC + IPA 10mg', 'Ipamorelin 10mg',
    'Kisspeptin 10mg', 'Sermorelin 10mg',
  ]
  for (const nome of produtos) {
    await prisma.cadastroProduto.create({ data: { nome } })
  }

  console.log(`✅ Seed concluído: ${sales.length} vendas, ${vendasPerdidas.length} vendas perdidas, ${cadastroClientes.length} clientes, ${produtos.length} produtos.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
