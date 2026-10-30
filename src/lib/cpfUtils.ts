/**
 * Utilitários para validação, limpeza e formatação de CPF e telefones brasileiros.
 */

/**
 * Remove qualquer caractere que não seja dígito.
 */
export function cleanDigits(value?: string | null): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Formata uma string de até 11 dígitos no padrão de CPF: 000.000.000-00
 */
export function formatCPF(value?: string | null): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validação oficial do algoritmo de CPF brasileiro (dígitos verificadores).
 */
export function validateCPF(rawCpf?: string | null): boolean {
  const cpf = cleanDigits(rawCpf);
  if (cpf.length !== 11) return false;

  // Rejeita sequências conhecidas de dígitos repetidos (ex: 00000000000, 11111111111...)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;

  // Validação do 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

/**
 * Formata telefone brasileiro no padrão (11) 99999-9999 ou (11) 9999-9999
 */
export function formatPhoneBR(value?: string | null): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Calcula idade com base na data de nascimento (YYYY-MM-DD).
 */
export function calculateAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  const now = new Date();
  let age = now.getFullYear() - y;
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  if (currentMonth < m || (currentMonth === m && currentDay < d)) {
    age--;
  }
  return age >= 0 ? age : null;
}
