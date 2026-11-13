const digits = value => String(value || '').replace(/\D/g, '');

const formatCpf = value => digits(value).slice(0, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2')
  .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

const formatCnpj = value => digits(value).slice(0, 14)
  .replace(/^(\d{2})(\d)/, '$1.$2')
  .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/\.(\d{3})(\d)/, '.$1/$2')
  .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

export function validCpf(value) {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const check = length => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return Number(cpf[length]) === (remainder === 10 ? 0 : remainder);
  };
  return check(9) && check(10);
}

export function validCnpj(value) {
  const cnpj = digits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calculate = length => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, index) => total + Number(cnpj[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return Number(cnpj[12]) === calculate(12) && Number(cnpj[13]) === calculate(13);
}

export function bindDocumentValidation(input, typeOrOptions = () => digits(input.value).length === 14 ? 'CNPJ' : 'CPF') {
  const options = typeof typeOrOptions === 'object' && typeOrOptions !== null ? typeOrOptions : null;
  const typeInputs = Array.from(options?.typeInputs || []);
  const type = typeof typeOrOptions === 'function'
    ? typeOrOptions
    : () => typeInputs.find(item => item.checked)?.value || (digits(input.value).length === 14 ? 'CNPJ' : 'CPF');
  const error = document.createElement('small');
  error.className = 'document-validation-error';
  error.hidden = true;
  error.setAttribute('role', 'alert');
  input.insertAdjacentElement('afterend', error);
  let touched = false;
  const validate = (show = touched) => {
    const selectedType = type();
    const valid = selectedType === 'CNPJ' ? validCnpj(input.value) : validCpf(input.value);
    const message = valid ? '' : `${selectedType} inválido.`;
    input.setCustomValidity(message);
    error.textContent = message;
    error.hidden = !show || valid || !input.value.trim();
    input.setAttribute('aria-invalid', String(!valid && Boolean(input.value.trim())));
    return valid;
  };
  const syncType = () => {
    if (!options) return;
    const selectedType = type();
    const isCnpj = selectedType === 'CNPJ';
    input.maxLength = isCnpj ? 18 : 14;
    input.placeholder = isCnpj ? '00.000.000/0000-00' : '000.000.000-00';
    input.value = isCnpj ? formatCnpj(input.value) : formatCpf(input.value);
    if (options.label) options.label.textContent = `${selectedType}*`;
    if (options.corporateField) {
      const corporateInput = options.corporateField.querySelector('input');
      options.corporateField.classList.toggle('is-invisible', !isCnpj);
      options.corporateField.setAttribute('aria-hidden', String(!isCnpj));
      if (corporateInput) {
        corporateInput.disabled = !isCnpj;
        corporateInput.required = isCnpj;
      }
    }
    validate();
  };
  input.addEventListener('input', () => {
    if (options) input.value = type() === 'CNPJ' ? formatCnpj(input.value) : formatCpf(input.value);
    validate();
  });
  input.addEventListener('blur', () => { touched = true; validate(true); });
  typeInputs.forEach(item => item.addEventListener('change', syncType));
  syncType();
  return validate;
}
