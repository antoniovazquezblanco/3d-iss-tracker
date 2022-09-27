import { Configuration } from 'webpack'
import 'webpack-dev-server'

const config: Configuration = {
   mode: 'development',
   entry: './src/main.ts',
   resolve: {
      extensions: ['.ts', '.js']
   },
   module: {
      rules: [{
         test: /\.ts$/,
         use: 'ts-loader',
         exclude: /node_modules/
      }]
   },
   devServer: {
      static: '.',
      port: 9000,
      devMiddleware: { writeToDisk: true }
   }
}

export default config
