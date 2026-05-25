const app = require('./src/index');
const { loadContent } = require('./src/lib/content-loader');

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`NEXUS backend running on port ${PORT}`);
  try {
    await loadContent();
  } catch (err) {
    console.error('[content-loader] Fatal:', err);
  }
});
