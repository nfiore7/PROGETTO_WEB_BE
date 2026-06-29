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
      version: "1.1.0",
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
            balance:   { type: "number",  example: 250.00, description: "Saldo in euro. Si ricarica sommando (non sostituendo) con PATCH." },
            role:      { type: "string",  enum: ["customer", "dealer"], example: "dealer" },
            isDealer:  { type: "boolean", example: true },
            dealerData: {
              type: "object",
              description: "Presente solo se role=dealer",
              properties: {
                pIva:           { type: "string", example: "IT12345678901" },
                companyAddress: { type: "string", example: "Via Garibaldi 12, Milano" },
                profession:     { type: "string", example: "ELETTRICISTA", description: "Salvato in uppercase" },
              },
            },
            services: { type: "array", items: { type: "string" }, example: ["64f1b2c3d4e5f6a7b8c9d0e2"], description: "Array di _id dei servizi del dealer" },
            orders:   { type: "array", items: { type: "string" }, example: ["64f1b2c3d4e5f6a7b8c9d0e4"], description: "Array di _id degli ordini del customer" },
          },
        },

        /* ── SERVIZIO ── */
        Service: {
          type: "object",
          properties: {
            _id:         { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" },
            name:        { type: "string", example: "Impianto elettrico appartamento" },
            description: { type: "string", example: "Realizzazione impianto fino a 100mq, quadro CEI 64-8, certificazione IMQ." },
            cost:        { type: "number", example: 1800 },
            dealer: {
              type: "object",
              description: "In GET /services: name+lastname+username+city. In GET /services/:id: solo username.",
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
      { name: "Dealers",  description: "Elenco e ricerca dealer per professione" },
      { name: "Services", description: "Servizi offerti dai dealer" },
      { name: "Comments", description: "Commenti sui servizi (solo chi ha un ordine)" },
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
              "Conserva entrambi: l'access token per le chiamate protette, il refresh token per rinnovarlo.",
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
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Login effettuato" }, refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." } } } } },
            },
            401: { description: "Credenziali non valide",     content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
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
            401: { description: "Refresh token mancante" },
            403: { description: "Refresh token non valido o scaduto" },
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
              "- `profession` viene salvata in **uppercase** internamente\n" +
              "- Risponde con access token nell'header `Authorization` e refresh token nel body\n\n" +
              "> Restituisce 409 se l'email è già registrata.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password", "name", "lastname", "email", "phone", "role"],
                  properties: {
                    username:   { type: "string",  example: "chiara_m" },
                    password:   { type: "string",  example: "Password123!" },
                    name:       { type: "string",  example: "Chiara" },
                    lastname:   { type: "string",  example: "Marino" },
                    email:      { type: "string",  format: "email", example: "chiara.marino@gmail.com" },
                    phone:      { type: "string",  example: "3478889900" },
                    age:        { type: "integer", example: 28 },
                    address:    { type: "string",  example: "Via Roma 5" },
                    city:       { type: "string",  example: "Milano" },
                    role:       { type: "string",  enum: ["customer", "dealer"], example: "customer" },
                    isDealer:   { type: "boolean", example: false },
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
                    value: { username: "chiara_m", password: "Password123!", name: "Chiara", lastname: "Marino", email: "chiara.marino@gmail.com", phone: "3478889900", age: 28, city: "Milano", role: "customer", isDealer: false },
                  },
                  dealer: {
                    summary: "Registra dealer",
                    value: { username: "marco_elettrico", password: "Password123!", name: "Marco", lastname: "Rossi", email: "marco.rossi@elettrica.it", phone: "3471234567", age: 42, address: "Via Garibaldi 12", city: "Milano", role: "dealer", isDealer: true, dealerData: { pIva: "IT12345678901", companyAddress: "Via Garibaldi 12, Milano", profession: "Elettricista" } },
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
            409: { description: "Email già registrata", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/users/allusers": {
        get: {
          tags: ["Users"],
          summary: "Lista tutti gli utenti",
          description: "Restituisce tutti gli utenti registrati (customer e dealer). Non richiede autenticazione.",
          responses: {
            200: { description: "Lista utenti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
            404: { description: "Nessun utente trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/users/{_id}": {
        get: {
          tags: ["Users"],
          summary: "Dettaglio utente per ID",
          description: "Restituisce il profilo completo di un utente tramite il suo `_id` MongoDB.",
          parameters: [{ name: "_id", in: "path", required: true, description: "_id MongoDB dell'utente", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          responses: {
            200: { description: "Utente trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/UserPublic" } } } },
            404: { description: "Utente inesistente" },
            500: { description: "Errore interno del server" },
          },
        },
        patch: {
          tags: ["Users"],
          summary: "Aggiorna utente 🔒",
          description:
              "Aggiorna i campi dell'utente. Regole speciali:\n\n" +
              "- **`balance`** → viene **sommato** al saldo corrente (es. `balance: 100` aggiunge 100€, non sostituisce)\n" +
              "- **`password`** → viene re-hashata automaticamente (hook pre-save bcrypt)\n" +
              "- **Downgrade `dealer → customer`** → operazione a cascata irreversibile:\n" +
              "  1. Tutti i servizi del dealer vengono **eliminati**\n" +
              "  2. Gli ordini *in corso* vengono **annullati**\n" +
              "  3. I clienti che avevano già pagato ricevono un **rimborso automatico** (paymentStatus=rimborsato)\n" +
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
                    balance:  { type: "number",  example: 100, description: "Importo da AGGIUNGERE al saldo corrente" },
                    password: { type: "string",  example: "NuovaPassword456!" },
                    role:     { type: "string",  enum: ["customer"], description: "Passare 'customer' se il dealer vuole rinunciare al ruolo (cascade irreversibile)" },
                  },
                },
                examples: {
                  topup:     { summary: "Ricarica +100€",          value: { balance: 100 } },
                  city:      { summary: "Cambia città",            value: { city: "Torino" } },
                  password:  { summary: "Cambia password",         value: { password: "NuovaPassword456!" } },
                  downgrade: { summary: "Dealer → customer (CASCADE)", value: { role: "customer", isDealer: false } },
                },
              },
            },
          },
          responses: {
            200: { description: "Utente aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, newUser: { $ref: "#/components/schemas/UserPublic" } } } } } },
            401: { description: "Non autenticato" },
            404: { description: "Utente non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
        delete: {
          tags: ["Users"],
          summary: "Elimina utente 🔒",
          description: "Elimina definitivamente l'account. Solo l'utente stesso (o admin) dovrebbe poter invocare questa route.",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          responses: {
            200: { description: "Utente eliminato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Utente eliminato con successo" } } } } } },
            404: { description: "Utente non trovato" },
            500: { description: "Errore interno del server" },
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
          description: "Restituisce tutti gli utenti con `role=dealer`. Utile per la pagina DealersList.",
          responses: {
            200: { description: "Lista dealer", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
            404: { description: "Nessun fornitore trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/users/professions/{profession}": {
        get: {
          tags: ["Dealers"],
          summary: "Dealer per professione",
          description:
              "Filtra i dealer per campo `dealerData.profession`.\n\n" +
              "> Il valore viene convertito in **uppercase** internamente: `elettricista` → `ELETTRICISTA`.",
          parameters: [{
            name: "profession", in: "path", required: true,
            description: "Professione da cercare (case-insensitive)",
            schema: { type: "string", example: "Elettricista" },
          }],
          responses: {
            200: { description: "Dealer trovati", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
            404: { description: "Nessun professionista trovato con quella professione" },
            500: { description: "Errore interno del server" },
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
            404: { description: "Nessun servizio trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/services/{serviceId}": {
        get: {
          tags: ["Services"],
          summary: "Dettaglio servizio",
          description:
              "Restituisce il servizio con commenti e dealer.\n\n" +
              "- `comments.user` → popolato con `_id` e `username`\n" +
              "- `dealer` → popolato con solo `username`",
          parameters: [{ name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } }],
          responses: {
            200: { description: "Servizio trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Service" } } } },
            404: { description: "Servizio non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/services/{serviceId}/comments": {
        get: {
          tags: ["Comments"],
          summary: "Commenti di un servizio",
          description: "Restituisce l'array grezzo dei commenti dal documento Service. Non richiede autenticazione.",
          parameters: [{ name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } }],
          responses: {
            200: { description: "Lista commenti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Comment" } } } } },
            404: { description: "Nessun commento trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/users/{_id}/services/new": {
        post: {
          tags: ["Services"],
          summary: "Crea servizio",
          description:
              "Crea un nuovo servizio associato al dealer identificato da `_id`.\n\n" +
              "- Verifica che l'utente esista e abbia `role=dealer`\n" +
              "- Aggiunge automaticamente il `_id` del servizio all'array `services` del dealer\n\n" +
              "> ⚠ Questa route **non ha** il middleware `auth` nel backend attuale.",
          parameters: [{ name: "_id", in: "path", required: true, description: "_id del dealer", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "description", "cost"],
                  properties: {
                    name:        { type: "string", example: "Impianto elettrico appartamento" },
                    description: { type: "string", example: "Realizzazione impianto fino a 100mq, quadro CEI 64-8, certificazione IMQ." },
                    cost:        { type: "number", example: 1800 },
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
            403: { description: "L'utente non è un dealer" },
            404: { description: "Utente non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/users/{_id}/services": {
        get: {
          tags: ["Services"],
          summary: "Servizi del dealer 🔒",
          description: "Restituisce tutti i servizi creati dal dealer con `userId`. Usato nella pagina 'I miei servizi'.",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, description: "userId del dealer (parametro path è :userId nel router)", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
          responses: {
            200: { description: "Lista servizi del dealer", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Service" } } } } },
            404: { description: "Nessun servizio trovato per questo dealer" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/users/{_id}/services/{serviceId}": {
        patch: {
          tags: ["Services"],
          summary: "Aggiorna servizio 🔒",
          description:
              "Modifica `name`, `description` e/o `cost` di un servizio esistente.\n\n" +
              "- Verifica che l'utente sia un dealer\n" +
              "- Non verifica che il servizio appartenga al dealer (verificare lato client)",
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
                  costo:       { summary: "Aggiorna solo il prezzo",       value: { cost: 2000 } },
                  completo:    { summary: "Aggiorna tutto",                value: { name: "Impianto aggiornato", description: "Nuova descrizione.", cost: 2200 } },
                },
              },
            },
          },
          responses: {
            200: { description: "Servizio aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, service: { $ref: "#/components/schemas/Service" } } } } } },
            403: { description: "Utente non è un dealer" },
            404: { description: "Utente o servizio non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
        delete: {
          tags: ["Services"],
          summary: "Elimina servizio 🔒",
          description:
              "Elimina il servizio e rimuove il suo `_id` dall'array `services` del dealer con `$pull`.\n\n" +
              "- Verifica che il servizio appartenga al dealer che fa la richiesta (`service.dealer === userId`)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } },
          ],
          responses: {
            200: { description: "Servizio eliminato con successo" },
            403: { description: "Non autorizzato — il servizio non appartiene a questo dealer" },
            404: { description: "Servizio non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      /* ═══════════════════════════════════════════════════════════════
         COMMENTS
      ═══════════════════════════════════════════════════════════════ */
      "/users/{_id}/services/{serviceId}/comments/new": {
        post: {
          tags: ["Comments"],
          summary: "Aggiungi commento",
          description:
              "Aggiunge un commento al servizio.\n\n" +
              "**Vincoli:**\n" +
              "- Il customer deve avere almeno un ordine relativo a quel servizio nell'array `orders`\n" +
              "- Il dealer non può commentare i **propri** servizi (401)\n\n" +
              "> ⚠ Questa route **non ha** il middleware `auth` nel backend attuale.",
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
            200: { description: "Commento aggiunto con successo" },
            401: { description: "Il dealer non può commentare il proprio servizio" },
            403: { description: "Nessun ordine relativo a questo servizio" },
            404: { description: "Utente o servizio non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/users/{_id}/services/{serviceId}/comments/{commentId}": {
        patch: {
          tags: ["Comments"],
          summary: "Modifica commento 🔒",
          description: "Aggiorna il testo di un commento. Solo l'autore del commento (`comment.user === userId`) può modificarlo.",
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
            200: { description: "Commento modificato con successo" },
            403: { description: "Non sei autorizzato a modificare questo commento" },
            404: { description: "Servizio o commento non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
        delete: {
          tags: ["Comments"],
          summary: "Elimina commento 🔒",
          description:
              "Rimuove un commento dall'array `comments` del servizio tramite `$pull`.\n\n" +
              "- Trova il servizio cercando `comments._id === commentId`\n" +
              "- Verifica che `comment.user === userId` (solo l'autore può eliminare)\n" +
              "- Solo i **customer** dovrebbero invocare questa route (controllo lato frontend)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",       in: "path", required: true, description: "_id dell'autore del commento", schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e5" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } },
            { name: "commentId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e3" } },
          ],
          responses: {
            200: { description: "Commento eliminato con successo", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Commento eliminato con successo" } } } } } },
            403: { description: "Non autorizzato — non sei l'autore del commento" },
            404: { description: "Commento non trovato" },
            500: { description: "Errore interno del server" },
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
              "Restituisce gli ordini filtrati per ruolo:\n\n" +
              "- **`?type=received`** → ordini ricevuti dal dealer (field `dealer === userId`)\n" +
              "  - Popola: `service.name`, `customer.name lastname`\n" +
              "- **Qualsiasi altro valore (o assente)** → ordini effettuati dal customer (field `customer === userId`)\n" +
              "  - Popola: `service.name cost`, `dealer.name lastname`\n\n" +
              "> L'identity del chiamante viene verificata dal JWT (`req.user.id`), non dal path `_id`.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "_id",  in: "path",  required: true,  schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } },
            { name: "type", in: "query", required: false,
              description: "Filtra per tipo. `received` = ordini ricevuti dal dealer. Ometti o usa qualsiasi altro valore per ordini effettuati.",
              schema: { type: "string", enum: ["received"], example: "received" } },
          ],
          responses: {
            200: { description: "Lista ordini", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } },
            404: { description: "Nessun ordine trovato" },
            500: { description: "Errore interno del server" },
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
              "- `finalCost` e `serviceName` sono **snapshot** del servizio al momento dell'ordine (rimangono invariati anche se il servizio viene modificato o eliminato)\n" +
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
            403: { description: "Non autorizzato — il dealer non può ordinare il proprio servizio" },
            404: { description: "Servizio non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/orders/{_id}": {
        get: {
          tags: ["Orders"],
          summary: "Dettaglio ordine 🔒",
          description:
              "Restituisce un ordine completo con populate.\n\n" +
              "- Accessibile solo dal dealer o dal customer dell'ordine\n" +
              "- Popola: `service.name cost`, `dealer.username name lastname`, `customer.username name lastname`",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: { description: "Ordine trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
            403: { description: "Non autorizzato — non sei il dealer né il customer dell'ordine" },
            404: { description: "Ordine non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
        patch: {
          tags: ["Orders"],
          summary: "Aggiorna stato ordine 🔒",
          description:
              "Comportamento differenziato per ruolo (ricavato dal JWT):\n\n" +
              "**Dealer** — aggiorna `orderStatus`:\n" +
              "- `completato` + `paymentStatus=effettuato` → accredita `finalCost` al saldo del dealer\n" +
              "- `annullato` + `paymentStatus=effettuato` → rimborsa il customer (`balance += finalCost`), imposta `paymentStatus=rimborsato`\n\n" +
              "**Customer** — aggiorna `paymentStatus` (es. segna come da effettuare, ma il pagamento reale avviene tramite `/pay`)",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orderStatus:   { type: "string", enum: ["in corso", "completato", "annullato"] },
                    paymentStatus: { type: "string", enum: ["da effettuare", "effettuato", "annullato", "rimborsato"] },
                  },
                },
                examples: {
                  dealer_completa: { summary: "Dealer: completa ordine",        value: { orderStatus: "completato" } },
                  dealer_annulla:  { summary: "Dealer: annulla ordine",         value: { orderStatus: "annullato" } },
                  customer_update: { summary: "Customer: aggiorna paymentStatus", value: { paymentStatus: "effettuato" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Ordine aggiornato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, order: { $ref: "#/components/schemas/Order" } } } } } },
            404: { description: "Ordine, dealer o customer non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/orders/{_id}/pay": {
        post: {
          tags: ["Orders"],
          summary: "Paga ordine 🔒",
          description:
              "Esegue il pagamento scalando `finalCost` dal saldo del customer.\n\n" +
              "**Vincoli:**\n" +
              "- Solo il customer dell'ordine può pagare\n" +
              "- L'ordine non deve essere già pagato (`paymentStatus !== 'effettuato'`)\n" +
              "- L'ordine non deve essere annullato\n" +
              "- Il saldo del customer deve essere ≥ `finalCost`\n\n" +
              "> Il dealer riceve i fondi solo quando clicca *Completa* (PATCH `orderStatus=completato`).",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" } }],
          responses: {
            200: {
              description: "Pagamento effettuato",
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Pagamento effettuato con successo" }, order: { $ref: "#/components/schemas/Order" }, newBalance: { type: "number", example: 300, description: "Nuovo saldo del customer dopo il pagamento" } } } } },
            },
            400: { description: "Saldo insufficiente / ordine già pagato / ordine annullato" },
            403: { description: "Non autorizzato — non sei il customer dell'ordine" },
            404: { description: "Ordine o utente non trovato" },
            500: { description: "Errore interno del server" },
          },
        },
      },

      "/orders/{_id}/pdf": {
        get: {
          tags: ["Orders"],
          summary: "Scarica ricevuta PDF 🔒",
          description:
              "Genera e invia la ricevuta di pagamento in formato PDF tramite **pdfkit** (stream in memoria).\n\n" +
              "**Vincoli:**\n" +
              "- Solo il customer dell'ordine può scaricare la ricevuta\n" +
              "- L'ordine deve avere `paymentStatus=effettuato`\n\n" +
              "**Contenuto del PDF:**\n" +
              "- ID ordine e data\n" +
              "- Nome servizio e importo pagato\n" +
              "- Dati dealer (nome, cognome, username)\n" +
              "- Dati customer (nome, cognome, username)",
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
            403: { description: "Non autorizzato — non sei il customer, oppure ordine non ancora pagato" },
            404: { description: "Ordine non trovato" },
            500: { description: "Errore interno del server" },
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