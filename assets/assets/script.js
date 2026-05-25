const steps = Array.from(document.querySelectorAll(".form-step"));
const stepLabels = Array.from(document.querySelectorAll(".step-list li"));
const prevButton = document.querySelector(".prev-step");
const nextButton = document.querySelector(".next-step");
const submitButton = document.querySelector(".submit-step");
const form = document.querySelector(".irs-form");
const fileInput = document.querySelector("#documentos");
const fileList = document.querySelector(".file-list");
const formError = document.querySelector(".form-error");

let currentStep = 0;

function showStep(index) {
  currentStep = index;
  steps.forEach((step, stepIndex) => step.classList.toggle("active", stepIndex === index));
  stepLabels.forEach((label, stepIndex) => label.classList.toggle("active", stepIndex === index));
  prevButton.style.visibility = index === 0 ? "hidden" : "visible";
  nextButton.style.display = index === steps.length - 1 ? "none" : "inline-flex";
  submitButton.style.display = index === steps.length - 1 ? "inline-flex" : "none";
  formError.classList.remove("visible");
}

function validateStep(step) {
  const fields = Array.from(step.querySelectorAll("input, select, textarea"));
  let valid = true;

  fields.forEach((field) => {
    const holder = field.closest("label");
    if (holder) {
      holder.classList.remove("field-invalid");
    }

    if (!field.checkValidity()) {
      valid = false;
      if (holder) {
        holder.classList.add("field-invalid");
      }
    }
  });

  return valid;
}

function createRequestNumber() {
  const existing = sessionStorage.getItem("irsRequestNumber");
  if (existing) {
    return existing;
  }

  const number = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
  const requestNumber = `IRS-2026-${number}`;
  sessionStorage.setItem("irsRequestNumber", requestNumber);
  return requestNumber;
}

function buildWhatsAppMessage(requestNumber) {
  const name = form.elements.nome?.value || "Cliente";
  const nif = form.elements.nif?.value || "NIF nao indicado";
  return `Novo pedido IRS 2026 - Machados Consulting\nPedido: ${requestNumber}\nCliente: ${name}\nNIF: ${nif}\nEmail: ${form.elements.email?.value || ""}\nTelemovel: ${form.elements.telemovel?.value || ""}`;
}

nextButton.addEventListener("click", () => {
  if (!validateStep(steps[currentStep])) {
    formError.textContent = "Corrija os campos assinalados antes de continuar.";
    formError.classList.add("visible");
    return;
  }

  showStep(Math.min(currentStep + 1, steps.length - 1));
});

prevButton.addEventListener("click", () => {
  showStep(Math.max(currentStep - 1, 0));
});

form.addEventListener("submit", async (event) => {
  const invalidStepIndex = steps.findIndex((step) => !validateStep(step));

  if (invalidStepIndex >= 0) {
    event.preventDefault();
    showStep(invalidStepIndex);
    formError.textContent = "Para submeter, confirme todos os campos obrigatorios e os consentimentos.";
    formError.classList.add("visible");
    return;
  }

  event.preventDefault();
  const requestNumber = createRequestNumber();
  form.elements.numero_pedido.value = requestNumber;
  submitButton.disabled = true;
  submitButton.textContent = "A enviar...";

  const formData = new FormData(form);

  try {
    await fetch(form.action, {
      method: "POST",
      body: formData,
      mode: "no-cors"
    });
  } catch (error) {
    const mailtoBody = encodeURIComponent(buildWhatsAppMessage(requestNumber));
    window.location.href = `mailto:imjoaobarreto@gmail.com?subject=Novo pedido IRS 2026 - ${requestNumber}&body=${mailtoBody}`;
  }

  const whatsappUrl = `https://wa.me/351921176038?text=${encodeURIComponent(buildWhatsAppMessage(requestNumber))}`;
  window.open(whatsappUrl, "_blank", "noopener");
  window.location.href = "confirmacao.html";
});

fileInput.addEventListener("change", () => {
  fileList.innerHTML = "";
  Array.from(fileInput.files).forEach((file) => {
    const item = document.createElement("li");
    item.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
    fileList.appendChild(item);
  });
});

showStep(0);
