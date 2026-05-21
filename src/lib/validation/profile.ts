export const PROFILE_USERNAME_MIN_LENGTH = 2;
export const PROFILE_USERNAME_MAX_LENGTH = 30;
export const PROFILE_USERNAME_REGEX = /^[a-z0-9_]+$/;
export const PROFILE_USERNAME_PATTERN = PROFILE_USERNAME_REGEX.source;
export const PROFILE_USERNAME_MESSAGE = "Username must contain only lowercase letters, numbers, and underscores";
