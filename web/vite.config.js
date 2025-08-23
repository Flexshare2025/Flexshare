import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					chrome: '49',
					ios: '10',
				},
			},
		],
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	plugins: [react()],
	server: {
		host: '0.0.0.0',
	},
})
