import { VariableDeclaration } from 'ts-morph';

const MAX_TYPE_LENGTH = 80;

export function resolveVariableType(decl: VariableDeclaration): string {
  try {
    const type = decl.getType();
    const text = type.getText(decl);
    return text.length > MAX_TYPE_LENGTH ? text.slice(0, MAX_TYPE_LENGTH) + '…' : text;
  } catch {
    return '';
  }
}
