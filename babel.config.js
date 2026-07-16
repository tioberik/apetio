module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Drizzle Expo migracije: inline .sql datoteka kao string (uz metro sourceExts 'sql').
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
