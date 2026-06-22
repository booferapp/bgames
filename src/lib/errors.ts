export type BooferErrorCode =
  | 'BOOFER_UNAUTHENTICATED'
  | 'BOOFER_NOT_VERIFIED'
  | 'BOOFER_NOT_VALIDATED'
  | 'BOOFER_NOT_DEVELOPER'
  | 'BOOFER_DEV_SUSPENDED'
  | 'GAME_URL_INVALID'
  | 'GAME_API_KEY_MISSING'
  | 'GAME_TITLE_REQUIRED'
  | 'GAME_FILE_TOO_LARGE'
  | 'GAME_FILE_INVALID_TYPE'
  | 'UPLOAD_FAILED'
  | 'UNKNOWN'

export interface BooferError {
  code: BooferErrorCode
  message: string
  hint: string
}

export const ERRORS: Record<BooferErrorCode, BooferError> = {
  BOOFER_UNAUTHENTICATED: {
    code: 'BOOFER_UNAUTHENTICATED',
    message: 'You are not signed in.',
    hint: 'Sign in using your Boofer account credentials.',
  },
  BOOFER_NOT_VERIFIED: {
    code: 'BOOFER_NOT_VERIFIED',
    message: 'Your Boofer account is not verified.',
    hint: 'Complete identity verification inside the Boofer app to unlock developer access.',
  },
  BOOFER_NOT_VALIDATED: {
    code: 'BOOFER_NOT_VALIDATED',
    message: 'Your account has not been validated yet.',
    hint: 'Check your email or phone for a validation link from Boofer.',
  },
  BOOFER_NOT_DEVELOPER: {
    code: 'BOOFER_NOT_DEVELOPER',
    message: 'You are not registered as a Boofer developer.',
    hint: 'Open the Boofer app → Games → Become a Developer to register.',
  },
  BOOFER_DEV_SUSPENDED: {
    code: 'BOOFER_DEV_SUSPENDED',
    message: 'Your developer account has been suspended.',
    hint: 'Contact Boofer support for assistance.',
  },
  GAME_URL_INVALID: {
    code: 'GAME_URL_INVALID',
    message: 'The game URL is invalid or unreachable.',
    hint: 'Ensure the URL uses HTTPS and is publicly accessible.',
  },
  GAME_API_KEY_MISSING: {
    code: 'GAME_API_KEY_MISSING',
    message: 'Your Boofer API key was not found in the game page.',
    hint: 'Add <meta name="boofer-api-key" content="YOUR_KEY"> inside your game\'s <head>.',
  },
  GAME_TITLE_REQUIRED: {
    code: 'GAME_TITLE_REQUIRED',
    message: 'A game title is required.',
    hint: 'Enter a descriptive title for your game.',
  },
  GAME_FILE_TOO_LARGE: {
    code: 'GAME_FILE_TOO_LARGE',
    message: 'Game file exceeds the 10 MB limit.',
    hint: 'Optimize your HTML game file and try again.',
  },
  GAME_FILE_INVALID_TYPE: {
    code: 'GAME_FILE_INVALID_TYPE',
    message: 'Only .html files are accepted.',
    hint: 'Upload a single self-contained HTML5 game file.',
  },
  UPLOAD_FAILED: {
    code: 'UPLOAD_FAILED',
    message: 'File upload failed.',
    hint: 'Check your connection and try again.',
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred.',
    hint: 'Please try again. Contact support if the issue persists.',
  },
}

export function getError(code: BooferErrorCode): BooferError {
  return ERRORS[code] ?? ERRORS.UNKNOWN
}
