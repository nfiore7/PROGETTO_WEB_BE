module.exports = function setupSwagger(app) {

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "DealDone API",
      description:
          "API REST della piattaforma **DealDone** — marketplace che connette clienti e fornitori con Partita IVA.\n\n" +
          "**Stack:** Node.js · Express · MongoDB · Mongoose · JWT · PDFKit\n\n" +
          "**Autenticazione:** Bearer JWT.\n\n" +
          "- Access token: scade in **1 minuto** (generato da `utils/generateTokens.js`)\n" +
          "- Refresh token: scade in **7 giorni**\n\n" +
          "Effettua il login, copia l'access token e incollalo nel campo **Authorize**.\n\n" +
          "---\n\n" +
          "### Flusso tipico\n" +
          "1. `POST /users/new` — registrazione\n" +
          "2. `POST /users/login` — ottieni access token (header) + refresh token (body)\n" +
          "3. Usa l'access token come `Bearer <token>` nelle chiamate protette 🔒\n" +
          "4. Quando scade (1 min), usa `POST /users/refresh` per rinnovarlo\n\n" +
          "### Ruoli\n" +
          "- **customer** — può fare ordini, pagare, commentare servizi acquistati\n" +
          "- **dealer** — può creare/modificare/eliminare i propri servizi, gestire ordini ricevuti\n\n" +
          "> ⚠ Il passaggio `dealer → customer` è **irreversibile**: cancella tutti i servizi del dealer e annulla/rimborsa gli ordini in corso.",
      version: "2.0.0",
      contact: { name: "Team DealDone" },
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 8080}`, description: "Backend DealDone (locale)" }
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token JWT — scade in 1 minuto. Ottienilo da POST /users/login o POST /users/new."
        },
      },
      schemas: {

        /* ── UTENTE ── */
        UserPublic: {
          type: "object",
          properties: {
            _id:       { type: "string",  example: "64f1b2c3d4e5f6a7b8c9d0e1" },
            username:  { type: "string",  example: "marco_elettrico" },
            name:      { type: "string",  example: "Marco" },
            lastname:  { type: "string",  example: "Rossi" },
            email:     { type: "string",  example: "marco.rossi@elettrica.it" },
            phone:     { type: "string",  example: "3471234567" },
            age:       { type: "integer", example: 42 },
            address:   { type: "string",  example: "Via Garibaldi 12" },
            city:      { type: "string",  example: "Milano" },
            balance:   { type: "number",  example: 250.00, description: "Saldo in euro. Aggiornato sommando (non sostituendo) con PATCH." },
            role:      { type: "string",  enum: ["customer", "dealer"], example: "dealer" },
            dealerData: {
              type: "object",
              description: "Presente solo se role=dealer",
              properties: {
                pIva:           { type: "string", example: "IT12345678901" },
                companyAddress: { type: "string", example: "Via Garibaldi 12, Milano" },
                profession:     { type: "string", example: "ELETTRICISTA" },
              },
            },
            services:  { type: "array", items: { type: "string" }, description: "Array di _id dei servizi (solo dealer)" },
            orders:    { type: "array", items: { type: "string" }, description: "Array di _id degli ordini (solo customer)" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        /* ── SERVIZIO ── */
        Service: {
          type: "object",
          properties: {
            _id:         { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" },
            name:        { type: "string", example: "Impianto elettrico appartamento" },
            description: { type: "string", example: "Realizzazione impianto fino a 100mq, certificazione IMQ." },
            cost:        { type: "number", example: 1800, description: "Default 0, min 0." },
            dealer: {
              type: "object",
              description: "Popolato con username, name, lastname, city in tutte le GET.",
              properties: {
                _id:      { type: "string" },
                username: { type: "string", example: "marco_elettrico" },
                name:     { type: "string", example: "Marco" },
                lastname: { type: "string", example: "Rossi" },
                city:     { type: "string", example: "Milano" },
              },
            },
            comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
          },
        },

        /* ── COMMENTO ── */
        Comment: {
          type: "object",
          properties: {
            _id:     { type: "string",  example: "64f1b2c3d4e5f6a7b8c9d0e3" },
            user:    {
              type: "object",
              description: "Popolato con _id e username dell'autore",
              properties: {
                _id:      { type: "string" },
                username: { type: "string", example: "chiara_m" }
              }
            },
            comment: { type: "string",  example: "Ottimo professionista, lavoro impeccabile!" },
            data:    { type: "string",  format: "date-time", example: "2024-06-15T10:30:00.000Z" },
          },
        },

        /* ── ORDINE ── */
        Order: {
          type: "object",
          properties: {
            _id:           { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" },
            dealer:        { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1", description: "ObjectId del dealer" },
            customer:      { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e5", description: "ObjectId del customer" },
            service:       { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2", description: "ObjectId del servizio (null se eliminato)" },
            finalCost:     { type: "number", example: 1800, description: "Snapshot del costo al momento dell'ordine — immutabile" },
            serviceName:   { type: "string", example: "Impianto elettrico", description: "Snapshot del nome — persiste anche se il servizio viene eliminato" },
            orderDate:     { type: "string", format: "date-time" },
            orderStatus:   { type: "string", enum: ["in corso", "completato", "annullato"], example: "in corso" },
            paymentStatus: { type: "string", enum: ["da effettuare", "effettuato", "annullato", "rimborsato"], example: "da effettuare" },
          },
        },

        /* ── ERRORE ── */
        Error: {
          type: "object",
          properties: { message: { type: "string", example: "Messaggio di errore" } },
        },
      },
    },

    tags: [
      { name: "Auth",     description: "Registrazione, login e refresh token JWT" },
      { name: "Users",    description: "CRUD utenti — customer e dealer" },
      { name: "Dealers",  description: "Lista dealer" },
      { name: "Services", description: "Servizi offerti dai dealer" },
      { name: "Comments", description: "Commenti sui servizi" },
      { name: "Orders",   description: "Ordini, pagamenti e ricevute PDF" },
    ],

    paths: {

      /* ═══════════════════════════════════════════
         AUTH
      ═══════════════════════════════════════════ */

      "/users/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description:
              "Autentica l'utente con `username` + `password`.\n\n" +
              "Risposta:\n" +
              "- **Header** `Authorization: Bearer <accessToken>` — scade in **1 minuto**\n" +
              "- **Body** `{ message, refreshToken }` — scade in 7 giorni\n\n" +
              "La password è verificata con `bcrypt.compare` sull'hash salvato in DB.\n\n" +
              "> Implementato in `authController.js` tramite la utility `generateTokens()`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string", example: "marco_elettrico" },
                    password: { type: "string", example: "Password123!" },
                  },
                },
                examples: {
                  dealer:   { summary: "Login dealer",   value: { username: "marco_elettrico", password: "Password123!" } },
                  customer: { summary: "Login customer", value: { username: "chiara_m",        password: "Password123!" } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login riuscito",
              headers: { Authorization: { schema: { type: "string", example: "Bearer eyJhbGciOiJIUzI1NiJ9..." } } },
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Login effettuato con successo" }, refreshToken: { type: "string" } } } } },
            },
            401: { description: "Username non trovato o password errata", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rinnova access token",
          description:
              "Emette un nuovo access token (1 minuto) presentando un refresh token valido (7 giorni).\n\n" +
              "Non richiede header `Authorization`. Il refresh token rimane invariato.\n\n" +
              "> Implementato in `authController.js`. Usa `generateTokens()` e restituisce solo `accessToken`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: { refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Nuovo access token emesso",
              content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." } } } } },
            },
            401: { description: "Refresh token mancante nel body", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Refresh token non valido o scaduto", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════
         USERS
      ═══════════════════════════════════════════ */

      "/users/new": {
        post: {
          tags: ["Auth"],
          summary: "Registra nuovo utente",
          description:
              "Crea un account customer o dealer.\n\n" +
              "- La password viene hashata via hook `pre('save')` bcrypt (salt 10)\n" +
              "- Password minima: **5 caratteri** (vincolo `minlength` su schema Mongoose)\n" +
              "- Se `role=dealer` → includere `dealerData` con `pIva`, `profession`, `companyAddress`\n" +
              "- Risponde con access token nell'header `Authorization` e refresh token nel body\n" +
              "- Restituisce 409 se email o username già esistenti\n" +
              "- Restituisce 400 se la password non rispetta il minlength (ValidationError Mongoose)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password", "name", "lastname", "email", "role"],
                  properties: {
                    username:   { type: "string",  example: "chiara_m" },
                    password:   { type: "string",  example: "Password123!", description: "Minimo 5 caratteri" },
                    name:       { type: "string",  example: "Chiara" },
                    lastname:   { type: "string",  example: "Marino" },
                    email:      { type: "string",  format: "email", example: "chiara.marino@gmail.com" },
                    phone:      { type: "string",  example: "3478889900", description: "Opzionale" },
                    age:        { type: "integer", example: 28, description: "Opzionale" },
                    address:    { type: "string",  example: "Via Roma 5", description: "Opzionale" },
                    city:       { type: "string",  example: "Milano", description: "Opzionale" },
                    role:       { type: "string",  enum: ["customer", "dealer"], example: "customer", description: "Default: customer" },
                    dealerData: {
                      type: "object",
                      description: "Obbligatorio se role=dealer",
                      properties: {
                        pIva:           { type: "string", example: "IT12345678901" },
                        companyAddress: { type: "string", example: "Via Garibaldi 12, Milano" },
                        profession:     { type: "string", example: "Elettricista" },
                      },
                    },
                  },
                },
                examples: {
                  customer: { summary: "Registra customer", value: { username: "chiara_m", password: "Password123!", name: "Chiara", lastname: "Marino", email: "chiara.marino@gmail.com", city: "Milano", role: "customer" } },
                  dealer:   { summary: "Registra dealer",   value: { username: "marco_elettrico", password: "Password123!", name: "Marco", lastname: "Rossi", email: "marco.rossi@elettrica.it", city: "Milano", role: "dealer", dealerData: { pIva: "IT12345678901", companyAddress: "Via Garibaldi 12, Milano", profession: "Elettricista" } } },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Utente registrato — access token nell'header Authorization",
              headers: { Authorization: { schema: { type: "string", example: "Bearer eyJ..." } } },
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Utente registrato" }, refreshToken: { type: "string" } } } } },
            },
            400: { description: "Validazione fallita — es. password troppo corta", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            409: { description: "Email o username già registrati", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}": {
        get: {
          tags: ["Users"],
          summary: "Dettaglio utente",
          description: "Restituisce il profilo di un utente per `_id` MongoDB. Non richiede autenticazione. La `password` è esclusa dalla risposta (`.select('-password')`).",
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          responses: {
            200: { description: "Utente trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/UserPublic" } } } },
            404: { description: "Utente inesistente", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },

        patch: {
          tags: ["Users"],
          summary: "Aggiorna utente 🔒",
          description:
              "Aggiorna i campi dell'utente. Solo l'utente stesso può modificarsi (`req.user.id !== _id` → 403).\n\n" +
              "**Cambio password:**\n" +
              "- Richiede sia `oldPassword` che `newPassword`\n" +
              "- Verifica la vecchia password con `bcrypt.compare` prima di aggiornare\n" +
              "- Restituisce 400 se `oldPassword` non è corretta\n" +
              "- La nuova password deve rispettare il `minlength: 5` dello schema → 400 se troppo corta\n\n" +
              "**Ricarica saldo:**\n" +
              "- `balance` viene **sommato** al saldo corrente (es. `balance: 100` aggiunge 100€)\n\n" +
              "**Downgrade `dealer → customer`** (cascade irreversibile):\n" +
              "1. Tutti gli ordini *in corso* dei servizi del dealer vengono annullati\n" +
              "2. I customer che avevano pagato ricevono rimborso automatico (`balance += finalCost`, `paymentStatus=rimborsato`)\n" +
              "3. Tutti i servizi del dealer vengono eliminati con `Service.deleteMany`\n" +
              "4. `services` e `dealerData` vengono azzerati",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name:        { type: "string",  example: "Marco" },
                    lastname:    { type: "string",  example: "Rossi" },
                    city:        { type: "string",  example: "Torino" },
                    address:     { type: "string",  example: "Via Po 3" },
                    phone:       { type: "string",  example: "3471234567" },
                    balance:     { type: "number",  example: 100, description: "Importo da AGGIUNGERE al saldo corrente" },
                    oldPassword: { type: "string",  example: "VecchiaPassword123!", description: "Obbligatorio se si cambia la password" },
                    newPassword: { type: "string",  example: "NuovaPassword456!", description: "Obbligatorio se si cambia la password" },
                    role:        { type: "string",  enum: ["customer"], description: "Downgrade dealer→customer — cascade irreversibile" },
                  },
                },
                examples: {
                  topup:     { summary: "Ricarica +100€",              value: { balance: 100 } },
                  city:      { summary: "Cambia città",                value: { city: "Torino" } },
                  password:  { summary: "Cambia password",             value: { oldPassword: "VecchiaPassword123!", newPassword: "NuovaPassword456!" } },
                  downgrade: { summary: "Dealer → customer (CASCADE)", value: { role: "customer" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Utente aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, newUser: { $ref: "#/components/schemas/UserPublic" } } } } } },
            400: { description: "Vecchia password errata, o nuova password non valida (minlength)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — stai tentando di modificare un altro utente", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Utente non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },

        delete: {
          tags: ["Users"],
          summary: "Elimina utente 🔒",
          description:
              "Elimina definitivamente l'account. Solo l'utente stesso può eliminarsi (`req.user.id !== _id` → 403).\n\n" +
              "**Cascade dealer** (tramite funzione `cancelDealerOrders`):\n" +
              "1. Trova tutti i servizi del dealer\n" +
              "2. Per ogni ordine *in corso*: rimborsa il customer se aveva pagato, poi annulla l'ordine\n" +
              "3. Elimina tutti i servizi con `Service.deleteMany`\n\n" +
              "**Cascade customer:**\n" +
              "1. Trova ordini *in corso* con `paymentStatus=da effettuare`\n" +
              "2. Li imposta come `annullato`",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          responses: {
            200: { description: "Utente eliminato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Utente eliminato con successo" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — stai tentando di eliminare un altro utente", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Utente non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════
         DEALERS
      ═══════════════════════════════════════════ */

      "/dealers": {
        get: {
          tags: ["Dealers"],
          summary: "Lista tutti i dealer",
          description: "Restituisce tutti gli utenti con `role=dealer`. Password esclusa (`.select('-password')`). Non richiede autenticazione. Restituisce array vuoto `[]` se non ci sono dealer — non ritorna mai 404.",
          responses: {
            200: { description: "Lista dealer (può essere array vuoto)", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════
         SERVICES
      ═══════════════════════════════════════════ */

      "/services": {
        get: {
          tags: ["Services"],
          summary: "Lista tutti i servizi",
          description: "Popola `dealer` con: `name`, `lastname`, `username`, `city`. Non richiede autenticazione.",
          responses: {
            200: { description: "Lista servizi", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Service" } } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/services/{serviceId}": {
        get: {
          tags: ["Services"],
          summary: "Dettaglio servizio",
          description:
              "Restituisce il servizio con commenti e dati dealer. Non richiede autenticazione.\n\n" +
              "- `comments.user` → popolato con `_id` e `username`\n" +
              "- `dealer` → popolato con `username`, `name`, `lastname`, `city`",
          parameters: [{ name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } }],
          responses: {
            200: { description: "Servizio trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Service" } } } },
            404: { description: "Servizio non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}/services": {
        get: {
          tags: ["Services"],
          summary: "Servizi di un dealer",
          description: "Restituisce tutti i servizi del dealer identificato da `userId` nel path. **Non richiede autenticazione** — dati pubblici visibili anche agli utenti non loggati.",
          parameters: [{ name: "_id", in: "path", required: true, description: "userId del dealer (internamente usato come :userId nel router)", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          responses: {
            200: { description: "Lista servizi del dealer (può essere array vuoto)", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Service" } } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}/services/new": {
        post: {
          tags: ["Services"],
          summary: "Crea servizio 🔒",
          description:
              "Crea un nuovo servizio per il dealer `_id`.\n\n" +
              "**Verifiche (in ordine):**\n" +
              "1. Utente esiste (404)\n" +
              "2. `req.user.id === req.params._id` — il token JWT deve corrispondere al path `_id` (401)\n" +
              "3. `user.role === 'dealer'` (403)\n\n" +
              "Aggiunge automaticamente il `_id` del nuovo servizio all'array `services` del dealer.",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, description: "_id del dealer", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "description"],
                  properties: {
                    name:        { type: "string", example: "Impianto elettrico appartamento" },
                    description: { type: "string", example: "Realizzazione impianto fino a 100mq, quadro CEI 64-8." },
                    cost:        { type: "number", example: 1800, description: "Opzionale — default 0, min 0" },
                  },
                },
                examples: {
                  elettricista: { summary: "Servizio elettrico", value: { name: "Impianto elettrico appartamento", description: "Realizzazione impianto fino a 100mq.", cost: 1800 } },
                  idraulico:    { summary: "Servizio idraulico", value: { name: "Sostituzione tubature bagno",      description: "Rifacimento completo tubature bagno 5mq.", cost: 950 } },
                },
              },
            },
          },
          responses: {
            201: { description: "Servizio creato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Servizio creato con successo" } } } } } },
            401: { description: "Token mancante/non valido, oppure JWT user ≠ path _id", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "L'utente non è un dealer", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Utente non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}/services/{serviceId}": {
        patch: {
          tags: ["Services"],
          summary: "Aggiorna servizio 🔒",
          description:
              "Modifica `name`, `description` e/o `cost` di un servizio.\n\n" +
              "**Verifiche (in ordine):**\n" +
              "1. Utente esiste e ha `role=dealer` (404 / 403)\n" +
              "2. Servizio esiste (404)\n" +
              "3. `service.dealer === req.user.id` — solo il proprietario può modificarlo (401)\n\n" +
              "> BOLA risolto: il check di ownership confronta `service.dealer` con il JWT `req.user.id`, non con il path `_id`.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name:        { type: "string", example: "Impianto elettrico aggiornato" },
                    description: { type: "string", example: "Descrizione aggiornata." },
                    cost:        { type: "number", example: 2000 },
                  },
                },
                examples: {
                  costo:    { summary: "Solo prezzo",  value: { cost: 2000 } },
                  completo: { summary: "Tutto",        value: { name: "Impianto aggiornato", description: "Nuova descrizione.", cost: 2200 } },
                },
              },
            },
          },
          responses: {
            200: { description: "Servizio aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, service: { $ref: "#/components/schemas/Service" } } } } } },
            401: { description: "Token non valido, oppure il servizio non appartiene a questo dealer (JWT)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Utente non è un dealer", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Utente o servizio non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },

        delete: {
          tags: ["Services"],
          summary: "Elimina servizio 🔒",
          description:
              "Elimina il servizio e rimuove il suo `_id` dall'array `services` del dealer con `$pull`.\n\n" +
              "**Verifiche (in ordine):**\n" +
              "1. `userId === req.user.id` — JWT deve corrispondere al path `_id` (401)\n" +
              "2. Servizio esiste (404)\n" +
              "3. `service.dealer === userId` — solo il proprietario può eliminare (403)\n\n" +
              "> Gli ordini esistenti non vengono eliminati: mantengono `serviceName` come snapshot.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } },
          ],
          responses: {
            200: { description: "Servizio eliminato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Servizio eliminato con successo" } } } } } },
            401: { description: "Token non valido, oppure JWT user ≠ path _id", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Il servizio non appartiene a questo dealer (path _id)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Servizio non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════
         COMMENTS
      ═══════════════════════════════════════════ */

      "/users/{_id}/services/{serviceId}/comments/new": {
        post: {
          tags: ["Comments"],
          summary: "Aggiungi commento 🔒",
          description:
              "Aggiunge un commento al servizio.\n\n" +
              "**Verifiche (in ordine):**\n" +
              "1. `req.user.id === userId` — JWT deve corrispondere al path `_id` (401)\n" +
              "2. Utente e servizio esistono (404)\n" +
              "3. L'utente ha almeno un ordine per questo servizio nell'array `orders` (403)\n" +
              "4. Il dealer non può commentare i propri servizi (403)\n\n" +
              "> ⚠ Non verifica che l'ordine sia in stato `completato` — basta che esista un ordine per quel servizio.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, description: "_id del customer che commenta", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e5" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    comments: {
                      type: "object",
                      properties: {
                        comment: { type: "string", example: "Ottimo professionista!" },
                        data:    { type: "string", format: "date-time", description: "Opzionale — default Date.now()" },
                      },
                    },
                  },
                },
                examples: {
                  base:     { summary: "Commento semplice",  value: { comments: { comment: "Ottimo professionista, consigliato!" } } },
                  con_data: { summary: "Con data esplicita", value: { comments: { comment: "Lavoro preciso.", data: "2024-06-15T10:30:00.000Z" } } },
                },
              },
            },
          },
          responses: {
            201: { description: "Commento aggiunto con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Commento aggiunto con successo" } } } } } },
            401: { description: "Token non valido, oppure JWT user ≠ path _id", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Nessun ordine per questo servizio, oppure dealer che commenta il proprio servizio", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Utente o servizio non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}/services/{serviceId}/comments/{commentId}": {
        patch: {
          tags: ["Comments"],
          summary: "Modifica commento 🔒",
          description:
              "Aggiorna il testo di un commento.\n\n" +
              "**Verifiche (in ordine):**\n" +
              "1. `req.user.id === userId` — JWT deve corrispondere al path `_id` (401)\n" +
              "2. Servizio trovato tramite `comments._id === commentId` (404)\n" +
              "3. `comment.user === userId` — solo l'autore può modificare (403)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, description: "_id dell'autore del commento", schema: { type: "string" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
            { name: "commentId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e3" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    comments: { type: "object", properties: { comment: { type: "string", example: "Commento aggiornato." } } },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Commento modificato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Commento modificato con successo" } } } } } },
            401: { description: "Token non valido, oppure JWT user ≠ path _id", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non sei l'autore del commento", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Servizio o commento non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },

        delete: {
          tags: ["Comments"],
          summary: "Elimina commento 🔒",
          description:
              "Rimuove un commento con `service.comments.pull(commentId)`.\n\n" +
              "**Verifiche (in ordine):**\n" +
              "1. `userId === req.user.id` — JWT deve corrispondere al path `_id` (401)\n" +
              "2. Servizio trovato tramite `comments._id === commentId` (404)\n" +
              "3. `comment.user === userId` — solo l'autore può eliminare (403)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, description: "_id dell'autore del commento", schema: { type: "string" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
            { name: "commentId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e3" } },
          ],
          responses: {
            200: { description: "Commento eliminato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Commento eliminato con successo" } } } } } },
            401: { description: "Token non valido, oppure JWT user ≠ path _id", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non sei l'autore del commento", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Commento non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════
         ORDERS
      ═══════════════════════════════════════════ */

      "/users/{_id}/orders": {
        get: {
          tags: ["Orders"],
          summary: "Ordini dell'utente 🔒",
          description:
              "Restituisce gli ordini filtrati per tipo.\n\n" +
              "> ⚠ Il parametro `_id` nel path viene **ignorato** — il controller usa sempre `req.user.id` dal JWT. Qualsiasi utente autenticato vede sempre i propri ordini.\n\n" +
              "- **`?type=received`** → ordini ricevuti dal dealer (`Order.find({ dealer: req.user.id })`)\n" +
              "  - Popola: `service.name`, `customer.name lastname`\n" +
              "- **`?type=placed`** (o qualsiasi altro valore, o assente) → ordini effettuati dal customer (`Order.find({ customer: req.user.id })`)\n" +
              "  - Popola: `service.name cost`, `dealer.name lastname`",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",  in: "path",  required: true,  schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } },
            { name: "type", in: "query", required: false,
              description: "`received` = ordini dealer. `placed` (o assente) = ordini customer. Il FE usa `placed` per gli ordini customer.",
              schema: { type: "string", enum: ["received", "placed"], example: "placed" } },
          ],
          responses: {
            200: { description: "Lista ordini (può essere array vuoto)", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/orders/checkout": {
        post: {
          tags: ["Orders"],
          summary: "Crea ordine 🔒",
          description:
              "Crea un nuovo ordine per un servizio.\n\n" +
              "- `customer` ricavato dal JWT (`req.user.id`)\n" +
              "- `finalCost` e `serviceName` sono **snapshot** del servizio al momento dell'ordine — immutabili anche se il servizio viene modificato/eliminato\n" +
              "- Il dealer non può ordinare i propri servizi (403)\n" +
              "- Aggiunge il `_id` dell'ordine all'array `orders` del customer",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["serviceId"],
                  properties: { serviceId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2", description: "_id del servizio da ordinare" } },
                },
              },
            },
          },
          responses: {
            201: { description: "Ordine creato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Ordine creato con successo" }, order: { $ref: "#/components/schemas/Order" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Il dealer non può ordinare il proprio servizio", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Servizio non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/orders/{_id}": {
        get: {
          tags: ["Orders"],
          summary: "Dettaglio ordine 🔒",
          description:
              "Restituisce un ordine completo con populate.\n\n" +
              "- Accessibile solo da dealer o customer dell'ordine (403 altrimenti)\n" +
              "- Popola: `service.name cost`, `dealer.username name lastname`, `customer.username name lastname`",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: { description: "Ordine trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non sei il dealer né il customer dell'ordine", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Ordine non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },

        patch: {
          tags: ["Orders"],
          summary: "Aggiorna stato ordine 🔒",
          description:
              "Accessibile **solo dai dealer**. I customer ricevono sempre 403.\n\n" +
              "- Verifica che l'ordine appartenga al dealer autenticato (403)\n\n" +
              "**Logica per `orderStatus`:**\n" +
              "- `completato` → se già completato: 400. Se `paymentStatus=effettuato`: accredita `finalCost` al dealer (`dealer.balance += finalCost`)\n" +
              "- `annullato` + `paymentStatus=effettuato` → rimborsa customer (`customer.balance += finalCost`, `paymentStatus=rimborsato`)\n\n" +
              "> Il pagamento reale avviene tramite `POST /orders/{_id}/pay`, non qui.",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orderStatus: { type: "string", enum: ["in corso", "completato", "annullato"] },
                  },
                },
                examples: {
                  completa: { summary: "Completa ordine", value: { orderStatus: "completato" } },
                  annulla:  { summary: "Annulla ordine",  value: { orderStatus: "annullato"  } },
                },
              },
            },
          },
          responses: {
            200: { description: "Ordine aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, order: { $ref: "#/components/schemas/Order" } } } } } },
            400: { description: "Ordine già nello stato richiesto (es. già completato)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non sei il dealer dell'ordine, oppure sei un customer", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Ordine, dealer o customer non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/orders/{_id}/pay": {
        post: {
          tags: ["Orders"],
          summary: "Paga ordine 🔒",
          description:
              "Esegue il pagamento scalando `finalCost` dal saldo del customer.\n\n" +
              "**Vincoli verificati lato BE:**\n" +
              "1. Solo il customer dell'ordine può pagare (403)\n" +
              "2. Ordine non annullato (400)\n" +
              "3. Ordine non già pagato — `paymentStatus !== 'effettuato'` (400)\n" +
              "4. `customer.balance >= finalCost` (400)\n\n" +
              "> Il dealer riceve i fondi solo quando clicca *Completa* (`PATCH /orders/{_id}` con `orderStatus=completato`).",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: {
              description: "Pagamento effettuato",
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Pagamento effettuato con successo" }, order: { $ref: "#/components/schemas/Order" }, newBalance: { type: "number", example: 300, description: "Saldo del customer dopo il pagamento" } } } } },
            },
            400: { description: "Saldo insufficiente / ordine già pagato / ordine annullato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non sei il customer dell'ordine", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Ordine o utente non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/orders/{_id}/pdf": {
        get: {
          tags: ["Orders"],
          summary: "Scarica ricevuta PDF 🔒",
          description:
              "Genera e invia la ricevuta in PDF via **PDFKit** (stream diretto sulla risposta HTTP, nessun file su disco).\n\n" +
              "**Vincoli:**\n" +
              "- Solo il customer dell'ordine (403)\n" +
              "- `paymentStatus === 'effettuato'` (403)\n\n" +
              "**Contenuto del PDF:**\n" +
              "- ID ordine e data\n" +
              "- Nome servizio e importo pagato\n" +
              "- Fornitore: nome, cognome, username, città, indirizzo\n" +
              "- Cliente: nome, cognome, username\n\n" +
              "Dealer popolato con: `name lastname username city address`.",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: {
              description: "PDF generato — stream binario",
              headers: {
                "Content-Type":        { schema: { type: "string", example: "application/pdf" } },
                "Content-Disposition": { schema: { type: "string", example: "attachment; filename=\"ricevuta-64f1b2c3d4e5f6a7b8c9d0e4.pdf\"" } },
              },
              content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
            },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non sei il customer, oppure ordine non ancora pagato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Ordine non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

    }, // fine paths
  };

  /* ─── Routes Swagger UI ─────────────────────────────────────────── */

  app.get("/swagger/spec.json", (req, res) => res.json(spec));

  app.get("/swagger", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <title>DealDone API — Swagger</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css"/>
  <style>
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { background: #1a1a2e; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #1BAF6E; }
  </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
<script>
  SwaggerUIBundle({
    url: "/swagger/spec.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout: "BaseLayout",
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: "list",
    persistAuthorization: true,
    filter: true,
    tryItOutEnabled: true
  });
</script>
</body>
</html>`);
  });

};