export type UserDataErrorKind = 'simulated-failure' | 'invalid-input' | 'storage';

const MESSAGES: Record<UserDataErrorKind, string> = {
  'simulated-failure': 'Não foi possível salvar agora. Tente novamente.',
  'invalid-input': 'Os dados enviados são inválidos.',
  storage: 'Não foi possível gravar os dados neste navegador.',
};

export class UserDataError extends Error {
  override readonly name = 'UserDataError';
  readonly kind: UserDataErrorKind;

  constructor(kind: UserDataErrorKind, options: { cause?: unknown } = {}) {
    super(MESSAGES[kind], options);
    this.kind = kind;
  }
}

export function isUserDataError(error: unknown): error is UserDataError {
  return error instanceof UserDataError;
}
