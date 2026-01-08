import { ConfigNotSetError } from './errors/baseError';

export const configParser = (configName: string, defaultValue?: string) => {
  const value = process.env[configName] || defaultValue;
  if (!value) {
    throw new ConfigNotSetError(`Config variable ${configName} was not set`);
  }
  return value;
};
