let dados = [];

/* ===============================
   ELEMENTOS
================================ */
const inputCNAE  = document.getElementById("cnae");
const inputLC116 = document.getElementById("lc116");
const inputNBS   = document.getElementById("nbs");
const inputBusca = document.getElementById("buscaLc");

const listCNAE  = document.getElementById("cnaeList");
const listLC116 = document.getElementById("lc116List");
const listNBS   = document.getElementById("nbsList");
const listBusca = document.getElementById("buscaLcList");

const inputBuscaNBS = document.getElementById("buscaNbs");
const listBuscaNBS  = document.getElementById("buscaNbsList");
const tabelaDescNBS = document.getElementById("resultadoDescNBS");


const tabelaCodigo = document.getElementById("resultadoCodigo");
const tabelaDesc   = document.getElementById("resultadoDesc");

const limparBtn = document.getElementById("limpar");

/* ===============================
   UTIL
================================ */
function soNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

/* ===============================
   CARREGA CSV
================================ */
Papa.parse("csv/cnaenbs.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {

    console.log("Headers do CSV:", results.meta.fields);

    dados = results.data.map(r => ({
      cnae: soNumeros(r["Código CNAE"]),
      descCNAE: r["Descrição CNAE"] || "",
      lc116: soNumeros(r["Cód. Subitem LC 116"]),
      descLC116: r["Descrição Subitem_nbs"] || "",
      nbs: soNumeros(r["Código NBS"]),
      descNBS: r["Descrição NBS"] || ""
    }))
    .filter(d => d.cnae || d.lc116 || d.nbs);

    console.log("Total de registros:", dados.length);
    console.table(dados.slice(0, 5));
  },
  error: function (err) {
    console.error("Erro ao carregar CSV:", err);
  }
});

/* ===============================
   AUTOCOMPLETE NUMÉRICO
================================ */
function autocompleteNumerico(input, list, campo) {

  function render(termo = "") {
    // 🔹 fecha todos os autocompletes antes de abrir o atual
    fecharTodosAutocompletes();

    list.innerHTML = "";

    const termoNum = soNumeros(termo);

    const cnaeSel  = soNumeros(inputCNAE.value);
    const lc116Sel = soNumeros(inputLC116.value);
    const nbsSel   = soNumeros(inputNBS.value);

    const resultados = [...new Set(
      dados
        .filter(d => {
          if (!d[campo]) return false;

          if (!d[campo].includes(termoNum)) return false;

          if (campo !== "cnae" && cnaeSel && d.cnae !== cnaeSel) return false;
          if (campo !== "lc116" && lc116Sel && d.lc116 !== lc116Sel) return false;
          if (campo !== "nbs" && nbsSel && d.nbs !== nbsSel) return false;

          return true;
        })
        .map(d => d[campo])
    )].slice(0, 15);

    if (!resultados.length) {
      const li = document.createElement("li");
      li.textContent = "Nenhum resultado";
      li.style.cursor = "default";
      li.style.color = "#999";
      list.appendChild(li);
    } else {
      resultados.forEach(valor => {
        const li = document.createElement("li");
        li.textContent = valor;
        li.addEventListener("click", () => {
          input.value = valor;
          fecharTodosAutocompletes();
          mostrarResultadoCodigo();
        });
        list.appendChild(li);
      });
    }

    list.classList.add("show"); // sempre mostrar
  }

  input.addEventListener("focus", () => render(input.value));
  input.addEventListener("input", () => render(input.value));
}




/* ===============================
   AUTOCOMPLETE TEXTO
================================ */
function autocompleteTexto(input, list, campo) {

  function render(termo = "") {
    fecharTodosAutocompletes(); // 🔥 FECHA TODOS
    list.innerHTML = "";

    const resultados = [...new Set(
      dados
        .filter(d => d[campo] && d[campo].toLowerCase().includes(termo))
        .map(d => d[campo])
    )].slice(0, 15);

    if (!resultados.length) return;

    resultados.forEach(valor => {
      const li = document.createElement("li");
      li.textContent = valor;

      li.addEventListener("click", () => {
        input.value = valor;
        fecharTodosAutocompletes();
        mostrarResultadoDescricao();
      });

      list.appendChild(li);
    });

    list.classList.add("show");
  }

  input.addEventListener("focus", () => {
    render(input.value.toLowerCase());
  });

  input.addEventListener("input", () => {
    render(input.value.toLowerCase());
  });
}



/* ===============================
   AUTOCOMPLETE NBS TEXTO E NUMERO
================================ */

function autocompleteNBS(input, list) {

  function render(valor = "") {
    fecharTodosAutocompletes();
    list.innerHTML = "";

    const termoNum = soNumeros(valor);
    const termoTxt = valor.toLowerCase();

    const cnaeSel  = soNumeros(inputCNAE.value);
    const lc116Sel = soNumeros(inputLC116.value);

    let resultados = [];

    const filtradoBase = dados.filter(d => {
      if (cnaeSel && d.cnae !== cnaeSel) return false;
      if (lc116Sel && d.lc116 !== lc116Sel) return false;
      return true;
    });

    if (termoNum) {
      resultados = [...new Set(
        filtradoBase
          .filter(d => d.nbs && d.nbs.startsWith(termoNum))
          .map(d => d.nbs)
      )];
    } else {
      resultados = [...new Set(
        filtradoBase
          .filter(d => d.descNBS && d.descNBS.toLowerCase().includes(termoTxt))
          .map(d => d.descNBS)
      )];
    }

    resultados = resultados.slice(0, 15);
    if (!resultados.length) return;

    resultados.forEach(valor => {
      const li = document.createElement("li");
      li.textContent = valor;

      li.addEventListener("click", () => {
        input.value = valor;
        fecharTodosAutocompletes();
        mostrarResultadoCodigo();
      });

      list.appendChild(li);
    });

    list.classList.add("show");
  }

  input.addEventListener("focus", () => render(input.value));
  input.addEventListener("input", () => render(input.value));
}



/* ===============================
   ATIVA AUTOCOMPLETE
================================ */
autocompleteNumerico(inputCNAE,  listCNAE,  "cnae");
autocompleteNumerico(inputLC116, listLC116, "lc116");
autocompleteNBS(inputNBS, listNBS);
autocompleteTexto(inputBusca, listBusca, "descLC116");


/* ===============================
   FECHA AUTOCOMPLETE
================================ */
function fecharTodosAutocompletes() {
  [listCNAE, listLC116, listNBS, listBusca, listBuscaNBS].forEach(list => {
    list.innerHTML = "";
    list.classList.remove("show");
  });
}



/* ===============================
   RESULTADO POR CÓDIGO
================================ */
function mostrarResultadoCodigo() {
  const cnae  = soNumeros(inputCNAE.value);
  const lc116 = soNumeros(inputLC116.value);
  const nbs   = soNumeros(inputNBS.value);

  tabelaCodigo.innerHTML = "";

  let filtrado = dados;

  if (cnae)  filtrado = filtrado.filter(d => d.cnae === cnae);
  if (lc116) filtrado = filtrado.filter(d => d.lc116 === lc116);
  if (nbs)   filtrado = filtrado.filter(d => d.nbs === nbs);

  if (!filtrado.length) {
    tabelaCodigo.innerHTML =
      "<tr><td colspan='6'>Nenhum resultado encontrado</td></tr>";
    return;
  }

  filtrado.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.cnae}</td>
      <td>${d.descCNAE}</td>
      <td>${d.lc116}</td>
      <td>${d.descLC116}</td>
      <td>${d.nbs}</td>
      <td>${d.descNBS}</td>
    `;
    tabelaCodigo.appendChild(tr);
  });
}


/* ===============================
   RESULTADO POR DESCRIÇÃO
================================ */
function mostrarResultadoDescricao() {
  const termo = inputBusca.value.trim().toLowerCase();
  tabelaDesc.innerHTML = "";

  if (!termo) return;

  const filtrado = dados.filter(d =>
    d.descLC116.toLowerCase().includes(termo)
  );

  if (!filtrado.length) {
    tabelaDesc.innerHTML =
      "<tr><td colspan='6'>Nenhum resultado encontrado</td></tr>";
    return;
  }

  filtrado.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.lc116}</td>
      <td>${d.descLC116}</td>
      <td>${d.cnae}</td>
      <td>${d.descCNAE}</td>
      <td>${d.nbs}</td>
      <td>${d.descNBS}</td>
    `;
    tabelaDesc.appendChild(tr);
  });
}

function mostrarResultadoDescricaoNBS(descricao) {
  tabelaDescNBS.innerHTML = "";

  const cnaeSel  = soNumeros(inputCNAE.value);
  const lc116Sel = soNumeros(inputLC116.value);

  const filtrado = dados.filter(d => {
    if (
  !d.descNBS ||
  d.descNBS.toLowerCase().trim() !== descricao.toLowerCase().trim()
) return false;

    if (cnaeSel && d.cnae !== cnaeSel) return false;
    if (lc116Sel && d.lc116 !== lc116Sel) return false;
    return true;
  });

  if (!filtrado.length) {
    tabelaDescNBS.innerHTML =
      "<tr><td colspan='6'>Nenhum resultado encontrado</td></tr>";
    return;
  }

  filtrado.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nbs}</td>
      <td>${d.descNBS}</td>
      <td>${d.cnae}</td>
      <td>${d.descCNAE}</td>
      <td>${d.lc116}</td>
      <td>${d.descLC116}</td>
    `;
    tabelaDescNBS.appendChild(tr);
  });
}




/* ===============================
   BOTÃO LIMPAR
================================ */
limparBtn.addEventListener("click", () => {
  inputCNAE.value = "";
  inputLC116.value = "";
  inputNBS.value = "";
  inputBusca.value = "";

  tabelaCodigo.innerHTML = "";
  tabelaDesc.innerHTML = "";

  [listCNAE, listLC116, listNBS, listBusca].forEach(l => l.innerHTML = "");
});

/* ===============================
   TABS
================================ */
function openTab(evt, tabName) {
  const container = evt.currentTarget.closest(".cnae-consulta");

  // 1. esconde todas as abas
  container.querySelectorAll(".tabcontent").forEach(tab => {
    tab.style.display = "none";
  });

  // 2. remove active dos botões
  container.querySelectorAll(".tablinks").forEach(btn => {
    btn.classList.remove("active");
  });

  // 3. mostra apenas a aba clicada
  const abaAtiva = container.querySelector("#" + tabName);
  if (abaAtiva) abaAtiva.style.display = "block";

  // 4. marca botão como ativo
  evt.currentTarget.classList.add("active");
}


/* ===============================
   FECHA AUTOCOMPLETE AO CLICAR FORA
================================ */
document.addEventListener("click", e => {
  if (!e.target.closest(".autocomplete")) {
    [listCNAE, listLC116, listNBS, listBusca].forEach(list => {
      list.innerHTML = "";
      list.classList.remove("show");
    });
  }
});

/* ===============================
   PADRÃO BTN
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const btnAtivo = document.querySelector(".cnae-consulta .tablinks.active");
  if (btnAtivo) btnAtivo.click();
});


/* ===============================
   Descrição NBS Aba
================================ */

autocompleteTextoNBS(inputBuscaNBS, listBuscaNBS, "descNBS");

function autocompleteTextoNBS(input, list, campo) {

  function render(termo = "") {
    fecharTodosAutocompletes();
    list.innerHTML = "";

    const resultados = [...new Set(
      dados
        .filter(d => d[campo] && d[campo].toLowerCase().includes(termo))
        .map(d => d[campo])
    )].slice(0, 15);

    if (!resultados.length) return;

    resultados.forEach(valor => {
      const li = document.createElement("li");
      li.textContent = valor;

      li.addEventListener("click", () => {
        input.value = valor;
        fecharTodosAutocompletes();
        mostrarResultadoDescricaoNBS(valor);
      });

      list.appendChild(li);
    });

    list.classList.add("show");
  }

  input.addEventListener("focus", () => {
    render(input.value.toLowerCase());
  });

  input.addEventListener("input", () => {
    render(input.value.toLowerCase());
  });
}


document.addEventListener("click", function (e) {
  if (!e.target.classList.contains("btn-ver-mais")) return;

  const botao = e.target;
  const descricao = botao.previousElementSibling;

  if (!descricao) return;

  descricao.classList.toggle("expandida");

  botao.textContent = descricao.classList.contains("expandida")
    ? "Ver menos"
    : "Ver mais";
});

const limparDescNBSBtn = document.getElementById("limparDescNBS");

if (limparDescNBSBtn) {
  limparDescNBSBtn.addEventListener("click", () => {
    // limpa input
    inputBuscaNBS.value = "";

    // limpa autocomplete
    listBuscaNBS.innerHTML = "";
    listBuscaNBS.classList.remove("show");

    // limpa tabela
    tabelaDescNBS.innerHTML = "";
  });
}

document.getElementById("limpar-nbs").addEventListener("click", () => {
  inputBuscaNBS.value = "";
  tabelaDescNBS.innerHTML = "";
  listBuscaNBS.innerHTML = "";
});

const limparLc116Btn = document.getElementById("limpar-lc116");

// *** BOTÃO LIMPAR LC116 *** //
if (limparLc116Btn) {
  limparLc116Btn.addEventListener("click", () => {
    // limpa input
    inputBusca.value = "";

    // limpa autocomplete
    listBusca.innerHTML = "";
    listBusca.classList.remove("show");

    // limpa tabela
    tabelaDesc.innerHTML = "";
  });
}

