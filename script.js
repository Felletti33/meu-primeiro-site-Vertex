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

// Preserve inline validation; valid submissions use the form's native POST.
const camposObrigatorios = [...form.querySelectorAll('[required]')];
const mensagensObrigatorias = {
  nome: 'Informe seu nome completo.',
  email: 'Informe seu e-mail.',
  mensagem: 'Escreva uma mensagem sobre seu projeto.'
};

function validarCampo(campo) {
  let erro = '';
  if (!campo.value.trim()) {
    erro = mensagensObrigatorias[campo.id];
  } else if (campo.type === 'email' && campo.validity.typeMismatch) {
    erro = 'Informe um e-mail válido, como nome@exemplo.com.';
  }

  const mensagem = document.getElementById('erro-' + campo.id);
  mensagem.textContent = erro;
  mensagem.hidden = !erro;
  campo.setAttribute('aria-invalid', String(Boolean(erro)));
  return !erro;
}

form.addEventListener('submit', (evento) => {
  const invalidos = camposObrigatorios.filter((campo) => !validarCampo(campo));
  if (invalidos.length) {
    evento.preventDefault();
    statusEl.textContent = invalidos.length === 1
      ? 'Revise o campo indicado antes de continuar.'
      : 'Revise os ' + invalidos.length + ' campos indicados antes de continuar.';
    invalidos[0].focus();
    return;
  }

  // Let the browser navigate to Formspree; only the service confirms delivery.
  statusEl.textContent = '';
});

camposObrigatorios.forEach((campo) => {
  campo.addEventListener('blur', () => validarCampo(campo));
  campo.addEventListener('input', () => {
    if (campo.hasAttribute('aria-invalid')) validarCampo(campo);
    statusEl.textContent = '';
  });
});

form.addEventListener('change', () => {
  statusEl.textContent = '';
});

// Without JavaScript, required and type="email" retain native HTML validation.
// Enable custom accessible messages only once all form handlers are installed.
form.noValidate = true;
