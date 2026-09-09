export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Запись') => new AppError(404, 'NOT_FOUND', `${what} не найдена`);
export const forbidden = () => new AppError(403, 'FORBIDDEN', 'Недостаточно прав');
export const badRequest = (msg: string, code = 'BAD_REQUEST') => new AppError(400, code, msg);

/** Маппинг ошибок из SQL-функций в HTTP. */
export function mapPgError(e: any): AppError | null {
  const msg = String(e?.message ?? '');
  if (msg.includes('INSUFFICIENT_COINS')) {
    return new AppError(400, 'INSUFFICIENT_COINS', 'Недостаточно коинов');
  }
  if (msg.includes('STUDENT_NOT_FOUND')) {
    return new AppError(404, 'NOT_FOUND', 'Ученик не найден');
  }
  if (msg.includes('LEDGER_IMMUTABLE')) {
    return new AppError(500, 'LEDGER_IMMUTABLE', 'Транзакции коинов нельзя изменять');
  }
  if (e?.code === '23505') {
    return new AppError(409, 'CONFLICT', 'Такая запись уже существует');
  }
  if (e?.code === '23503') {
    return new AppError(400, 'FK_VIOLATION', 'Ссылка на несуществующую запись');
  }
  return null;
}
