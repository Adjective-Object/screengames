import server from './app';
server().listen(8080, () => {
  console.log('server running on port 8080');
});
