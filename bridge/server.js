import express from 'express';
import * as api from '@actual-app/api';

const app = express();
let ready = false;

async function connect() {
  if (ready) return;
  await api.init({
    serverURL: process.env.ACTUAL_SERVER_URL,
    password: process.env.ACTUAL_PASSWORD,
  });
  const budgets = await api.getBudgets();
  const budgetId = process.env.ACTUAL_BUDGET_ID || budgets[0]?.syncId || budgets[0]?.id;
  if (!budgetId) throw new Error("No Actual budget sync ID configured");
  await api.downloadBudget(budgetId);
  ready = true;
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use((req, res, next) => {
  if (req.get("X-API-Key") !== process.env.BRIDGE_API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
});

app.get("/accounts", async (_req, res) => {
  try {
    await connect();
    const accounts = await api.getAccounts();
    res.json(accounts.map(({ id, name, balance, closed }) => ({ id, name, balance, closed })));
  } catch (error) {
    console.error("Actual bridge connection failed:", error instanceof Error ? error.message : error);
    res.status(503).json({ error: "Actual bridge is not configured" });
  }
});

app.listen(process.env.PORT || 3000, "0.0.0.0");
