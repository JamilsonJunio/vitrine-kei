export async function onRequest(context) {
  const { request, env } = context;
  const store = env.STORE_DATA; // Namespace do KV

  if (!store) {
    return new Response(JSON.stringify({ error: "Banco de dados (KV) não configurado no Cloudflare." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // --- BUSCAR DADOS (GET) ---
  if (request.method === "GET") {
    try {
      const data = await store.get("kei_sampaio_v3", { type: "json" });
      return new Response(JSON.stringify(data || {}), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // --- SALVAR DADOS (POST) ---
  if (request.method === "POST") {
    try {
      const body = await request.json();
      // Garantir que os dados são válidos antes de salvar
      if (!body.products && !body.sales) {
        throw new Error("Dados inválidos para sincronização.");
      }
      
      await store.put("kei_sampaio_v3", JSON.stringify(body));
      
      return new Response(JSON.stringify({ success: true, timestamp: Date.now() }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
