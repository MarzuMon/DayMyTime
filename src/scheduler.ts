cron.schedule("0 7 * * *", async () => {
  await runGodMode();
});