# Discord.js v14 - LaWallet Bot

Rename .env.example to .env and replace your enviroment vars:

```
CLIENT_TOKEN=YOUR_BOT_TOKEN_ID
MONGODB_URI=MONGODB_URI=mongodb+srv://<username>:<password>@<url>/<dbname>
POOL_ADDRESS=pozo@lacrypta.ar
SALT=123456789 // for sk encrypt
```

# Available commands

```
/balance: Devuelve el saldo de tu billetera.
/donar monto: <integer>: Realiza donaciones al pozo de la crypta.
/pagar bolt11: <string>: Paga una factura de lightning network
/recargar monto: <integer> : Recarga tu cuenta de lightning network con una factura
/retirar address: <string> usos: <integer> : Retira satoshis a una cuenta externa a discord
/top tipo: <"pozo" | "comunidad"> : Devuelve el ranking TOP 10 usuarios que enviaron sats
/zap user: <user> monto: <integer> message: <string>: Regala sats a un usuario en discord
```

# Start bot

```
yarn install & yarn start
```

# TO - DO

- [ ] Solicitar un pago (/solicitar)
      Schema:
      sk
      owner (discord_id)
      faucetId
      amount
      uses
      maxUses
      claimers

      Crear faucet genera una nueva cuenta, le quita los fondos al owner y los envia a esta nueva cuenta.
      En cada reclamo, vamos a ir aumentando uses siempre asegurandonos que no supere maxUses.
      Se transfieren los sats una única vez a cada usuario desde la sk del faucet.

- [ ] Faucet (/regalar + claim)
