# Discord.js v14 - LaWallet Bot

Rename .env.example to .env and replace your enviroment vars:

```env
BOT_TOKEN=YOUR_BOT_TOKEN_ID
MONGODB_URI=mongodb+srv://<username>:<password>@<url>/<dbname>

POOL_ADDRESS=pozo@lacrypta.ar
LIGHTNING_DOMAIN=https://lnbot.io

SALT=123456789 // for sk encrypt
```

# Start bot

```
yarn install
```

```
yarn start
```

# Run docker

```
docker-compose up --build
```

# Available commands

```bash
/balance: Devuelve el saldo de tu billetera.
/donar monto: <integer>: Realiza donaciones al pozo de la crypta.
/pagar bolt11: <string>: Paga una factura de lightning network
/recargar monto: <integer> : Recarga tu cuenta de lightning network con una factura
/retirar address: <string> usos: <integer> : Retira satoshis a una cuenta externa a discord
/solicitar monto: <integer> descripcion: <string> : Solicitar que te paguen una factura
/regalar monto: <integer> usos: <integer>: Crea una factura abierta que cualquier usuario puede reclamar
/top tipo: <"pozo" | "comunidad"> : Devuelve el ranking TOP 10 usuarios que enviaron sats
/zap user: <user> monto: <integer> message: <string>: Regala sats a un usuario en discord
/registrar-walias nombre: <string>: Registra un lud16/nip05 nombre@lnbot.io (o el lightning domain correspondiente)
```
