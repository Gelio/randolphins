declare module "*.svg" {
  const fileUrl: string;
  export default fileUrl;
}

declare module "*.module.css" {
  const classNames: Record<string, string>;
  export default classNames;
}

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_UNSPLASH_PROXY_URL?: string;

    /**
     * @see https://create-react-app.dev/docs/adding-custom-environment-variables/
     */
    NODE_ENV: "test" | "development" | "production";
  }
}
