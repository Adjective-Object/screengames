let fs = require('fs');

// See http://brunch.io for documentation.
exports.paths = {
    public:  'public',
    watched: ['client', 'vendor', 'util'],
}

exports.files = {
  javascripts: {
    joinTo: {
      'vendor.js': /node_modules/,
      'client.js': /^(client|util)/,
      'server.js': /^server/,
    }
  },
  stylesheets: {joinTo: 'client.css'}
};

exports.plugins = {
  babel: JSON.parse(fs.readFileSync('./.babelrc', 'utf-8')),
};

exports.conventions = {
  assets: /assets\//,     // vendor/jquery/files/jq.img
  ignored: /^(bower_components|node_modules|vendor)/,
};

exports.npm = {
  globals: {
    Handlebars: 'handlebars',
  },
};
