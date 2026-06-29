module.exports = function setupSwagger(app) {

/* ─── Spec OpenAPI ──────────────────────────────────────────────── */
const spec = {
  openapi: "3.0.3",
  info: {
    title: "DealDone API",
    description:
      "API REST della piattaforma **DealDone** — marketplace che connette clienti e fornitori con Partita IVA.\n\n" +
      "**Stack:** Node.js · Express · MongoDB · Mongoose · JWT\n\n" +
      "**Autenticazione:** Bearer JWT (access token 1h). Effettua il login, copia l'access token e incollalo nel campo **Authorize**.",
    version: "1.0.0",
  },
  servers: [{ url: `http://localhost:${process.env.PORT || 8080}`, description: "Backend DealDone" }],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      UserPublic: {
        type: "object",
        properties: {
          _id:      { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
          username: { type: "string", example: "marco_elettrico" },
          name:     { type: "string", example: "Marco" },
          lastname: { type: "string", example: "Rossi" },
          email:    { type: "string", example: "marco.rossi@elettrica.it" },
          phone:    { type: "string", example: "3471234567" },
          age:      { type: "integer", example: 42 },
          address:  { type: "string", example: "Via Garibaldi 12" },
          city:     { type: "string", example: "Milano" },
          balance:  { type: "number", example: 0 },
          role:     { type: "string", enum: ["customer", "dealer", "admin"], example: "dealer" },
          dealerData: {
            type: "object",
            properties: {
              pIva:           { type: "string", example: "IT12345678901" },
              companyAddress: { type: "string", example: "Via Garibaldi 12, Milano" },
              profession:     { type: "string", example: "Elettricista" },
            },
          },
          services: { type: "array", items: { type: "string" }, example: [] },
          orders:   { type: "array", items: { type: "string" }, example: [] },
        },
      },
      Service: {
        type: "object",
        properties: {
          _id:         { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" },
          name:        { type: "string", example: "Impianto elettrico appartamento" },
          description: { type: "string", example: "Realizzazione impianto fino a 100mq, quadro CEI 64-8, certificazione IMQ." },
          cost:        { type: "number", example: 1800 },
          dealer: {
            type: "object",
            properties: {
              _id: { type: "string" }, username: { type: "string" },
              name: { type: "string" }, lastname: { type: "string" }, city: { type: "string" },
            },
          },
          comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id:     { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e3" },
          user:    { type: "object", properties: { _id: { type: "string" }, username: { type: "string", example: "chiara_m" } } },
          comment: { type: "string", example: "Ottimo professionista, consigliato!" },
          data:    { type: "string", format: "date-time" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id:           { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e4" },
          dealer:        { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
          customer:      { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e5" },
          service:       { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" },
          finalCost:     { type: "number", example: 1800 },
          serviceName:   { type: "string", example: "Impianto elettrico appartamento" },
          orderDate:     { type: "string", format: "date-time" },
          orderStatus:   { type: "string", enum: ["in corso", "completato", "annullato"], example: "in corso" },
          paymentStatus: { type: "string", enum: ["da effettuare", "effettuato", "annullato", "rimborsato"], example: "da effettuare" },
        },
      },
      Error: {
        type: "object",
        properties: { message: { type: "string", example: "Risorsa non trovata" } },
      },
    },
  },
  tags: [
    { name: "Auth",     description: "Login e refresh token JWT" },
    { name: "Users",    description: "CRUD utenti — customer e dealer" },
    { name: "Dealers",  description: "Elenco e ricerca dealer" },
    { name: "Services", description: "Servizi offerti dai dealer" },
    { name: "Comments", description: "Commenti sui servizi" },
    { name: "Orders",   description: "Ordini, pagamenti e ricevute PDF" },
  ],
  paths: {
    /* AUTH */
    "/users/login": {
      post: {
        tags: ["Auth"],
        summary: "Login utente",
        description: "Restituisce l'**access token** nell'header `Authorization: Bearer <token>` e il **refresh token** (7d) nel body JSON.",
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
            },
          },
        },
        responses: {
          200: {
            description: "Login riuscito",
            headers: { Authorization: { schema: { type: "string", example: "Bearer eyJ..." } } },
            content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, refreshToken: { type: "string" } } } } },
          },
          401: { description: "Credenziali non valide" },
          500: { description: "Errore server" },
        },
      },
    },
    "/users/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description: "Emette un nuovo access token (1h) da un refresh token valido (7d). Non richiede `Authorization` header.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string", example: "eyJ..." } } } } },
        },
        responses: {
          200: { description: "Nuovo access token", content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string" } } } } } },
          401: { description: "Refresh token mancante" },
          403: { description: "Refresh token non valido o scaduto" },
        },
      },
    },

    /* USERS */
    "/users/new": {
      post: {
        tags: ["Users"],
        summary: "Registra nuovo utente",
        description: "Crea account customer o dealer. Se `role=dealer`, includere `dealerData`. Risponde con access token in header e refresh token nel body.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object", required: ["username","password","name","lastname","email","phone","role"],
                properties: {
                  username: { type: "string", example: "chiara_m" },
                  password: { type: "string", example: "Password123!" },
                  name:     { type: "string", example: "Chiara" },
                  lastname: { type: "string", example: "Marino" },
                  email:    { type: "string", example: "chiara.marino@gmail.com" },
                  phone:    { type: "string", example: "3478889900" },
                  age:      { type: "integer", example: 28 },
                  city:     { type: "string", example: "Milano" },
                  role:     { type: "string", enum: ["customer","dealer"], example: "customer" },
                  isDealer: { type: "boolean", example: false },
                  dealerData: {
                    type: "object", description: "Obbligatorio se role=dealer",
                    properties: {
                      pIva: { type: "string", example: "IT12345678901" },
                      companyAddress: { type: "string", example: "Via Garibaldi 12, Milano" },
                      profession: { type: "string", example: "Elettricista" },
                    },
                  },
                },
              },
              examples: {
                customer: { summary: "Customer", value: { username: "chiara_m", password: "Password123!", name: "Chiara", lastname: "Marino", email: "chiara.marino@gmail.com", phone: "3478889900", age: 28, city: "Milano", role: "customer", isDealer: false } },
                dealer:   { summary: "Dealer",   value: { username: "marco_elettrico", password: "Password123!", name: "Marco", lastname: "Rossi", email: "marco.rossi@elettrica.it", phone: "3471234567", age: 42, address: "Via Garibaldi 12", city: "Milano", role: "dealer", isDealer: true, dealerData: { pIva: "IT12345678901", companyAddress: "Via Garibaldi 12, Milano", profession: "Elettricista" } } },
              },
            },
          },
        },
        responses: {
          201: { description: "Utente registrato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, refreshToken: { type: "string" } } } } } },
          409: { description: "Email già registrata" },
          500: { description: "Errore server" },
        },
      },
    },
    "/users/allusers": {
      get: {
        tags: ["Users"],
        summary: "Lista tutti gli utenti",
        responses: {
          200: { description: "Lista utenti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
          404: { description: "Nessun utente trovato" },
        },
      },
    },
    "/users/{_id}": {
      get: {
        tags: ["Users"],
        summary: "Ottieni utente per ID",
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" } }],
        responses: {
          200: { description: "Utente trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/UserPublic" } } } },
          404: { description: "Utente inesistente" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Aggiorna utente 🔒",
        description: "Se si invia `balance`, viene **sommato** al saldo esistente (top-up). La password viene re-hashata automaticamente se modificata.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" }, city: { type: "string" },
                  balance: { type: "number", example: 100, description: "Importo da AGGIUNGERE al saldo" },
                  password: { type: "string" },
                },
              },
              examples: {
                topup:   { summary: "Ricarica +100€", value: { balance: 100 } },
                profile: { summary: "Aggiorna città", value: { city: "Torino" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Utente aggiornato" },
          401: { description: "Non autenticato" },
          404: { description: "Utente non trovato" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Elimina utente 🔒",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Utente eliminato" }, 404: { description: "Utente non trovato" } },
      },
    },

    /* DEALERS */
    "/dealers": {
      get: {
        tags: ["Dealers"],
        summary: "Lista tutti i dealer",
        responses: {
          200: { description: "Lista dealer", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
          404: { description: "Nessun fornitore trovato" },
        },
      },
    },
    "/users/professions/{profession}": {
      get: {
        tags: ["Dealers"],
        summary: "Dealer per professione",
        description: "Il valore viene convertito in uppercase internamente (`elettricista` → `ELETTRICISTA`).",
        parameters: [{ name: "profession", in: "path", required: true, schema: { type: "string", example: "Elettricista" } }],
        responses: {
          200: { description: "Dealer trovati" },
          404: { description: "Nessun professionista trovato" },
        },
      },
    },

    /* SERVICES */
    "/services": {
      get: {
        tags: ["Services"],
        summary: "Lista tutti i servizi",
        description: "Popola il campo `dealer` con `name`, `lastname`, `username`, `city`.",
        responses: {
          200: { description: "Lista servizi", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Service" } } } } },
          404: { description: "Nessun servizio trovato" },
        },
      },
    },
    "/services/{serviceId}": {
      get: {
        tags: ["Services"],
        summary: "Dettaglio servizio",
        parameters: [{ name: "serviceId", in: "path", required: true, schema: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } }],
        responses: {
          200: { description: "Servizio trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Service" } } } },
          404: { description: "Servizio non trovato" },
        },
      },
    },
    "/users/{_id}/services/new": {
      post: {
        tags: ["Services"],
        summary: "Crea servizio (dealer only)",
        description: "Solo utenti con `role=dealer` possono creare servizi. Il campo `dealer` viene impostato automaticamente dall'`_id` in URL.",
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" }, description: "_id del dealer" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object", required: ["name","description","cost"],
                properties: {
                  name:        { type: "string", example: "Impianto elettrico appartamento" },
                  description: { type: "string", example: "Realizzazione impianto fino a 100mq, quadro CEI 64-8, certificazione IMQ." },
                  cost:        { type: "number", example: 1800 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Servizio creato" },
          403: { description: "L'utente non è un dealer" },
          404: { description: "Utente non trovato" },
        },
      },
    },
    "/users/{_id}/services/{serviceId}": {
      patch: {
        tags: ["Services"],
        summary: "Aggiorna servizio 🔒",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "_id",       in: "path", required: true, schema: { type: "string" } },
          { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name:        { type: "string", example: "Impianto elettrico aggiornato" },
                  description: { type: "string" },
                  cost:        { type: "number", example: 2000 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Servizio aggiornato" },
          403: { description: "Non è un dealer" },
          404: { description: "Utente o servizio non trovato" },
        },
      },
      delete: {
        tags: ["Services"],
        summary: "Elimina servizio 🔒",
        description: "Rimuove il servizio e il suo riferimento dall'array `services` del dealer con `$pull`.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "_id",       in: "path", required: true, schema: { type: "string" } },
          { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Servizio eliminato" },
          403: { description: "Non autorizzato" },
          404: { description: "Servizio non trovato" },
        },
      },
    },
    "/users/{_id}/services": {
      get: {
        tags: ["Services"],
        summary: "Servizi del dealer 🔒",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" }, description: "userId del dealer" }],
        responses: {
          200: { description: "Lista servizi del dealer" },
          404: { description: "Nessun servizio trovato" },
        },
      },
    },

    /* COMMENTS */
    "/services/{serviceId}/comments": {
      get: {
        tags: ["Comments"],
        summary: "Commenti di un servizio",
        parameters: [{ name: "serviceId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Lista commenti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Comment" } } } } },
          404: { description: "Nessun commento" },
        },
      },
    },
    "/users/{_id}/services/{serviceId}/comments/new": {
      post: {
        tags: ["Comments"],
        summary: "Aggiungi commento",
        description: "Vincoli: il customer deve aver effettuato almeno un ordine su quel servizio. Il dealer non può commentare i propri servizi.",
        parameters: [
          { name: "_id",       in: "path", required: true, schema: { type: "string" }, description: "_id del customer" },
          { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { comments: { type: "object", properties: { comment: { type: "string", example: "Ottimo professionista, lavoro impeccabile." }, data: { type: "string", format: "date-time" } } } },
              },
            },
          },
        },
        responses: {
          200: { description: "Commento aggiunto" },
          401: { description: "Il dealer non può commentare il proprio servizio" },
          403: { description: "Nessun ordine relativo a questo servizio" },
          404: { description: "Utente o servizio non trovato" },
        },
      },
    },
    "/users/{_id}/services/{serviceId}/comments/{commentId}": {
      patch: {
        tags: ["Comments"],
        summary: "Modifica commento 🔒",
        description: "Solo l'autore può modificare il proprio commento.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "_id",       in: "path", required: true, schema: { type: "string" } },
          { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
          { name: "commentId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { comments: { type: "object", properties: { comment: { type: "string", example: "Commento aggiornato." } } } } },
            },
          },
        },
        responses: {
          200: { description: "Commento modificato" },
          403: { description: "Non autorizzato" },
          404: { description: "Commento non trovato" },
        },
      },
    },

    /* ORDERS */
    "/users/{_id}/orders": {
      get: {
        tags: ["Orders"],
        summary: "Ordini dell'utente 🔒",
        description: "`?type=received` → ordini ricevuti dal dealer. Senza parametro → ordini del customer.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "_id",  in: "path",  required: true,  schema: { type: "string" } },
          { name: "type", in: "query", required: false, schema: { type: "string", enum: ["received"] } },
        ],
        responses: {
          200: { description: "Lista ordini" },
          404: { description: "Nessun ordine trovato" },
        },
      },
    },
    "/orders/checkout": {
      post: {
        tags: ["Orders"],
        summary: "Crea ordine 🔒",
        description: "Il `customer` è ricavato dal JWT. `finalCost` e `serviceName` sono snapshot del servizio al momento dell'ordine.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["serviceId"], properties: { serviceId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" } } },
            },
          },
        },
        responses: {
          201: { description: "Ordine creato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, order: { $ref: "#/components/schemas/Order" } } } } } },
          403: { description: "Non autorizzato" },
          404: { description: "Servizio non trovato" },
        },
      },
    },
    "/orders/{_id}": {
      get: {
        tags: ["Orders"],
        summary: "Dettaglio ordine 🔒",
        description: "Accessibile solo da dealer o customer dell'ordine. Popola `service`, `dealer`, `customer`.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Ordine trovato", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
          403: { description: "Non autorizzato" },
          404: { description: "Ordine non trovato" },
        },
      },
      patch: {
        tags: ["Orders"],
        summary: "Aggiorna stato ordine 🔒",
        description: "**Dealer** → aggiorna `orderStatus`:\n- `completato` + paymentStatus=effettuato → accredita `finalCost` al dealer\n- `annullato` + paymentStatus=effettuato → rimborsa il customer, imposta paymentStatus=rimborsato\n\n**Customer** → aggiorna `paymentStatus`.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orderStatus:   { type: "string", enum: ["in corso","completato","annullato"] },
                  paymentStatus: { type: "string", enum: ["da effettuare","effettuato","annullato","rimborsato"] },
                },
              },
              examples: {
                dealer_completa: { summary: "Dealer: completa",     value: { orderStatus: "completato" } },
                dealer_annulla:  { summary: "Dealer: annulla",      value: { orderStatus: "annullato" } },
                customer_paga:   { summary: "Customer: segna pagato", value: { paymentStatus: "effettuato" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Ordine aggiornato" },
          404: { description: "Ordine non trovato" },
        },
      },
    },
    "/orders/{_id}/pay": {
      post: {
        tags: ["Orders"],
        summary: "Paga ordine 🔒",
        description: "Scala `finalCost` dal saldo del customer. Il dealer riceve i fondi solo quando clicca *Completa*. Fallisce se saldo insufficiente, già pagato, o ordine annullato.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Pagamento effettuato", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, order: { $ref: "#/components/schemas/Order" }, newBalance: { type: "number", example: 300 } } } } } },
          400: { description: "Saldo insufficiente / già pagato / ordine annullato" },
          403: { description: "Non autorizzato" },
          404: { description: "Ordine non trovato" },
        },
      },
    },
    "/orders/{_id}/pdf": {
      get: {
        tags: ["Orders"],
        summary: "Scarica ricevuta PDF 🔒",
        description: "Genera la ricevuta in memoria con **pdfkit** e la invia come stream. Disponibile solo se `paymentStatus=effettuato`. Solo il customer dell'ordine può accedervi.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "_id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "PDF generato", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } },
          403: { description: "Non autorizzato o ordine non ancora pagato" },
          404: { description: "Ordine non trovato" },
        },
      },
    },
  },
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
  <style>body{margin:0;background:#fafafa}.swagger-ui .topbar{background:#1a1a2e}.swagger-ui .topbar .download-url-wrapper{display:none}</style>
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
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 2,
    docExpansion: "list",
    persistAuthorization: true
  });
</script>
</body>
</html>`);
});

};
