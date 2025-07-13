export const CLICK_ERRORS = {
  SIGN_CHECK_FAILED: { error: -1, error_note: 'SIGN CHECK FAILED!' },
  TRANSACTION_NOT_FOUND: {
    error: -5,
    error_note: 'Transaction does not exist',
  },
  ALREADY_PAID: { error: -4, error_note: 'Already paid' },
  TRANSACTION_CANCELLED: { error: -9, error_note: 'Transaction cancelled' },
  INCORRECT_AMOUNT: { error: -2, error_note: 'Incorrect parameter amount' },
  ACTION_NOT_FOUND: { error: -3, error_note: 'Action not found' },
};
