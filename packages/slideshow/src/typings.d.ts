declare module "*.svg" {
  const fileUrl: string;
  export default fileUrl;
}

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_UNSPLASH_PROXY_URL?: string;
  }
}
