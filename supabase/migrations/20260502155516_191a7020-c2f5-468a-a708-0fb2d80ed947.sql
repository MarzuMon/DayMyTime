-- Store the service role key in vault for the content cron job
-- Note: replace the value below — using the known service role key for this project
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZ251bG90a3Rkc3R5Y3lqc3VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5Njg2NSwiZXhwIjoyMDg3NDcyODY1fQ.PLACEHOLDER',
  'content_cron_service_role_key'
)
WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'content_cron_service_role_key');