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
  if (!budgets.length) throw new Error("No Actual budget found");
  await api.downloadBudget(budgets[0].syncId);
  ready = true;
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/accounts", async (_req, res) => {
  try {
    await connect();
    const accounts = await api.getAccounts();
    res.json(accounts.map(({ id, name, balance, closed }) => ({ id, name, balance, closed })));
  } catch (error) {
    res.status(503).json({ error: "Actual bridge is not configured" });
  }
});

app.listen(process.env.PORT || 3000, "0.0.0.0");
