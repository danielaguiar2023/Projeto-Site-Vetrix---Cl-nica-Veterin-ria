// server.js
// API para disponibilidade de profissionais de saúde da Vetrix
// Para usar: npm install express xml2js fs-extra

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;
// Caminho para dados: altere para .json ou .xml conforme preferir
const DATA_FILE = path.join(__dirname, 'professionals.json');

// Função para ler e parsear JSON
async function readJson() {
  const content = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(content);
}

// Função para ler e parsear XML
async function readXml() {
  const content = await fs.readFile(DATA_FILE, 'utf8');
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(content);
  // Supondo estrutura <professionals><professional>...</professional></professionals>
  const list = result.professionals.professional.map(p => ({
    name: p.name[0],
    specialty: p.specialty[0]
  }));
  return { professionals: list };
}

// Rota principal: retorna lista de profissionais
// Query params opcionais: specialty (filtra por especialidade), name (busca por nome parcial)
app.get('/api/professionals', async (req, res) => {
  try {
    let data;
    if (DATA_FILE.endsWith('.json')) {
      data = await readJson();
    } else if (DATA_FILE.endsWith('.xml')) {
      data = await readXml();
    } else {
      return res.status(500).json({ error: 'Formato de arquivo não suportado' });
    }

    let professionals = data.professionals;
    // Filtro por especialidade
    if (req.query.specialty) {
      const sp = req.query.specialty.toLowerCase();
      professionals = professionals.filter(p => p.specialty.toLowerCase() === sp);
    }
    // Busca por nome
    if (req.query.name) {
      const nm = req.query.name.toLowerCase();
      professionals = professionals.filter(p => p.name.toLowerCase().includes(nm));
    }
    res.json({ professionals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler dados' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

/**
 * Exemplo de professionals.json:
 * {
 *   "professionals": [
 *     { "name": "Ana Souza",    "specialty": "Clinica Geral" },
 *     { "name": "Carlos Lima",  "specialty": "Ortopedia" },
 *     { "name": "Fernanda Alves","specialty": "Cardiologia" }
 *   ]
 * }
 *
 * Exemplo de professionals.xml:
 * <professionals>
 *   <professional>
 *     <name>Ana Souza</name>
 *     <specialty>Clinica Geral</specialty>
 *   </professional>
 *   <!-- demais profissionais -->
 * </professionals>
 */
