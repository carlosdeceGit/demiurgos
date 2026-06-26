// Cliente minimalista para la API REST de Apify (sin SDK, sin dependencias extra)

const BASE = "https://api.apify.com/v2";

function token() {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN no configurado");
  return t;
}

export type RunOptions = {
  actorId: string;
  input: Record<string, unknown>;
  webhookUrl: string;
  webhookPayload: Record<string, unknown>; // se reenvía al webhook tal cual
};

// Lanza un actor de Apify y configura el webhook para cuando termine.
export async function startRun(opts: RunOptions): Promise<string> {
  // Apify acepta webhooks como parte del cuerpo (campo "webhooks")
  const body = {
    ...opts.input,
    // Este campo es ignorado por el actor pero lo llevamos en el payload del webhook
  };

  const webhooks = [
    {
      eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED"],
      requestUrl: opts.webhookUrl,
      payloadTemplate: JSON.stringify({
        ...opts.webhookPayload,
        runId: "{{runId}}",
        status: "{{eventType}}",
        datasetId: "{{defaultDatasetId}}",
      }),
    },
  ];

  const res = await fetch(
    `${BASE}/acts/${opts.actorId}/runs?token=${token()}&webhooks=${encodeURIComponent(
      Buffer.from(JSON.stringify(webhooks)).toString("base64")
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify startRun error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { data: { id: string } };
  return data.data.id;
}

// Modo síncrono: lanza el actor y espera a que termine devolviendo los items.
// Usa el endpoint run-sync-get-dataset-items de Apify.
// Adecuado para 1 post (~10–20 s) o ~40 posts de perfil (~30–60 s).
export async function runSync<T = Record<string, unknown>>(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 90
): Promise<T[]> {
  const url =
    `${BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items` +
    `?token=${token()}&timeout=${timeoutSecs}&format=json&clean=true`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((timeoutSecs + 15) * 1_000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify runSync error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T[]>;
}

// Descarga todos los items de un dataset de Apify.
export async function fetchDataset(
  datasetId: string
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${BASE}/datasets/${datasetId}/items?token=${token()}&clean=true&format=json&limit=50`
  );
  if (!res.ok) throw new Error(`Apify fetchDataset error ${res.status}`);
  return res.json() as Promise<Record<string, unknown>[]>;
}
