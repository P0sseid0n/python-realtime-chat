/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** URL do servidor WebSocket. Padrão: `ws://<host da página>:3000` */
	readonly VITE_WS_URL?: string
}
