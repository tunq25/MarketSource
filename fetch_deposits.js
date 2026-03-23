fetch('http://localhost:3000/api/deposits')
  .then(res => res.text())
  .then(text => console.log('Response:', text))
  .catch(err => console.error(err));
