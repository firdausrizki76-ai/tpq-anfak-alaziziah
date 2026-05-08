// Local development server for API
// Run: node api/dev-server.js
import 'dotenv/config';
import app from './index.js';
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ Not set'}`);
});
