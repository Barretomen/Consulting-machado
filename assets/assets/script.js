(() => {
  const form = document.querySelector('.irs-form');
  const whatsapp = document.querySelector('.whatsapp-float');

  function addStyle() {
    if (document.querySelector('#machados-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'machados-polish-style';
    style.textContent = `
      .notice-panel,.payment-panel{padding:22px;border:1px solid #ead6aa;border-radius:8px;background:#fff9ec;margin:16px 0}.notice-panel p,.payment-panel p{color:var(--muted)}.payment-panel{display:grid;gap:10px;border-color:#cfb071;background:#fffaf0}.payment-panel h4{margin:0;color:var(--navy);font-size:1.1rem}.proof-button{width:fit-content}.whatsapp-float{width:58px!important;min-height:58px!important;overflow:hidden!important;padding:10px!important;background:#11843f!important;border-radius:999px!important;box-shadow:0 16px 38px rgba(7,24,44,.28),0 0 0 1px rgba(255,255,255,.16) inset!important;white-space:nowrap!important;transition:width .22s ease,background .22s ease,box-shadow .22s ease,transform .22s ease!important}.whatsapp-float:hover,.whatsapp-float:focus-visible{width:min(360px,calc(100vw - 36px))!important;justify-content:flex-start!important;padding-right:22px!important;background:#0b7f39!important;transform:translateY(-2px)!important}.whatsapp-float span:last-child{opacity:0;max-width:0;overflow:hidden;transform:translateX(-6px);transition:opacity .18s ease,max-width .22s ease,transform .22s ease}.whatsapp-float:hover span:last-child,.whatsapp-float:focus-visible span:last-child{opacity:1;max-width:260px;transform:translateX(0)}.whatsapp-icon{display:grid;flex:0 0 38px;width:38px;height:38px;place-items:center;color:#0f7a3d;background:#fff;border-radius:50%}.whatsapp-icon svg{width:22px;height:22px;fill:currentColor}.iban-field:invalid{border-color:var(--danger)}@media(max-width:680px){.whatsapp-float:hover span:last-child,.whatsapp-float:focus-visible span:last-child{max-width:170px;font-size:.82rem;line-height:1.15}}
    `;
    document.head.appendChild(style);
  }

  function stepByHeading(text) {
    return Array.from(document.querySelectorAll('.form-step')).find((step) => {
      const h = step.querySelector('h3');
      return h && h.textContent.toLowerCase().includes(text.toLowerCase());
    });
  }

  function injectHousing() {
    const step = stepByHeading('Habita');
    if (!step || step.querySelector('[name="total_arrendamento_2025"]')) return;
    const h3 = step.querySelector('h3');
    h3.insertAdjacentHTML('afterend', `
      <div class="info-panel"><strong>Arrendamento em 2025</strong><p>Insira apenas o valor total efetivamente pago por si em arrendamento durante 2025. Exemplo: se a renda mensal é 800€, mas a sua parte é 400€, e pagou 6 meses em 2025, o total a indicar é 6 x 400€ = 2400€.</p></div>
    `);
    const checkboxGrid = step.querySelector('.checkbox-grid');
    checkboxGrid.insertAdjacentHTML('afterend', `
      <div class="field-grid"><label>Valor total pago por si em arrendamento em 2025<input type="number" name="total_arrendamento_2025" min="0" step="0.01" placeholder="Ex.: 2400"></label><label>Tem contrato de arrendamento registado nas Finanças?<select name="contrato_arrendamento_financas"><option value="">Selecionar</option><option>Sim</option><option>Não</option><option>Não sei confirmar</option></select></label></div>
    `);
  }

  function injectIncomeNotes() {
    const step = stepByHeading('Rendimentos');
    if (!step || step.querySelector('.income-contract-note')) return;
    const h3 = step.querySelector('h3');
    h3.insertAdjacentHTML('afterend', `<div class="info-panel income-contract-note"><strong>Trabalhou com contrato ou recibos verdes em 2025?</strong><p>Se trabalhou com contrato em Portugal em 2025, envie-nos a Declaração de Rendimentos emitida pela sua entidade patronal. Se trabalhou fora de Portugal, precisamos dos informes de rendimentos desse país. Caso a empresa ainda não os tenha fornecido, solicite-os o quanto antes.</p></div>`);
    const checkboxGrid = step.querySelector('.checkbox-grid');
    checkboxGrid.insertAdjacentHTML('afterend', `<div class="notice-panel"><strong>Investimentos</strong><p>Caso tenha investido em 2025, iremos entrar em contacto consigo, pois o valor do serviço poderá ser diferente e será necessária a declaração de investimentos disponibilizada pela plataforma utilizada.</p></div>`);
    step.insertAdjacentHTML('beforeend', `<div class="notice-panel"><strong>Outras informações importantes</strong><p>Indique nas observações qualquer informação relevante, como IRS Jovem, subsídios de arrendamento, incapacidade, situações relacionadas com filhos ou cônjuge, ou outras alterações fiscais.</p></div>`);
  }

  function injectPayment() {
    const step = stepByHeading('Confirma');
    if (!step || step.querySelector('.payment-panel')) return;
    step.insertAdjacentHTML('afterbegin', `
      <div class="payment-panel"><h4>Pagamento e finalização</h4><p><strong>Tabela de valores de IRS:</strong> Individual, solteiro/a: 25€. Declaração conjunta, casados: 45€.</p><p><strong>Dados para pagamento:</strong> MB WAY: 932 642 940. IBAN: PT50 0023 0000 4566 0656 9359 4. Titular: Roseane Assis.</p><p>Caso não consiga efetuar o pagamento via MB WAY, utilize o IBAN indicado acima.</p><a class="button primary proof-button" href="https://wa.me/351921176038?text=Ol%C3%A1%20Machados%20Consulting%2C%20vou%20enviar%20o%20comprovativo%20de%20pagamento%20do%20IRS%202026." target="_blank" rel="noopener">Enviar comprovativo por WhatsApp</a></div><div class="field-grid"><label>IBAN da conta de origem, se aplicável<input type="text" name="iban_origem_pagamento" class="iban-field" placeholder="Ex.: PT50 0000 0000 0000 0000 0000 0" pattern="PT50\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d" title="Indique um IBAN português no formato PT50 0000 0000 0000 0000 0000 0"><span class="error-message">Indique um IBAN válido no formato PT50 0000 0000 0000 0000 0000 0.</span></label><label>Nome do titular da conta de origem, se o pagamento for feito por outra pessoa<input type="text" name="titular_pagamento" placeholder="Nome completo do titular da conta"></label></div><div class="notice-panel"><strong>Envio do formulário</strong><p>Agora que concluiu o preenchimento dos seus dados, o próximo passo é a regularização do pagamento. A validação e análise da sua declaração iniciam-se apenas após a confirmação do pagamento.</p><p>Prazo de entrega: 72 horas úteis. Caso precise de urgência, avise-nos com antecedência, especialmente em situações relacionadas com AIMA, crédito habitação ou crédito automóvel.</p></div>
    `);
  }

  function fixWhatsapp() {
    if (!whatsapp) return;
    const text = 'Para outras dúvidas contacte-nos.';
    whatsapp.setAttribute('aria-label', `${text} por WhatsApp`);
    whatsapp.innerHTML = `<span class="whatsapp-icon" aria-hidden="true"><svg viewBox="0 0 32 32" role="img"><path d="M16 4a11.8 11.8 0 0 0-10.2 17.8L4 28l6.4-1.7A11.9 11.9 0 1 0 16 4Zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4A9.8 9.8 0 1 1 16 25.8Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-2.3-1.4 8.6 8.6 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6s0-.4 0-.6-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.3 3.4c.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.5Z"/></svg></span><span>${text}</span>`;
  }

  function bindSubmit() {
    if (!form) return;
    form.setAttribute('action', 'https://formsubmit.co/imjoaobarreto@gmail.com');
    form.addEventListener('submit', (event) => {
      const iban = form.querySelector('.iban-field');
      if (iban && iban.value.trim() && !iban.checkValidity()) {
        event.preventDefault();
        iban.reportValidity();
        return;
      }
      const request = sessionStorage.getItem('irsRequestNumber') || `IRS-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      sessionStorage.setItem('irsRequestNumber', request);
      if (form.elements.numero_pedido) form.elements.numero_pedido.value = request;
    }, true);
  }

  addStyle();
  injectIncomeNotes();
  injectHousing();
  injectPayment();
  fixWhatsapp();
  bindSubmit();
})();