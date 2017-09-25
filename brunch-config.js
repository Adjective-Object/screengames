// See http://brunch.io for documentation.
exports.paths = {
    public:  'public',
    watched: ['client', 'vendor'],
}

exports.files = {
  javascripts: {
    joinTo: {
      'vendor.js': /node_modules/,
      'client.js': /^client/,
      'server.js': /^server/,
    }
  },
  stylesheets: {joinTo: 'client.css'}
};

exports.plugins = {
  babel: {presets: ['latest']}
};

exports.conventions = {
  assets: /assets\//     // vendor/jquery/files/jq.img
}
