const roteador = require("express").Router();
const TabelaFornecedor = require("./TabelaFornecedor");
const SerializadorFornecedor =
  require("../../Serializador").SerializadorFornecedor;

roteador.options("/", async (requisicao, resposta, proximo) => {
  resposta.set("Access-Control-Allow-Methods", "GET");
  resposta.set("Access-Control-Allow-Headers", "Content-Type");
  resposta.status(204);
});

roteador.get("/", async (requisicao, resposta) => {
  const resultados = await TabelaFornecedor.listar();
  resposta.status(200);
  const serializador = new SerializadorFornecedor(
    resposta.getHeader("Content-Type")
  );
  resposta.send(serializador.serializar(resultados));
});

module.exports = roteador;
