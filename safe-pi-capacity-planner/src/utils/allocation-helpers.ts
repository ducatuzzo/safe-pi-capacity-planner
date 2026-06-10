import type { AllocationType, CustomAllocationType, FarbConfig, AllocationCategory } from '../types';
import { BUCHUNGSTYP_SP_FAKTOR, BUCHUNGSTYP_LABEL } from '../constants';

const BUILTIN_VALUES: readonly string[] = [
  'NONE', 'FERIEN', 'ABWESEND', 'TEILZEIT', 'MILITAER', 'IPA', 'BETRIEB', 'BETRIEB_PIKETT', 'PIKETT',
];
const BUILTIN_SET = new Set<string>(BUILTIN_VALUES);
const BUILTIN_ABSENCE = new Set<string>(['FERIEN', 'ABWESEND', 'MILITAER', 'IPA']);
const BUILTIN_BETRIEB = new Set<string>(['BETRIEB', 'BETRIEB_PIKETT']);
const BUILTIN_PIKETT = new Set<string>(['PIKETT', 'BETRIEB_PIKETT']);

const ALLOCATION_LETTER: Record<string, string> = {
  NONE: '', FERIEN: 'F', ABWESEND: 'A', TEILZEIT: 'T',
  MILITAER: 'M', IPA: 'I', BETRIEB: 'B', BETRIEB_PIKETT: 'BP', PIKETT: 'P',
};

export function isBuiltinType(value: string): value is AllocationType {
  return BUILTIN_SET.has(value);
}

export function findCustomType(value: string, customTypes: CustomAllocationType[]): CustomAllocationType | undefined {
  return customTypes.find(ct => ct.id === value);
}

export function getAllocationLetter(value: string, customTypes: CustomAllocationType[]): string {
  if (isBuiltinType(value)) return ALLOCATION_LETTER[value] ?? '';
  const custom = findCustomType(value, customTypes);
  return custom?.kuerzel ?? '?';
}

export function getAllocationLabel(value: string, customTypes: CustomAllocationType[]): string {
  if (isBuiltinType(value)) return BUCHUNGSTYP_LABEL[value] ?? value;
  const custom = findCustomType(value, customTypes);
  return custom?.label ?? value;
}

export function getAllocationColors(
  value: string,
  farbConfig: FarbConfig,
  customTypes: CustomAllocationType[],
): { bg: string; text: string } {
  if (isBuiltinType(value)) {
    const fc = farbConfig.buchungstypen[value];
    if (fc) return fc;
  }
  const custom = findCustomType(value, customTypes);
  if (custom) return { bg: custom.bg, text: custom.text };
  return { bg: 'transparent', text: '#1A1A1A' };
}

export function getAllocationSpFactor(value: string, customTypes: CustomAllocationType[]): number {
  if (isBuiltinType(value)) return BUCHUNGSTYP_SP_FAKTOR[value] ?? 0;
  const custom = findCustomType(value, customTypes);
  if (!custom) return 0;
  return 0;
}

export function getCategory(value: string, customTypes: CustomAllocationType[]): AllocationCategory | null {
  if (BUILTIN_ABSENCE.has(value)) return 'ABSENCE';
  if (value === 'BETRIEB') return 'BETRIEB';
  if (value === 'PIKETT') return 'PIKETT';
  if (value === 'BETRIEB_PIKETT') return 'BETRIEB_PIKETT';
  if (value === 'TEILZEIT') return 'ABSENCE';
  if (value === 'NONE') return null;
  const custom = findCustomType(value, customTypes);
  return custom?.category ?? null;
}

export function isAbsenceType(value: string, customTypes: CustomAllocationType[]): boolean {
  if (BUILTIN_ABSENCE.has(value)) return true;
  const custom = findCustomType(value, customTypes);
  return custom?.category === 'ABSENCE';
}

export function isBetriebType(value: string, customTypes: CustomAllocationType[]): boolean {
  if (BUILTIN_BETRIEB.has(value)) return true;
  const custom = findCustomType(value, customTypes);
  return custom?.category === 'BETRIEB' || custom?.category === 'BETRIEB_PIKETT';
}

export function isPikettType(value: string, customTypes: CustomAllocationType[]): boolean {
  if (BUILTIN_PIKETT.has(value)) return true;
  const custom = findCustomType(value, customTypes);
  return custom?.category === 'PIKETT' || custom?.category === 'BETRIEB_PIKETT';
}

export function isFullWorkDay(value: string, _customTypes: CustomAllocationType[]): boolean {
  if (value === 'NONE') return true;
  if (value === 'TEILZEIT') return false;
  if (isBuiltinType(value)) {
    return BUCHUNGSTYP_SP_FAKTOR[value] === 1;
  }
  return false;
}

export { BUILTIN_SET, ALLOCATION_LETTER };
