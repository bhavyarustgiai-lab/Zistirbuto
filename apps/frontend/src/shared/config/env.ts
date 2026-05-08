const importMetaEnv = import.meta.env;

export const env = {
  apiBaseUrl: importMetaEnv?.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
  useMocks: (importMetaEnv?.VITE_USE_MOCKS ?? "false") === "true",
};
