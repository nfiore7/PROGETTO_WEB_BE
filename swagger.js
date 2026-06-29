module.exports = function setupSwagger(app) {

  /* ─── Spec OpenAPI ──────────────────────────────────────────────── */
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "DealDone API",
      description:
          "API REST della piattaforma **DealDone** — marketplace che connette clienti e fornitori con Partita IVA.\n\n" +
          "**Stack:** Node.js · Express · MongoDB · Mongoose · JWT\n\n" +
          "**Autenticazione:** Bearer JWT (access token 1h). Effettua il login, copia l'access token e incollalo nel campo **Authorize**.\n\n" +
          "---\n\n" +
          "### Flusso tipico\n" +
          "1. `POST /users/new` — registrazione\n" +
          "2. `POST /users/login` — ottieni access token + refresh token\n" +
          "3. Usa l'access token come `Bearer <token>` nelle chiamate protette 🔒\n" +
          "4. Quando scade (1h), usa `POST /users/refresh` per rinnovarlo\n\n" +
          "### Ruoli\n" +
          "- **customer** — può fare ordini, pagare, commentare servizi acquistati\n" +
          "- **dealer** — può creare/modificare/eliminare i propri servizi, gestire ordini ricevuti\n\n" +
          "> ⚠ Il passaggio `dealer → customer` è **irreversibile via PATCH**: cancella tutti i servizi del dealer e annulla/rimborsa gli ordini in corso.",
      version: "1.2.0",
      contact: { name: "Team DealDone" },
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 8080}`, description: "Backend DealDone (locale)" }],

    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Access token JWT (1h). Ottienilo da POST /users/login." },
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
            balance:   { type: "number",  example: 250.00, description: "Saldo in euro. Si ricarica sommando (non sostituendo) con PATCH /users/{_id}." },
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
            services: { type: "array", items: { type: "string" }, example: ["64f1b2c3d4e5f6a7b8c9d0e2"], description: "Array di _id dei servizi del dealer" },
            orders:   { type: "array", items: { type: "string" }, example: ["64f1b2c3d4e5f6a7b8c9d0e4"], description: "Array di _id degli ordini del customer" },
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
            description: { type: "string", example: "Realizzazione impianto fino a 100mq, quadro CEI 64-8, certificazione IMQ." },
            cost:        { type: "number", example: 1800, description: "Default 0 se non specificato. Min 0." },
            dealer: {
              type: "object",
              description: "Campi popolati: username, name, lastname, city (sia in GET /services che in GET /services/:serviceId).",
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
            user:    { type: "object",  properties: { _id: { type: "string" }, username: { type: "string", example: "chiara_m" } }, description: "Popolato con _id e username dell'autore" },
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
            finalCost:     { type: "number", example: 1800, description: "Snapshot del costo al momento dell'ordine" },
            serviceName:   { type: "string", example: "Impianto elettrico appartamento", description: "Snapshot del nome — persiste anche se il servizio viene eliminato" },
            orderDate:     { type: "string", format: "date-time" },
            orderStatus:   { type: "string", enum: ["in corso", "completato", "annullato"], example: "in corso" },
            paymentStatus: { type: "string", enum: ["da effettuare", "effettuato", "annullato", "rimborsato"], example: "da effettuare" },
          },
        },

        /* ── ERRORE ── */
        Error: {
          type: "object",
          properties: { message: { type: "string", example: "Risorsa non trovata" } },
        },
      },
    },

    tags: [
      { name: "Auth",     description: "Registrazione, login e refresh token JWT" },
      { name: "Users",    description: "CRUD utenti — customer e dealer" },
      { name: "Dealers",  description: "Elenco di tutti i dealer" },
      { name: "Services", description: "Servizi offerti dai dealer" },
      { name: "Comments", description: "Commenti sui servizi (solo chi ha un ordine relativo al servizio)" },
      { name: "Orders",   description: "Ordini, pagamenti, completamento e ricevute PDF" },
    ],

    paths: {

      /* ═══════════════════════════════════════════════════════════════
         AUTH
      ═══════════════════════════════════════════════════════════════ */
      "/users/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description:
              "Autentica l'utente con `username` + `password`.\n\n" +
              "Risponde con:\n" +
              "- **Header** `Authorization: Bearer <accessToken>` (scade in 1h)\n" +
              "- **Body** `{ message, refreshToken }` (scade in 7d)\n\n" +
              "Conserva entrambi: l'access token per le chiamate protette, il refresh token per rinnovarlo.\n\n" +
              "> La password viene verificata con `bcrypt.compare` sull'hash salvato nel DB.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object", required: ["username", "password"],
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
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Login effettuato con successo" }, refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." } } } } },
            },
            401: { description: "Credenziali non valide (username non trovato o password errata)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server",  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rinnova access token",
          description:
              "Emette un nuovo access token (1h) presentando un refresh token valido (7d).\n\n" +
              "Non richiede header `Authorization`. Il refresh token rimane invariato.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object", required: ["refreshToken"],
                  properties: { refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." } },
                },
              },
            },
          },
          responses: {
            200: { description: "Nuovo access token emesso", content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." } } } } } },
            401: { description: "Refresh token mancante nel body", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Refresh token non valido o scaduto", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════════════════════════
         USERS
      ═══════════════════════════════════════════════════════════════ */
      "/users/new": {
        post: {
          tags: ["Auth"],
          summary: "Registra nuovo utente",
          description:
              "Crea un account customer o dealer.\n\n" +
              "- Se `role=dealer` → includere `dealerData` con `pIva`, `profession`, `companyAddress`\n" +
              "- La `password` viene hashata automaticamente via hook pre-save bcrypt\n" +
              "- Risponde con access token nell'header `Authorization` e refresh token nel body\n\n" +
              "Restituisce 409 se l'email o lo username sono già registrati.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password", "name", "lastname", "email", "role"],
                  properties: {
                    username:   { type: "string",  example: "chiara_m" },
                    password:   { type: "string",  example: "Password123!", description: "Minimo 5 caratteri (vincolo schema Mongoose)" },
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
                  customer: {
                    summary: "Registra customer",
                    value: { username: "chiara_m", password: "Password123!", name: "Chiara", lastname: "Marino", email: "chiara.marino@gmail.com", phone: "3478889900", age: 28, city: "Milano", role: "customer" },
                  },
                  dealer: {
                    summary: "Registra dealer",
                    value: { username: "marco_elettrico", password: "Password123!", name: "Marco", lastname: "Rossi", email: "marco.rossi@elettrica.it", phone: "3471234567", age: 42, address: "Via Garibaldi 12", city: "Milano", role: "dealer", dealerData: { pIva: "IT12345678901", companyAddress: "Via Garibaldi 12, Milano", profession: "Elettricista" } },
                  },
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
            409: { description: "Email o username già registrati", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}": {
        get: {
          tags: ["Users"],
          summary: "Dettaglio utente per ID",
          description: "Restituisce il profilo completo di un utente tramite il suo `_id` MongoDB. Non richiede autenticazione. La `password` viene esclusa dalla risposta (`.select(\"-password\")`).",
          parameters: [{ name: "_id", in: "path", required: true, description: "_id MongoDB dell'utente", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
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
              "Aggiorna i campi dell'utente. Solo l'utente stesso può modificare il proprio profilo (controllo `req.user.id !== _id` → 403).\n\n" +
              "Regole speciali:\n\n" +
              "- **`balance`** → viene **sommato** al saldo corrente (es. `balance: 100` aggiunge 100€, non sostituisce)\n" +
              "- **`password`** → viene re-hashata automaticamente (hook pre-save bcrypt)\n" +
              "- **`password` e `balance`** vengono estratti dal body con destructuring e gestiti separatamente; gli altri campi vengono passati direttamente a `user.set(updates)`\n" +
              "- **Downgrade `dealer → customer`** → operazione a cascata irreversibile:\n" +
              "  1. Tutti i servizi del dealer vengono **eliminati**\n" +
              "  2. Gli ordini *in corso* vengono **annullati**\n" +
              "  3. I clienti che avevano già pagato ricevono un **rimborso automatico** (paymentStatus=rimborsato, balance+=finalCost)\n" +
              "  4. `services` e `dealerData` vengono azzerati",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name:     { type: "string",  example: "Marco" },
                    lastname: { type: "string",  example: "Rossi" },
                    city:     { type: "string",  example: "Torino" },
                    address:  { type: "string",  example: "Via Po 3" },
                    phone:    { type: "string",  example: "3471234567" },
                    balance:  { type: "number",  example: 100, description: "Importo da AGGIUNGERE al saldo corrente (non sostitutivo)" },
                    password: { type: "string",  example: "NuovaPassword456!" },
                    role:     { type: "string",  enum: ["customer"], description: "Passare 'customer' per il downgrade dealer→customer (cascade irreversibile)" },
                  },
                },
                examples: {
                  topup:     { summary: "Ricarica +100€",              value: { balance: 100 } },
                  city:      { summary: "Cambia città",                value: { city: "Torino" } },
                  password:  { summary: "Cambia password",             value: { password: "NuovaPassword456!" } },
                  downgrade: { summary: "Dealer → customer (CASCADE)", value: { role: "customer" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Utente aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, newUser: { $ref: "#/components/schemas/UserPublic" } } } } } },
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
              "Elimina definitivamente l'account. Solo l'utente stesso può eliminare il proprio account (controllo `req.user.id !== _id` → 403).\n\n" +
              "**Cascade per dealer:**\n" +
              "1. Trova tutti i servizi del dealer\n" +
              "2. Per ogni ordine *in corso* relativo a quei servizi: rimborsa il customer se aveva già pagato (paymentStatus=rimborsato, balance+=finalCost), poi annulla l'ordine\n" +
              "3. Elimina tutti i servizi del dealer con `Service.deleteMany`\n\n" +
              "**Cascade per customer:**\n" +
              "1. Trova tutti gli ordini *in corso* e *da effettuare*\n" +
              "2. Li annulla (orderStatus=annullato)",
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

      /* ═══════════════════════════════════════════════════════════════
         DEALERS
      ═══════════════════════════════════════════════════════════════ */
      "/dealers": {
        get: {
          tags: ["Dealers"],
          summary: "Lista tutti i dealer",
          description: "Restituisce tutti gli utenti con `role=dealer`. La `password` viene esclusa (`.select(\"-password\")`). Non richiede autenticazione. Restituisce array vuoto `[]` se non ci sono dealer (non ritorna mai 404).",
          responses: {
            200: { description: "Lista dealer (array vuoto se nessun dealer presente)", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════════════════════════
         SERVICES
      ═══════════════════════════════════════════════════════════════ */
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
              "Restituisce il servizio con commenti e dati dealer.\n\n" +
              "- `comments.user` → popolato con `_id` e `username`\n" +
              "- `dealer` → popolato con `username`, `name`, `lastname`, `city`\n\n" +
              "Non richiede autenticazione.",
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
          summary: "Servizi del dealer",
          description: "Restituisce tutti i servizi creati dal dealer identificato da `userId`. **Non richiede autenticazione** — dati pubblici visibili anche dagli utenti non loggati.",
          parameters: [{ name: "_id", in: "path", required: true, description: "userId del dealer (parametro path è :userId nel router)", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          responses: {
            200: { description: "Lista servizi del dealer", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Service" } } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}/services/new": {
        post: {
          tags: ["Services"],
          summary: "Crea servizio 🔒",
          description:
              "Crea un nuovo servizio associato al dealer identificato da `_id`.\n\n" +
              "- Verifica che l'utente esista e abbia `role=dealer` (403 altrimenti)\n" +
              "- Aggiunge automaticamente il `_id` del nuovo servizio all'array `services` del dealer\n" +
              "- Richiede autenticazione JWT",
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
                    description: { type: "string", example: "Realizzazione impianto fino a 100mq, quadro CEI 64-8, certificazione IMQ." },
                    cost:        { type: "number", example: 1800, description: "Opzionale — default 0, min 0" },
                  },
                },
                examples: {
                  elettricista: { summary: "Servizio elettrico",  value: { name: "Impianto elettrico appartamento", description: "Realizzazione impianto fino a 100mq, quadro CEI 64-8.", cost: 1800 } },
                  idraulico:    { summary: "Servizio idraulico",  value: { name: "Sostituzione tubature bagno",       description: "Rifacimento completo tubature bagno 5mq.",          cost: 950 } },
                },
              },
            },
          },
          responses: {
            201: { description: "Servizio creato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Servizio creato con successo" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
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
              "Modifica `name`, `description` e/o `cost` di un servizio esistente.\n\n" +
              "- Verifica che l'utente esista e sia un dealer (403)\n" +
              "- Verifica che il servizio esista (404)\n\n" +
              "> ⚠ Non verifica che il servizio appartenga al dealer autenticato — qualsiasi dealer autenticato può modificare qualsiasi servizio (BOLA).",
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
                    description: { type: "string", example: "Descrizione aggiornata con nuovi dettagli." },
                    cost:        { type: "number", example: 2000 },
                  },
                },
                examples: {
                  costo:    { summary: "Aggiorna solo il prezzo", value: { cost: 2000 } },
                  completo: { summary: "Aggiorna tutto",          value: { name: "Impianto aggiornato", description: "Nuova descrizione.", cost: 2200 } },
                },
              },
            },
          },
          responses: {
            200: { description: "Servizio aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, service: { $ref: "#/components/schemas/Service" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
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
              "- Verifica che il servizio esista (404)\n" +
              "- Verifica che `service.dealer === userId` (403 se il servizio non appartiene al dealer autenticato)\n\n" +
              "> Gli ordini esistenti non vengono eliminati: mantengono `serviceName` come snapshot.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } },
          ],
          responses: {
            200: { description: "Servizio eliminato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Servizio eliminato con successo" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — il servizio non appartiene a questo dealer", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Servizio non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════════════════════════
         COMMENTS
      ═══════════════════════════════════════════════════════════════ */
      "/users/{_id}/services/{serviceId}/comments/new": {
        post: {
          tags: ["Comments"],
          summary: "Aggiungi commento 🔒",
          description:
              "Aggiunge un commento al servizio. Richiede autenticazione JWT.\n\n" +
              "**Vincoli:**\n" +
              "- Il customer deve avere almeno un ordine relativo a quel servizio nell'array `orders` (verificato tramite populate)\n" +
              "- Il dealer non può commentare i **propri** servizi (403)\n\n" +
              "> ⚠ Non verifica che l'ordine sia `completato` — basta che esista un ordine per quel servizio.",
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
                        comment: { type: "string", example: "Ottimo professionista, lavoro impeccabile!" },
                        data:    { type: "string", format: "date-time", description: "Opzionale — default Date.now()" },
                      },
                    },
                  },
                },
                examples: {
                  base:     { summary: "Commento semplice",   value: { comments: { comment: "Ottimo professionista, consigliato!" } } },
                  con_data: { summary: "Con data esplicita",  value: { comments: { comment: "Lavoro preciso e veloce.", data: "2024-06-15T10:30:00.000Z" } } },
                },
              },
            },
          },
          responses: {
            200: { description: "Commento aggiunto con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Commento aggiunto con successo" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — dealer che tenta di commentare il proprio servizio, oppure nessun ordine per questo servizio", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Utente o servizio non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      "/users/{_id}/services/{serviceId}/comments/{commentId}": {
        patch: {
          tags: ["Comments"],
          summary: "Modifica commento 🔒",
          description: "Aggiorna il testo di un commento. Solo l'autore del commento (`comment.user === userId`) può modificarlo. Il servizio viene trovato cercando `comments._id === commentId`.",
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
                    comments: { type: "object", properties: { comment: { type: "string", example: "Commento aggiornato dopo ulteriori riflessioni." } } },
                  },
                },
                examples: {
                  modifica: { summary: "Aggiorna testo", value: { comments: { comment: "Commento aggiornato dopo ulteriori riflessioni." } } },
                },
              },
            },
          },
          responses: {
            200: { description: "Commento modificato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Commento modificato con successo" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non sei autorizzato a modificare questo commento", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Servizio o commento non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Comments"],
          summary: "Elimina commento 🔒",
          description:
              "Rimuove un commento dall'array `comments` del servizio tramite `service.comments.pull(commentId)`.\n\n" +
              "- Trova il servizio cercando `comments._id === commentId`\n" +
              "- Verifica che `comment.user === userId` (solo l'autore può eliminare)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, description: "_id dell'autore del commento", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e5" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } },
            { name: "commentId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e3" } },
          ],
          responses: {
            200: { description: "Commento eliminato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Commento eliminato con successo" } } } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — non sei l'autore del commento", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Commento non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      /* ═══════════════════════════════════════════════════════════════
         ORDERS
      ═══════════════════════════════════════════════════════════════ */
      "/users/{_id}/orders": {
        get: {
          tags: ["Orders"],
          summary: "Ordini dell'utente 🔒",
          description:
              "Restituisce gli ordini filtrati per ruolo tramite query param `type`.\n\n" +
              "> ⚠ Il parametro `_id` nel path viene **ignorato** dal controller: la query usa sempre `req.user.id` (dal JWT). Qualsiasi utente autenticato che chiama questa route vede i **propri** ordini, indipendentemente dall'`_id` nel path.\n\n" +
              "- **`?type=received`** → ordini ricevuti dal dealer (`Order.find({ dealer: req.user.id })`)\n" +
              "  - Popola: `service.name`, `customer.name lastname`\n" +
              "- **Qualsiasi altro valore (o assente)** → ordini effettuati dal customer (`Order.find({ customer: req.user.id })`)\n" +
              "  - Popola: `service.name cost`, `dealer.name lastname`",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",  in: "path",  required: true,  schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } },
            { name: "type", in: "query", required: false,
              description: "Filtra il tipo di ordini. Il controller verifica `if (type === 'received')` — qualsiasi altro valore (incluso `placed`) restituisce gli ordini del customer.\n- `received` → ordini ricevuti dal dealer\n- `placed` (o omesso) → ordini effettuati dal customer",
              schema: { type: "string", enum: ["received", "placed"], example: "placed" } },
          ],
          responses: {
            200: { description: "Lista ordini (array vuoto se nessun ordine)", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } },
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
              "- `customer` viene ricavato automaticamente dal JWT (`req.user.id`)\n" +
              "- `finalCost` e `serviceName` sono **snapshot** del servizio al momento dell'ordine (immutabili anche se il servizio viene modificato o eliminato)\n" +
              "- Il dealer non può ordinare i propri servizi (403)\n" +
              "- Aggiunge automaticamente il `_id` dell'ordine all'array `orders` del customer",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object", required: ["serviceId"],
                  properties: { serviceId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2", description: "_id del servizio da ordinare" } },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Ordine creato con successo",
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Ordine creato con successo" }, order: { $ref: "#/components/schemas/Order" } } } } },
            },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — il dealer non può ordinare il proprio servizio", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
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
              "- Accessibile solo dal dealer o dal customer dell'ordine (403 altrimenti)\n" +
              "- Popola: `service.name cost`, `dealer.username name lastname`, `customer.username name lastname`",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: { description: "Ordine trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — non sei il dealer né il customer dell'ordine", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Ordine non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        patch: {
          tags: ["Orders"],
          summary: "Aggiorna stato ordine 🔒",
          description:
              "Accessibile **solo dai dealer**. I customer ricevono sempre 403 (il pagamento avviene tramite `POST /orders/{_id}/pay`).\n\n" +
              "**Dealer** — aggiorna `orderStatus`:\n" +
              "- `completato` + `paymentStatus=effettuato` → accredita `finalCost` al saldo del dealer (`dealer.balance += finalCost`)\n" +
              "- `completato` + `paymentStatus=da effettuare` → cambia solo lo stato (nessun accredito)\n" +
              "- `annullato` + `paymentStatus=effettuato` → rimborsa il customer (`customer.balance += finalCost`, `paymentStatus=rimborsato`)\n\n" +
              "> Il dealer può completare un ordine non ancora pagato — non c'è un check su `paymentStatus` prima di completare.",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orderStatus: { type: "string", enum: ["in corso", "completato", "annullato"], description: "Solo dealer — campo aggiornabile tramite questo endpoint" },
                  },
                },
                examples: {
                  dealer_completa: { summary: "Dealer: completa ordine", value: { orderStatus: "completato" } },
                  dealer_annulla:  { summary: "Dealer: annulla ordine",  value: { orderStatus: "annullato"  } },
                },
              },
            },
          },
          responses: {
            200: { description: "Ordine aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, order: { $ref: "#/components/schemas/Order" } } } } } },
            400: { description: "Ordine già in quello stato (es. già completato)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — solo il dealer dell'ordine può aggiornare lo stato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
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
              "**Vincoli (tutti verificati lato BE):**\n" +
              "- Solo il customer dell'ordine può pagare (403)\n" +
              "- L'ordine non deve essere annullato (400)\n" +
              "- L'ordine non deve essere già pagato — `paymentStatus !== 'effettuato'` (400)\n" +
              "- Il saldo del customer deve essere ≥ `finalCost` (400)\n\n" +
              "> Il dealer riceve i fondi solo quando clicca *Completa* (`PATCH /orders/{_id}` con `orderStatus=completato`).",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: {
              description: "Pagamento effettuato",
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Pagamento effettuato con successo" }, order: { $ref: "#/components/schemas/Order" }, newBalance: { type: "number", example: 300, description: "Nuovo saldo del customer dopo il pagamento" } } } } },
            },
            400: { description: "Saldo insufficiente / ordine già pagato / ordine annullato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — non sei il customer dell'ordine", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
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
              "Genera e invia la ricevuta di pagamento in formato PDF tramite **pdfkit** (stream in memoria, no file su disco).\n\n" +
              "**Vincoli:**\n" +
              "- Solo il customer dell'ordine può scaricare la ricevuta (403)\n" +
              "- L'ordine deve avere `paymentStatus=effettuato` (403)\n\n" +
              "**Contenuto del PDF:**\n" +
              "- ID ordine e data\n" +
              "- Nome servizio e importo pagato\n" +
              "- Dati fornitore: nome, cognome, username, città, indirizzo\n" +
              "- Dati cliente: nome, cognome, username\n\n" +
              "> Il dealer viene popolato con: `name lastname username city address`.",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: {
              description: "PDF generato — risposta come stream binario",
              headers: {
                "Content-Type":        { schema: { type: "string", example: "application/pdf" } },
                "Content-Disposition": { schema: { type: "string", example: "attachment; filename=\"ricevuta-64f1b2c3d4e5f6a7b8c9d0e4.pdf\"" } },
              },
              content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
            },
            401: { description: "Token mancante o non valido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Non autorizzato — non sei il customer, oppure ordine non ancora pagato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Ordine non trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

    }, // fine paths
  };

  /* ─── Route ────────────────────────────────────────────────────── */

  // Spec JSON grezza
  app.get("/swagger/spec.json", (req, res) => {
    res.json(spec);
  });

  // Swagger UI
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