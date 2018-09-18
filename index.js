const wiki = require('wikijs').default;
const fs = require('fs');

wiki()
    .page('Roger Federer')
    .then(page => {
        return page.html();
    })
    .then( (html) => {
        fs.writeFileSync('test.html', html);
     });