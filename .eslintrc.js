module.exports = {
  extends: 'jss',
  plugins: ['flowtype'],
  globals: { $PropertyType: true },
  env: {
    browser: true,
  },
};