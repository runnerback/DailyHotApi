import dotenv from "dotenv";

// 环境变量
dotenv.config();

export type Config = {
  PORT: number;
  DISALLOW_ROBOT: boolean;
  CACHE_TTL: number;
  REQUEST_TIMEOUT: number;
  ALLOWED_DOMAIN: string;
  ALLOWED_HOST: string;
  USE_LOG_FILE: boolean;
  RSS_MODE: boolean;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  ZHIHU_COOKIE: string;
  FILTER_WEIBO_ADVERTISEMENT: boolean;
  API_KEY_ENABLE: boolean;
  API_KEY: string;
  KDL_ENABLE: boolean;
  KDL_SECRET_ID: string;
  KDL_SIGNATURE: string;
  KDL_USERNAME: string;
  KDL_PASSWORD: string;
  COZE_CLIENT_ID: string;
  COZE_PUBLIC_KEY_ID: string;
  COZE_SPACE_ID: string;
  COZE_WORKFLOW_ID: string;
};

// 验证并提取环境变量
const getEnvVariable = (key: string): string | undefined => {
  const value = process.env[key];
  if (value === undefined) return undefined;
  return value;
};

// 将环境变量转换为数值
const getNumericEnvVariable = (key: string, defaultValue: number): number => {
  const value = getEnvVariable(key) ?? String(defaultValue);
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) return defaultValue;
  return parsedValue;
};

// 将环境变量转换为布尔值
const getBooleanEnvVariable = (key: string, defaultValue: boolean): boolean => {
  const value = getEnvVariable(key) ?? String(defaultValue);
  return value.toLowerCase() === "true";
};

// 创建配置对象
export const config: Config = {
  PORT: getNumericEnvVariable("PORT", 6688),
  DISALLOW_ROBOT: getBooleanEnvVariable("DISALLOW_ROBOT", true),
  CACHE_TTL: getNumericEnvVariable("CACHE_TTL", 3600),
  REQUEST_TIMEOUT: getNumericEnvVariable("REQUEST_TIMEOUT", 6000),
  ALLOWED_DOMAIN: getEnvVariable("ALLOWED_DOMAIN") || "*",
  ALLOWED_HOST: getEnvVariable("ALLOWED_HOST") || "imsyy.top",
  USE_LOG_FILE: getBooleanEnvVariable("USE_LOG_FILE", true),
  RSS_MODE: getBooleanEnvVariable("RSS_MODE", false),
  REDIS_HOST: getEnvVariable("REDIS_HOST") || "127.0.0.1",
  REDIS_PORT: getNumericEnvVariable("REDIS_PORT", 6379),
  REDIS_PASSWORD: getEnvVariable("REDIS_PASSWORD") || "",
  REDIS_DB:  getNumericEnvVariable("REDIS_DB", 0),
  ZHIHU_COOKIE: getEnvVariable("ZHIHU_COOKIE") || "",
  FILTER_WEIBO_ADVERTISEMENT: getBooleanEnvVariable("FILTER_WEIBO_ADVERTISEMENT", false),
  API_KEY_ENABLE: getBooleanEnvVariable("API_KEY_ENABLE", false),
  API_KEY: getEnvVariable("API_KEY") || "",
  KDL_ENABLE: getBooleanEnvVariable("KDL_ENABLE", false),
  KDL_SECRET_ID: getEnvVariable("KDL_SECRET_ID") || "",
  KDL_SIGNATURE: getEnvVariable("KDL_SIGNATURE") || "",
  KDL_USERNAME: getEnvVariable("KDL_USERNAME") || "",
  KDL_PASSWORD: getEnvVariable("KDL_PASSWORD") || "",
  COZE_CLIENT_ID: getEnvVariable("COZE_CLIENT_ID") || "",
  COZE_PUBLIC_KEY_ID: getEnvVariable("COZE_PUBLIC_KEY_ID") || "",
  COZE_SPACE_ID: getEnvVariable("COZE_SPACE_ID") || "",
  COZE_WORKFLOW_ID: getEnvVariable("COZE_WORKFLOW_ID") || "",
};
