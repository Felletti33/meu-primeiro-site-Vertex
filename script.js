"use strict";

const menu = document.getElementById("menu");
const menuBtn = document.querySelector(".menu-btn");
const mobile = window.matchMedia("(max-width: 800px)");
const form = document.getElementById("form-contato");
const statusEl = document.getElementById("form-status");
const header = document.querySelector(".header");

// Measure the actual space below the sticky header, including the top notice.
function ajustarEspacoMenu() {
  if (!mobile.matches) return;
  const viewport = window.visualViewport;
  const limite = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  const espaco = Math.max(0, limite - header.getBoundingClientRect().bottom);
  menu.style.setProperty("--menu-space", `${espaco}px`);
}

let ajusteMenuPendente = false;
function agendarAjusteMenu() {
  if (!mobile.matches || menuBtn.getAttribute("aria-expanded") !== "true" || ajusteMenuPendente) return;
  ajusteMenuPendente = true;
  window.requestAnimationFrame(() => {
    ajusteMenuPendente = false;
    ajustarEspacoMenu();
  });
}

window.addEventListener("resize", agendarAjusteMenu);
window.addEventListener("scroll", agendarAjusteMenu, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", agendarAjusteMenu);
  window.visualViewport.addEventListener("scroll", agendarAjusteMenu);
}
if ("ResizeObserver" in window) new ResizeObserver(agendarAjusteMenu).observe(header);

function fecharMenu(devolverFoco = false) {
  menu.classList.remove("aberto");
  menu.hidden = mobile.matches;
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "Abrir menu");
  if (devolverFoco) menuBtn.focus();
}

menuBtn.addEventListener("click", () => {
  if (!mobile.matches) return;
  const aberto = menu.classList.toggle("aberto");
  menu.hidden = !aberto;
  menuBtn.setAttribute("aria-expanded", String(aberto));
  menuBtn.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  if (aberto) ajustarEspacoMenu();
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    // Move focus to the destination before hiding the mobile links.
    const destino = document.querySelector(link.hash);
    if (destino) {
      destino.setAttribute("tabindex", "-1");
      destino.focus({ preventScroll: true });
    }
    fecharMenu();
  });
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
    fecharMenu(true);
  }
});

document.addEventListener("click", (evento) => {
  if (!evento.target.closest(".nav")) {
    fecharMenu(mobile.matches && menu.contains(document.activeElement));
  }
});

document.addEventListener("focusin", (evento) => {
  if (!evento.target.closest(".nav")) fecharMenu();
});

mobile.addEventListener("change", () => {
  const focoNoMenu = menu.contains(document.activeElement);
  const focoNoBotao = document.activeElement === menuBtn;
  fecharMenu();
  if (mobile.matches && focoNoMenu) menuBtn.focus();
  if (!mobile.matches && focoNoBotao) menu.querySelector("a").focus();
});

// Enable progressive enhancement only after the menu handlers are ready.
menuBtn.hidden = false;
document.documentElement.classList.add("js");
fecharMenu();
form.querySelector("button[type=submit]").disabled = false;

// Native validation can stop submission before the submit handler runs.
form.addEventListener("invalid", (evento) => {
  evento.target.setAttribute("aria-invalid", "true");
  statusEl.textContent = "";
}, true);

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const campos = [...form.querySelectorAll("input, textarea")];
  let primeiroInvalido = null;
  campos.forEach((campo) => {
    campo.setCustomValidity(campo.required && !campo.value.trim() ? "Preencha este campo." : "");
    const invalido = !campo.checkValidity();
    campo.setAttribute("aria-invalid", String(invalido));
    if (invalido && !primeiroInvalido) primeiroInvalido = campo;
  });
  if (primeiroInvalido) {
    primeiroInvalido.reportValidity();
    primeiroInvalido.focus();
    return;
  }

  const dados = new FormData(form);
  const texto = [
    "SOLICITAÇÃO — VERTEX (projeto demonstrativo)",
    "Este arquivo foi gerado localmente. O pedido NÃO foi enviado.",
    "",
    "Nome: " + dados.get("nome").trim(),
    "Empresa: " + (dados.get("empresa").trim() || "Não informada"),
    "E-mail para retorno: " + dados.get("email").trim(),
    "",
    "Cenário e necessidades:",
    dados.get("mensagem").trim()
  ].join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + texto], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "solicitacao-vertex.txt";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  statusEl.textContent = "Arquivo gerado para download. O pedido não foi enviado. Seus dados continuam aqui para você revisar.";
});

form.addEventListener("input", (evento) => {
  if (evento.target.matches("input, textarea")) {
    evento.target.setCustomValidity("");
    evento.target.removeAttribute("aria-invalid");
    statusEl.textContent = "";
  }
});
