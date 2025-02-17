export interface EnvironmentFirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  storageBucket: string;
  projectId: string;
  messagingSenderId: string;
  storageUrl: string;
  functionsUrl: string;
  appId: string;
}

export interface EnvironmentTenorConfig {
  url: string;
  key: string;
}

export interface EnvironmentUnsplashConfig {
  url: string;
  cdn: string;
}

export interface EnvironmentGoogleConfig {
  fontsUrl: string;
}

export interface EnvironmentDeckDeckGoConfig {
  website: string;
  globalAssetsUrl: string;
  pollUrl: string;
  apiUrl?: string;
  socketUrl: string;
}

export interface EnvironmentAppConfig {
  mock: boolean;
}

export interface EnvironmentCloudApi {
  cdn: string;
}

export interface EnvironmentCloudSignIn {
  cdn: string;
  tag: string;
}

export interface EnvironmentCloud {
  api: EnvironmentCloudApi;
  signIn: EnvironmentCloudSignIn;
}

export interface EnvironmentConfig {
  app: EnvironmentAppConfig;
  deckdeckgo: EnvironmentDeckDeckGoConfig;
  cloud?: EnvironmentCloud;
  firebase?: EnvironmentFirebaseConfig;
  tenor?: EnvironmentTenorConfig;
  unsplash?: EnvironmentUnsplashConfig;
  google: EnvironmentGoogleConfig;
}

export function setupConfig(config: EnvironmentConfig) {
  if (!window) {
    return;
  }

  const win = window as any;
  const DeckGo = win.DeckGo;

  if (DeckGo && DeckGo.config && DeckGo.config.constructor.name !== 'Object') {
    console.error('DeckDeckGo config was already initialized');
    return;
  }

  win.DeckGo = win.DeckGo || {};
  win.DeckGo.config = {
    ...win.DeckGo.config,
    ...config
  };

  return win.DeckGo.config;
}
