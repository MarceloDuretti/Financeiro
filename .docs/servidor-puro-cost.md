# 🖥️ CUSTO DO SERVIDOR PURO - FinControl
## Infraestrutura + APIs Governamentais (SEM Comunicação Paga)

---

## 🎯 ESCOPO DO CÁLCULO

### ✅ INCLUÍDO (Infraestrutura + APIs Gratuitas)
- 💾 Database (PostgreSQL Neon)
- 📦 Storage de Arquivos (S3/Object Storage)
- ⚙️ Compute/Processing (Backend, Workers)
- 📊 Monitoring e Logs
- 🔍 APIs Governamentais **GRATUITAS**:
  - SEFAZ (consulta/download NFe, CTe, NFSe)
  - Sintegra (validação de IE)
  - ReceitaWS (CNPJ)
  - ViaCEP (endereços)
  - Banco Central (cotações)
- 🔔 Push Notifications (praticamente R$ 0)

### ❌ EXCLUÍDO (Comunicação Paga)
- ❌ WhatsApp API ($100/mês)
- ❌ SMS ($100/mês)
- ❌ Email SMTP ($15/mês)
- ❌ Outras APIs pagas

---

## 📊 OPERAÇÕES MENSAIS (1 Contador × 1000 Empresas)

### Documentos Fiscais Processados

| Tipo | Qtd/Mês | Tamanho Total |
|------|---------|---------------|
| **NFe (XML + PDF)** | 30.000 | 4,35 GB |
| **NFSe (XML + PDF)** | 12.000 | 1,14 GB |
| **CTe (XML + PDF)** | 5.000 | 650 MB |
| **Recibos/Comprovantes** | 8.000 | 1,6 GB |
| **TOTAL** | **55.000** | **7,74 GB** |

### Relatórios Gerados

| Tipo | Qtd/Mês | Tamanho Total |
|------|---------|---------------|
| **Balancete** | 1.000 | 500 MB |
| **DRE** | 1.000 | 300 MB |
| **Fluxo de Caixa** | 1.000 | 250 MB |
| **Conciliação Bancária** | 2.000 | 800 MB |
| **Relatórios Fiscais** | 2.000 | 700 MB |
| **Dashboard** | 1.000 | 150 MB |
| **Livro Diário** | 250 | 500 MB |
| **TOTAL** | **8.250** | **3,2 GB** |

### APIs Governamentais (Gratuitas)

| API | Chamadas/Mês | Custo |
|-----|--------------|-------|
| **SEFAZ (consulta NFe)** | 40.000 | **$0** ✅ |
| **SEFAZ (download XML)** | 50.000 | **$0** ✅ |
| **SEFAZ (manifestação)** | 20.000 | **$0** ✅ |
| **Sintegra (validação IE)** | 5.000 | **$0** ✅ |
| **ReceitaWS (CNPJ)** | 2.000 | **$0** ✅ |
| **ViaCEP** | 3.000 | **$0** ✅ |
| **Banco Central (cotações)** | 20.000 | **$0** ✅ |
| **TOTAL** | **140.000** | **$0** |

---

## 💾 1. DATABASE (PostgreSQL Neon)

### Storage de Dados

| Tipo de Dado | Volume/Mês | Acumulado (12 meses) |
|--------------|------------|----------------------|
| **Dados cadastrais** | 306 MB | 328 MB |
| **Documentos fiscais (XMLs)** | 1,08 GB | 12,96 GB |
| **Transações contábeis** | 1,2 GB | 14,4 GB |
| **Logs/Auditoria** | 800 MB | 9,6 GB |
| **Metadata** | 200 MB | 2,4 GB |
| **TOTAL** | **3,59 GB** | **39,68 GB** |

### Compute (Processamento)

| Operação | Qtd/Mês | Tempo Médio | Total Compute |
|----------|---------|-------------|---------------|
| **Queries SELECT** | 500.000 | 15ms | 2,08h |
| **Queries INSERT** | 140.000 | 25ms | 0,97h |
| **Queries UPDATE** | 50.000 | 30ms | 0,42h |
| **Parsing XML** | 102.000 | 80ms | 2,27h |
| **Validações** | 200.000 | 10ms | 0,56h |
| **TOTAL** | 992.000 | - | **6,3h/mês** |

**Compute 24/7:** 720 horas/mês (servidor sempre ativo)

### Custo Database (Mensal)

| Item | Uso | Custo Unit. | Total |
|------|-----|-------------|-------|
| **Storage** | 3,59 GB | $0,15/GB | $0,54 |
| **Compute (24/7)** | 720h | $0,10/h | $72,00 |
| **Backups automáticos** | 1,8 GB | $0,08/GB | $0,14 |
| **Data Transfer Out** | 2 GB | $0,09/GB | $0,18 |
| **SUBTOTAL** | - | - | **$72,86** |

---

## 📦 2. STORAGE DE ARQUIVOS (Object Storage)

### Documentos Armazenados

| Categoria | Volume/Mês | Retenção | Storage Ativo |
|-----------|------------|----------|---------------|
| **PDFs de NFe/CTe/NFSe** | 6,66 GB | 5 anos | 6,66 GB |
| **XMLs (no DB)** | 1,08 GB | 5 anos | 0 GB |
| **Relatórios gerados** | 3,2 GB | 2 anos | 3,2 GB |
| **Comprovantes/Recibos** | 1,6 GB | 5 anos | 1,6 GB |
| **TOTAL** | **12,54 GB** | - | **11,46 GB** |

### Acumulado (12 meses)

| Período | PDFs | Relatórios | Total | Após Compressão |
|---------|------|------------|-------|-----------------|
| **Mês 1** | 6,66 GB | 3,2 GB | 9,86 GB | 9,86 GB |
| **Mês 3** | 19,98 GB | 9,6 GB | 29,58 GB | 29,58 GB |
| **Mês 6** | 39,96 GB | 19,2 GB | 59,16 GB | 59,16 GB |
| **Mês 12** | 79,92 GB | 38,4 GB | 118,32 GB | 106 GB¹ |

**¹ Com compressão (10%) e archiving de relatórios >6 meses**

### Custo Storage (Mensal)

| Tipo | Volume | Custo Unit. | Total |
|------|--------|-------------|-------|
| **Hot (0-3 meses)** | 30 GB | $0,023/GB | $0,69 |
| **Cool (3-12 meses)** | 60 GB | $0,01/GB | $0,60 |
| **Archive (>12 meses)** | 0 GB | $0,004/GB | $0 |
| **Transfer Out** | 5 GB | $0,09/GB | $0,45 |
| **SUBTOTAL** | - | - | **$1,74** |

---

## ⚙️ 3. COMPUTE/PROCESSING

### Backend Server (Node.js)

| Componente | CPU | RAM | Horas/Mês |
|-----------|-----|-----|-----------|
| **API Server** | 1 core | 512 MB | 720h |
| **Workers (XML/PDF)** | 0,5 core | 256 MB | 200h |
| **Background Jobs** | 0,2 core | 128 MB | 720h |

### Processamento de Documentos

| Operação | Qtd/Mês | CPU/Op | Total CPU |
|----------|---------|--------|-----------|
| **Download NFe/XML** | 50.000 | 30ms | 416 min |
| **Parsing XML → JSON** | 102.000 | 80ms | 136h |
| **Validação SEFAZ** | 40.000 | 50ms | 33h |
| **Geração PDF** | 8.250 | 200ms | 27,5h |
| **Compressão arquivos** | 55.000 | 40ms | 36,7h |

**Total Processing:** ~233 horas/mês de CPU

### Custo Compute (Mensal)

| Serviço | Configuração | Horas | Custo Unit. | Total |
|---------|-------------|-------|-------------|-------|
| **Backend (principal)** | 1 core, 512 MB | 720h | $0,05/h | $36,00 |
| **Workers** | 0,5 core, 256 MB | 200h | $0,03/h | $6,00 |
| **Background** | 0,2 core, 128 MB | 720h | $0,01/h | $7,20 |
| **Cache (Redis)** | 256 MB | - | - | $5,12 |
| **CDN** | 50 GB transfer | - | $0,08/GB | $4,00 |
| **SUBTOTAL** | - | - | - | **$58,32** |

---

## 📊 4. MONITORING E LOGS

### Logs e Auditoria

| Tipo | Volume/Mês | Retenção | Storage |
|------|------------|----------|---------|
| **Application logs** | 500 MB | 30 dias | 500 MB |
| **Access logs** | 200 MB | 30 dias | 200 MB |
| **Audit trail** | 300 MB | 90 dias | 900 MB |
| **Error tracking** | 100 MB | 60 dias | 200 MB |
| **TOTAL** | 1,1 GB | - | 1,8 GB |

### Custo Monitoring (Mensal)

| Serviço | Custo |
|---------|-------|
| **Logs (retention)** | $3,00 |
| **APM (Application Performance)** | $5,00 |
| **Uptime monitoring** | $2,00 |
| **Error tracking** | $3,00 |
| **Alerts** | $0 (email/push) |
| **SUBTOTAL** | **$13,00** |

---

## 🔔 5. PUSH NOTIFICATIONS (Custo Zero)

### Uso de Push (alternativa grátis)

| Métrica | Quantidade/Mês |
|---------|----------------|
| **Pushes enviados** | 20.000 |
| **Custo FCM/APNs** | $0 |
| **Infraestrutura** | $0,09 |
| **TOTAL** | **$0,09** |

---

## 💰 CUSTO TOTAL MENSAL - SERVIDOR PURO

### Resumo de Custos (SEM Comunicação Paga)

| Categoria | Custo/Mês | % do Total |
|-----------|-----------|------------|
| **Database (PostgreSQL)** | $72,86 | 49,9% |
| **Compute/Processing** | $58,32 | 39,9% |
| **Monitoring/Logs** | $13,00 | 8,9% |
| **Storage (Object)** | $1,74 | 1,2% |
| **Push Notifications** | $0,09 | 0,1% |
| **APIs Governamentais** | $0,00 | 0% ✅ |
| **TOTAL** | **$146,01** | **100%** |

**Em Reais (R$ 5,00/USD):** R$ 730,05/mês

---

## 📊 COMPARATIVO: ANTES vs DEPOIS

### Custos de Comunicação Removidos

| Item | Custo Anterior | Novo Custo |
|------|----------------|------------|
| **WhatsApp API** | $100,00 | **$0** ✅ |
| **SMS** | $100,00 | **$0** ✅ |
| **Email SMTP** | $15,00 | **$0** ✅ |
| **Push** | - | $0,09 |
| **TOTAL ECONOMIZADO** | **$215,00** | **-$214,91** |

### Comparação Final

| Cenário | Custo/Mês | Diferença |
|---------|-----------|-----------|
| **COM comunicação paga** | $362,52 | - |
| **SEM comunicação paga** | $146,01 | **-$216,51 (-60%)** |

---

## 📈 CRESCIMENTO ANUAL (Servidor Puro)

### Projeção 12 Meses

| Mês | Database | Storage | Compute | Total/Mês | Acumulado |
|-----|----------|---------|---------|-----------|-----------|
| **Mês 1** | $72,86 | $1,74 | $58,32 | $146,01 | $146,01 |
| **Mês 2** | $73,40 | $2,05 | $58,32 | $146,86 | $292,87 |
| **Mês 3** | $74,20 | $2,42 | $58,32 | $148,03 | $440,90 |
| **Mês 6** | $78,50 | $4,20 | $58,32 | $154,11 | $902,45 |
| **Mês 12** | $88,60 | $8,48 | $58,32 | $168,49 | **$1.878,60** |

**Média mensal (ano 1):** $156,55  
**Total ano 1:** $1.878,60 (~R$ 9.393)

### Evolução 5 Anos

| Ano | Database | Storage | Compute | Total/Ano |
|-----|----------|---------|---------|-----------|
| **Ano 1** | $960 | $72 | $700 | **$1.879** |
| **Ano 2** | $1.200 | $144 | $700 | **$2.191** |
| **Ano 3** | $1.380 | $192 | $700 | **$2.419** |
| **Ano 4** | $1.500 | $216 | $700 | **$2.563** |
| **Ano 5** | $1.584 | $228 | $700 | **$2.659** |

**Total 5 anos:** $11.711 (~R$ 58.555)

---

## 💼 CUSTO POR EMPRESA

### Breakdown Individual

| Métrica | Por Empresa/Mês | Por Empresa/Ano |
|---------|-----------------|-----------------|
| **Custo total** | $0,146 | $1,75 |
| **Em Reais** | R$ 0,73 | R$ 8,76 |
| **Documentos processados** | 55 | 660 |
| **APIs chamadas** | 140 | 1.680 |
| **Storage usado** | 11,46 MB | 137,5 MB |

---

## 🎯 OTIMIZAÇÕES POSSÍVEIS

### 1. Database (-25%)

| Otimização | Economia/Mês | Como |
|-----------|--------------|------|
| **PgBouncer (connection pooling)** | $18 | Reduz conexões simultâneas |
| **Índices otimizados** | $10 | Queries mais rápidas |
| **Archiving automático** | $8 | Move dados antigos para cold |
| **TOTAL** | **$36** | - |

### 2. Storage (-30%)

| Otimização | Economia/Mês | Como |
|-----------|--------------|------|
| **Compressão PDFs** | $0,40 | Gzip antes de armazenar |
| **XMLs no Database** | $0,30 | Evita duplicação |
| **Glacier (>2 anos)** | $0,25 | Move para archive |
| **TOTAL** | **$0,95** | - |

### 3. Compute (-15%)

| Otimização | Economia/Mês | Como |
|-----------|--------------|------|
| **Auto-scaling** | $8 | Desliga em horários ociosos |
| **Code optimization** | $4 | Processamento mais eficiente |
| **Cache agressivo** | $2 | Menos reprocessamento |
| **TOTAL** | **$14** | - |

### Custo Otimizado Final

| Categoria | Antes | Depois | Economia |
|-----------|-------|--------|----------|
| **Database** | $72,86 | $54,65 | -25% |
| **Compute** | $58,32 | $49,57 | -15% |
| **Storage** | $1,74 | $1,22 | -30% |
| **Monitoring** | $13,00 | $13,00 | 0% |
| **TOTAL** | **$146,01** | **$118,53** | **-19%** |

**Custo otimizado:** $118,53/mês (~R$ 592,65)

---

## 📊 RESUMO EXECUTIVO

### Custo Mensal (1 Contador × 1000 Empresas)

| Item | Sem Otimização | Com Otimização |
|------|----------------|----------------|
| **Custo/Mês** | $146,01 (R$ 730) | $118,53 (R$ 593) |
| **Por Empresa** | $0,146 (R$ 0,73) | $0,118 (R$ 0,59) |
| **Custo/Ano** | $1.752,12 (R$ 8.760) | $1.422,36 (R$ 7.111) |

### Componentes do Custo

| Recurso | % do Custo | Valor/Mês |
|---------|------------|-----------|
| **Database** | 49,9% | $72,86 |
| **Compute** | 39,9% | $58,32 |
| **Monitoring** | 8,9% | $13,00 |
| **Storage** | 1,2% | $1,74 |
| **Push** | 0,1% | $0,09 |

### APIs Gratuitas (Incluídas)

✅ **140.000 chamadas/mês** de APIs governamentais = **$0**
- SEFAZ (NFe, CTe, NFSe)
- Sintegra, ReceitaWS, ViaCEP
- Banco Central

---

## 💰 MODELO DE RECEITA vs CUSTO

### Pricing Recomendado

| Plano | Empresas | Preço/Mês | Custo/Mês | Margem |
|-------|----------|-----------|-----------|--------|
| **Premium (1000)** | 1.000 | R$ 1.999 | R$ 730 | **63,5%** |
| **Premium Otimizado** | 1.000 | R$ 1.999 | R$ 593 | **70,3%** |
| **Enterprise (1000)** | 1.000 | R$ 2.999 | R$ 593 | **80,2%** |

---

## ✅ CONCLUSÕES FINAIS

### Custo Real do Servidor (Infraestrutura Pura)

**SEM comunicação paga:**
- 💰 **$146,01/mês** (R$ 730)
- 📉 **Com otimização: $118,53/mês** (R$ 593)
- 📊 **Por empresa: R$ 0,59/mês**

**Principais componentes:**
1. **Database (50%):** PostgreSQL 24/7
2. **Compute (40%):** Backend + Workers
3. **Monitoring (9%):** Logs + APM
4. **Storage (1%):** PDFs e XMLs

**APIs Gratuitas (custo zero):**
- ✅ SEFAZ completo (140k chamadas/mês)
- ✅ ReceitaWS, ViaCEP, Banco Central
- ✅ Push Notifications

**Viabilidade:**
- ✅ **Margem: 70%+** (cobrando R$ 1.999 por 1000 empresas)
- ✅ **Escalável:** Custo cresce linearmente
- ✅ **Sustentável:** ROI positivo desde mês 1

---

**Gerado em:** 2025-01-29  
**Cenário:** 1 Contador × 1.000 Empresas (Servidor Puro)  
**Projeto:** FinControl - Custo de Infraestrutura sem Comunicação Paga
