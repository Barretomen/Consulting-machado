const steps = Array.from(document.querySelectorAll(".form-step"));
const stepLabels = Array.from(document.querySelectorAll(".step-list li"));
const prevButton = document.querySelector(".prev-step");
const nextButton = document.querySelector(".next-step");
const submitButton = document.querySelector(".submit-step");
const form = document.querySelector(".irs-form");
const fileInput = document.querySelector("#documentos");
const fileList = document.querySelector(".file-list");
const formError = document.querySelector(".form-error");
const dependentList = document.querySelector("[data-dependent-list]");
const dependentTemplate = document.querySelector("#dependent-template");
const addDependentButton = document.querySelector(".add-dependent");
const paymentOverlay = document.querySelector(".payment-overlay");
const paymentDoneButton = document.querySelector(".payment-done");
const paymentCancelButton = document.querySelector(".payment-cancel");
const devMode = new URLSearchParams(window.location.search).get("dev") === "1" || localStorage.getItem("machadosDevMode") === "1";

window.machadosScriptVersion = "20260525-emailblocks2";

let currentStep = 0;
let isChangingStep = false;
let paymentConfirmed = false;

function showStep(index) {
  if (!steps.length || isChangingStep || index === currentStep) return;

  isChangingStep = true;
  const current = steps[currentStep];
  const next = steps[index];

  current.classList.add("leaving");

  window.setTimeout(() => {
    current.classList.remove("active", "leaving");
    next.classList.add("active", "entering");
    currentStep = index;

    stepLabels.forEach((label, stepIndex) => label.classList.toggle("active", stepIndex === index));
    if (prevButton) prevButton.style.visibility = index === 0 ? "hidden" : "visible";
    if (nextButton) nextButton.style.display = index === steps.length - 1 ? "none" : "inline-flex";
    if (submitButton) submitButton.style.display = index === steps.length - 1 ? "inline-flex" : "none";
    formError?.classList.remove("visible");

    window.scrollTo({ top: document.querySelector("#formulario")?.offsetTop || 0, behavior: "smooth" });

    window.setTimeout(() => {
      next.classList.remove("entering");
      isChangingStep = false;
    }, 220);
  }, 180);
}

function initialiseSteps() {
  if (!steps.length) return;

  steps.forEach((step, stepIndex) => step.classList.toggle("active", stepIndex === 0));
  stepLabels.forEach((label, stepIndex) => label.classList.toggle("active", stepIndex === 0));
  if (prevButton) prevButton.style.visibility = "hidden";
  if (nextButton) nextButton.style.display = "inline-flex";
  if (submitButton) submitButton.style.display = "none";
}

function validateStep(step) {
  const fields = Array.from(step.querySelectorAll("input, select, textarea"));
  let valid = true;

  fields.forEach((field) => {
    const holder = field.closest("label");
    holder?.classList.remove("field-invalid");

    if (!field.checkValidity()) {
      valid = false;
      holder?.classList.add("field-invalid");
    }
  });

  return valid;
}

function createRequestNumber() {
  const existing = sessionStorage.getItem("irsRequestNumber");
  if (existing) return existing;

  const number = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
  const requestNumber = `IRS-2026-${number}`;
  sessionStorage.setItem("irsRequestNumber", requestNumber);
  return requestNumber;
}

function getCheckedValues(name) {
  return Array.from(form?.querySelectorAll(`input[name="${name}"]:checked`) || []).map((field) => field.value).join(", ") || "Não indicado";
}

function collectDependentsSummary() {
  if (!dependentList) return "Não indicado";

  const cards = Array.from(dependentList.querySelectorAll(".dependent-card"));
  const filledCards = cards.map((card, index) => {
    const number = index + 1;
    const value = (field) => card.querySelector(`[data-dependent-field="${field}"]`)?.value?.trim() || "";
    const nome = value("nome");
    const nif = value("nif");
    const parentesco = value("parentesco");

    const senha = value("senha") ? "sim, indicada no formulário" : "não indicada";

    if (!nome && !nif && !parentesco && senha === "não indicada") return "";
    return `Dependente ${number}: ${nome || "Nome não indicado"} | NIF: ${nif || "não indicado"} | Parentesco: ${parentesco || "não indicado"} | Palavra-passe: ${senha}`;
  }).filter(Boolean);

  return filledCards.length ? filledCards.join("\n") : "Sem dependentes indicados";
}

function fieldValue(name, fallback = "Não indicado") {
  const field = form?.elements[name];
  if (!field) return fallback;

  const value = field.value?.trim();
  return value || fallback;
}

function appendEmailPayloadField(name, value) {
  if (!form) return;

  const field = document.createElement("input");
  field.type = "hidden";
  field.name = name;
  field.value = value;
  field.className = "email-payload-field";
  form.appendChild(field);
}

function formatEmailLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function preparePrettyEmailPayload(requestNumber) {
  if (!form) return;

  form.querySelectorAll(".email-payload-field").forEach((field) => field.remove());

  const cliente = {
    nome: fieldValue("nome", "Cliente IRS 2026"),
    nif: fieldValue("nif"),
    email: fieldValue("email", "imjoaobarreto@gmail.com"),
    telemovel: fieldValue("telemovel"),
    estadoCivil: fieldValue("estado_civil"),
    moradaFiscal: fieldValue("morada_fiscal"),
    conjuge: fieldValue("conjuge"),
    situacaoAgregado: fieldValue("situacao_agregado"),
    dependentes: collectDependentsSummary(),
    alteracoesFamiliares: fieldValue("alteracoes_familiares"),
    rendimentos: getCheckedValues("rendimentos[]"),
    observacoesRendimentos: fieldValue("observacoes_rendimentos"),
    habitacao: getCheckedValues("habitacao[]"),
    totalArrendamento: fieldValue("total_arrendamento_2025"),
    contratoArrendamento: fieldValue("contrato_arrendamento_financas"),
    observacoesHabitacao: fieldValue("observacoes_habitacao"),
    documentosEmFalta: fieldValue("documentos_em_falta"),
    acessoFinancas: fieldValue("acesso_financas"),
    ibanOrigem: fieldValue("iban_origem_pagamento"),
    titularPagamento: fieldValue("titular_pagamento")
  };

  const subjectField = form.querySelector('input[name="subject"]');
  if (subjectField) {
    subjectField.value = `IRS 2026 | ${requestNumber} | ${cliente.nome}`;
  }

  const reservedNames = new Set(["access_key", "subject", "from_name", "redirect", "botcheck", "replyto"]);
  Array.from(form.elements).forEach((field) => {
    if (!field.name || reservedNames.has(field.name) || field.classList.contains("email-payload-field")) return;
    field.disabled = true;
  });

  appendEmailPayloadField("email", cliente.email);
  appendEmailPayloadField("replyto", cliente.email);
  appendEmailPayloadField("Nome do cliente", cliente.nome);
  appendEmailPayloadField("Telemovel", cliente.telemovel);
  appendEmailPayloadField("Numero do pedido", requestNumber);
  appendEmailPayloadField("Estado do pedido", "Pagamento indicado pelo cliente. A validar pela equipa.");

  appendEmailPayloadField("01 | DADOS PESSOAIS", formatEmailLines([
    `Nome completo: ${cliente.nome}`,
    `NIF: ${cliente.nif}`,
    `Email: ${cliente.email}`,
    `Telemóvel: ${cliente.telemovel}`,
    `Estado civil: ${cliente.estadoCivil}`,
    `Morada fiscal: ${cliente.moradaFiscal}`
  ]));

  appendEmailPayloadField("02 | AGREGADO FAMILIAR", formatEmailLines([
    `Cônjuge: ${cliente.conjuge}`,
    `Situação do agregado: ${cliente.situacaoAgregado}`,
    "Dependentes:",
    cliente.dependentes,
    `Alterações familiares em 2025: ${cliente.alteracoesFamiliares}`
  ]));

  appendEmailPayloadField("03 | RENDIMENTOS", formatEmailLines([
    `Tipos selecionados: ${cliente.rendimentos}`,
    `Observações: ${cliente.observacoesRendimentos}`
  ]));

  appendEmailPayloadField("04 | HABITACAO", formatEmailLines([
    `Situações selecionadas: ${cliente.habitacao}`,
    `Total pago em arrendamento em 2025: ${cliente.totalArrendamento}`,
    `Contrato de arrendamento registado nas Finanças: ${cliente.contratoArrendamento}`,
    `Detalhes: ${cliente.observacoesHabitacao}`
  ]));

  appendEmailPayloadField("05 | DOCUMENTOS", formatEmailLines([
    "Os documentos devem ser enviados pelo WhatsApp da Machados Consulting.",
    `Documentos em falta: ${cliente.documentosEmFalta}`
  ]));

  appendEmailPayloadField("06 | ACESSO AS FINANCAS", formatEmailLines([
    `Opção preferida: ${cliente.acessoFinancas}`
  ]));

  appendEmailPayloadField("07 | PAGAMENTO", formatEmailLines([
    `IBAN da conta de origem: ${cliente.ibanOrigem}`,
    `Titular da conta de origem: ${cliente.titularPagamento}`
  ]));

  appendEmailPayloadField("08 | CONSENTIMENTOS", "O cliente autorizou o tratamento de dados pessoais e confirmou que as informações prestadas são verdadeiras.");
}

function buildWhatsAppMessage(requestNumber) {
  const name = form?.elements.nome?.value || "Cliente";
  const nif = form?.elements.nif?.value || "NIF não indicado";
  const email = form?.elements.email?.value || "";
  const phone = form?.elements.telemovel?.value || "";

  return [
    "Novo pedido IRS 2026 - Machados Consulting",
    `Pedido: ${requestNumber}`,
    `Cliente: ${name}`,
    `NIF: ${nif}`,
    `Email: ${email}`,
    `Telemóvel: ${phone}`,
    `Rendimentos: ${getCheckedValues("rendimentos[]")}`,
    `Habitação: ${getCheckedValues("habitacao[]")}`,
    `Observações de rendimentos: ${form?.elements.observacoes_rendimentos?.value || ""}`,
    `Observações de habitação: ${form?.elements.observacoes_habitacao?.value || ""}`,
    "Dependentes:",
    collectDependentsSummary()
  ].join("\n");
}

function attachPageTransitions() {
  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.target === "_blank") return;

      event.preventDefault();
      document.body.classList.add("page-exit");
      window.setTimeout(() => {
        window.location.href = href;
      }, 360);
    });
  });
}

function refreshDependentFields() {
  if (!dependentList) return;

  Array.from(dependentList.querySelectorAll(".dependent-card")).forEach((card, index) => {
    const number = index + 1;
    const numberLabel = card.querySelector("[data-dependent-number]");
    if (numberLabel) numberLabel.textContent = number;

    card.querySelectorAll("[data-dependent-field]").forEach((field) => {
      const key = field.dataset.dependentField;
      field.name = `dependente_${number}_${key}`;
    });
  });
}

function addDependent() {
  if (!dependentList || !dependentTemplate) return;

  const fragment = dependentTemplate.content.cloneNode(true);
  dependentList.appendChild(fragment);
  refreshDependentFields();
}

function openPaymentOverlay() {
  if (!paymentOverlay) return;
  window.scrollTo({ top: 0, behavior: "smooth" });
  paymentOverlay.scrollTop = 0;
  paymentOverlay.classList.add("is-visible");
  paymentOverlay.setAttribute("aria-hidden", "false");
  window.setTimeout(() => paymentDoneButton?.focus({ preventScroll: true }), 220);
}

function closePaymentOverlay() {
  if (!paymentOverlay) return;
  paymentOverlay.classList.remove("is-visible");
  paymentOverlay.setAttribute("aria-hidden", "true");
  submitButton?.focus();
}

function prepareFinalSubmission() {
  const requestNumber = createRequestNumber();
  if (form?.elements.numero_pedido) form.elements.numero_pedido.value = requestNumber;

  const redirectField = form?.querySelector('input[name="redirect"]');
  if (redirectField) {
    redirectField.value = new URL("confirmacao.html", window.location.href).href;
  }

  preparePrettyEmailPayload(requestNumber);

  const whatsappUrl = `https://wa.me/351921176038?text=${encodeURIComponent(buildWhatsAppMessage(requestNumber))}`;
  window.open(whatsappUrl, "_blank", "noopener");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "A enviar...";
  }
}

function hasEmailEndpoint() {
  const provider = form?.dataset.emailProvider || "";
  if (provider === "web3forms") {
    return Boolean(form?.querySelector('input[name="access_key"]')?.value.trim());
  }

  return Boolean(form?.action);
}

function showSubmissionConfigError() {
  closePaymentOverlay();
  formError.textContent = "O envio por email ainda precisa da chave Web3Forms. Use o modo dev para testar a navegação, ou coloque a access_key antes do teste real.";
  formError.classList.add("visible");
}

function simulateDevSubmission() {
  prepareFinalSubmission();
  const confirmationUrl = new URL("confirmacao.html", window.location.href);
  confirmationUrl.searchParams.set("dev", "1");
  window.location.href = confirmationUrl.href;
}

function startPaymentStep(event) {
  if (paymentConfirmed) return true;

  event?.preventDefault();
  const invalidStepIndex = steps.findIndex((step) => !validateStep(step));

  if (invalidStepIndex >= 0) {
    showStep(invalidStepIndex);
    formError.textContent = "Para submeter, confirme todos os campos obrigatórios e os consentimentos.";
    formError.classList.add("visible");
    return false;
  }

  openPaymentOverlay();
  return false;
}

window.handlePaymentStart = startPaymentStep;

function setValue(selector, value) {
  const field = form?.querySelector(selector);
  if (!field) return;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function setChecked(selector, checked = true) {
  const field = form?.querySelector(selector);
  if (!field) return;
  field.checked = checked;
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function fillDeveloperData() {
  setValue('input[name="nome"]', "João Cliente Teste");
  setValue('input[name="nif"]', "245678901");
  setValue('input[name="email"]', "cliente.teste@example.com");
  setValue('input[name="telemovel"]', "912345678");
  setValue('select[name="estado_civil"]', "Solteiro/a");
  setValue('textarea[name="morada_fiscal"]', "Rua de Teste 25, 1000-001 Lisboa");
  setValue('select[name="situacao_agregado"]', "Com dependentes");

  if (!dependentList?.querySelector(".dependent-card")) addDependent();
  setValue('[name="dependente_1_nome"]', "Maria Cliente Teste");
  setValue('[name="dependente_1_parentesco"]', "Filho/a");
  setValue('[name="dependente_1_nif"]', "245678902");
  setValue('[name="dependente_1_senha"]', "IRS2026-Seguro");
  setValue('[name="dependente_1_nascimento"]', "2017-05-10");
  setValue('[name="dependente_1_situacao"]', "Dependente durante todo o ano");
  setValue('textarea[name="alteracoes_familiares"]', "Sem alterações familiares relevantes em 2025.");

  setChecked('input[name="rendimentos[]"][value="Trabalho por conta de outrem"]');
  setChecked('input[name="rendimentos[]"][value="Investimentos"]');
  setValue('textarea[name="observacoes_rendimentos"]', "Teste: IRS Jovem não aplicável. Investimentos em plataforma estrangeira a confirmar pela equipa.");

  setChecked('input[name="habitacao[]"][value="Arrendamento"]');
  setValue('input[name="total_arrendamento_2025"]', "2400");
  setValue('select[name="contrato_arrendamento_financas"]', "Sim");
  setValue('textarea[name="observacoes_habitacao"]', "Arrendamento pago parcialmente durante 2025.");
  setValue('textarea[name="documentos_em_falta"]', "Teste: comprovativos serão enviados por WhatsApp.");
  setValue('select[name="acesso_financas"]', "Pretendo ser contactado/a para confirmar o procedimento");
  setChecked('input[name="consentimento_dados"]');
  setChecked('input[name="confirmacao_verdade"]');
  setValue('input[name="iban_origem_pagamento"]', "PT50 0000 0000 0000 0000 0000 0");
  setValue('input[name="titular_pagamento"]', "João Cliente Teste");
}

function goToLastStepWithDeveloperData() {
  fillDeveloperData();
  isChangingStep = false;
  showStep(steps.length - 1);
}

function installDeveloperMode() {
  if (!devMode) return;
  localStorage.setItem("machadosDevMode", "1");
  document.body.classList.add("developer-mode");

  const panel = document.createElement("div");
  panel.className = "dev-panel";
  panel.innerHTML = `
    <strong>Modo dev</strong>
    <button type="button" data-dev-fill>Preencher teste</button>
    <button type="button" data-dev-payment>Ir para pagamento</button>
    <button type="button" data-dev-off>Desligar</button>
  `;
  document.body.appendChild(panel);

  panel.querySelector("[data-dev-fill]")?.addEventListener("click", fillDeveloperData);
  panel.querySelector("[data-dev-payment]")?.addEventListener("click", goToLastStepWithDeveloperData);
  panel.querySelector("[data-dev-off]")?.addEventListener("click", () => {
    localStorage.removeItem("machadosDevMode");
    window.location.href = window.location.pathname;
  });
}

addDependentButton?.addEventListener("click", addDependent);

if (dependentList) {
  dependentList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-dependent");
    if (!removeButton) return;

    removeButton.closest(".dependent-card")?.remove();
    refreshDependentFields();
  });

  addDependent();
}

nextButton?.addEventListener("click", () => {
  if (!validateStep(steps[currentStep])) {
    formError.textContent = "Corrija os campos assinalados antes de continuar.";
    formError.classList.add("visible");
    return;
  }

  showStep(Math.min(currentStep + 1, steps.length - 1));
});

prevButton?.addEventListener("click", () => {
  showStep(Math.max(currentStep - 1, 0));
});

submitButton?.addEventListener("click", (event) => {
  startPaymentStep(event);
});

form?.addEventListener("submit", (event) => {
  const invalidStepIndex = steps.findIndex((step) => !validateStep(step));

  if (invalidStepIndex >= 0) {
    event.preventDefault();
    showStep(invalidStepIndex);
    formError.textContent = "Para submeter, confirme todos os campos obrigatórios e os consentimentos.";
    formError.classList.add("visible");
    return;
  }

  if (!paymentConfirmed) {
    event.preventDefault();
    openPaymentOverlay();
    return;
  }

  prepareFinalSubmission();
});

paymentCancelButton?.addEventListener("click", closePaymentOverlay);

paymentDoneButton?.addEventListener("click", () => {
  paymentConfirmed = true;
  if (devMode && !hasEmailEndpoint()) {
    simulateDevSubmission();
    return;
  }
  if (!hasEmailEndpoint()) {
    showSubmissionConfigError();
    return;
  }
  prepareFinalSubmission();
  HTMLFormElement.prototype.submit.call(form);
});

paymentOverlay?.addEventListener("click", (event) => {
  if (event.target === paymentOverlay) closePaymentOverlay();
});

fileInput?.addEventListener("change", () => {
  if (!fileList) return;
  fileList.innerHTML = "";
  Array.from(fileInput.files).forEach((file) => {
    const item = document.createElement("li");
    item.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
    fileList.appendChild(item);
  });
});

initialiseSteps();
attachPageTransitions();
installDeveloperMode();
