const roteador = require("express").Router({ mergeParams: true });
const Tabela = require("./TabelaProduto");
const Produto = require("./Produto");
const Serializador = require("../../Serializador").SerializadorProduto;

roteador.options("/", async (requisicao, resposta, proximo) => {
  resposta.set("Access-Control-Allow-Methods", "GET, POST");
  resposta.set("Access-Control-Allow-Headers", "Content-Type");
  resposta.status(204);
});

roteador.get("/", async (requisicao, resposta) => {
  const produtos = await Tabela.listar(requisicao.fornecedor.id);
  const serializador = new Serializador(resposta.getHeader("Content-Type"));
  resposta.send(serializador.serializar(produtos));
});

roteador.post("/", async (requisicao, resposta, proximo) => {
  try {
    const idFornecedor = requisicao.fornecedor.id;
    const corpo = requisicao.body;
    const dados = Object.assign({}, corpo, { fornecedor: idFornecedor });
    const produto = new Produto(dados);
    await produto.criar();
    const serializador = new Serializador(resposta.getHeader("Content-Type"));
    resposta.set("Etag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp);
    resposta.set(
      "Location",
      `/api/fornecedores/${produto.fornecedor}/produtos/${produto.id}`
    );
    resposta.status(201);
    resposta.send(serializador.serializar(produto));
  } catch (error) {
    proximo(error);
  }
});

roteador.options("/:id", async (requisicao, resposta, proximo) => {
  resposta.set("Access-Control-Allow-Methods", "DELETE, GET, HEAD, PUT");
  resposta.set("Access-Control-Allow-Headers", "Content-Type");
  resposta.status(204);
});

roteador.delete("/:id", async (requisicao, resposta) => {
  const dados = {
    id: requisicao.params.id,
    fornecedor: requisicao.fornecedor.id,
  };

  const produto = new Produto(dados);
  await produto.apagar();
  resposta.status(204);
  resposta.end();
});

roteador.get("/:id", async (requisicao, resposta, proximo) => {
  try {
    const dados = {
      id: requisicao.params.id,
      fornecedor: requisicao.fornecedor.id,
    };
    const produto = new Produto(dados);
    await produto.carregar();
    const serializador = new Serializador(resposta.getHeader("Content-Type"), [
      "preco",
      "estoque",
      "fornecedor",
      "dataCriacao",
      "dataAtualizacao",
      "versao",
    ]);
    resposta.set("Etag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp);
    resposta.send(serializador.serializar(produto));
  } catch (error) {
    proximo(error);
  }
});

roteador.head("/:id", async (requisicao, resposta, proximo) => {
  try {
    const dados = {
      id: requisicao.params.id,
      fornecedor: requisicao.fornecedor.id,
    };
    const produto = new Produto(dados);
    await produto.carregar();
    resposta.set("Etag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp);
    resposta.status(200);
    resposta.end();
  } catch (error) {
    proximo(error);
  }
});

roteador.put("/:id", async (requisicao, resposta, proximo) => {
  try {
    const dados = Object.assign({}, requisicao.body, {
      id: requisicao.params.id,
      fornecedor: requisicao.fornecedor.id,
    });
    const produto = new Produto(dados);
    await produto.atualizar();
    await produto.carregar();
    resposta.set("Etag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp);
    resposta.status(204);
    resposta.end();
  } catch (error) {
    proximo(error);
  }
});

roteador.options(
  "/:id/diminuir-estoque",
  async (requisicao, resposta, proximo) => {
    resposta.set("Access-Control-Allow-Methods", "POST");
    resposta.set("Access-Control-Allow-Headers", "Content-Type");
    resposta.status(204);
  }
);

roteador.post(
  "/:id/diminuir-estoque",
  async (requisicao, resposta, proximo) => {
    try {
      const protudo = new Produto({
        id: requisicao.params.id,
        fornecedor: requisicao.fornecedor.id,
      });
      await protudo.carregar();
      protudo.estoque = protudo.estoque - requisicao.body.quantidade;
      await protudo.dimiuirEstoque();
      await protudo.carregar();
      resposta.set("Etag", produto.versao);
      const timestamp = new Date(produto.dataAtualizacao).getTime();
      resposta.set("Last-Modified", timestamp);
      resposta.status(204);
      resposta.end();
    } catch (error) {
      proximo(error);
    }
  }
);

module.exports = roteador;
